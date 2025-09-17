import { Fleet } from '../../domain/entities/fleet';
import { createVehicle } from '../../domain/entities/vehicle';
import type { FleetId } from '../../domain/object-values/fleet-id';
import { Location } from '../../domain/object-values/location';
import type { PlateNumber } from '../../domain/object-values/plate-number';
import type { UserId } from '../../domain/object-values/user-id';
import type {
  FleetExistsParams,
  FleetRepository,
} from '../../domain/repositories/fleet.repository';
import type { FleetDatabase, FleetRow } from '../database/fleet-database';

export class SQLiteFleetRepository implements FleetRepository {
  private database: FleetDatabase;

  constructor(database: FleetDatabase) {
    this.database = database;
  }

  async save(fleet: Fleet): Promise<void> {
    this.database.transaction(() => {
      // Upsert fleet
      this.database.upsertFleet(fleet.id, fleet.userId);

      // Get current vehicles in database for this fleet
      const existingVehicles = this.database.findVehiclesByFleetId(fleet.id);
      const existingPlateNumbers = new Set<PlateNumber>(
        existingVehicles.map((vehicle) => vehicle.plate_number)
      );

      const currentVehicles = fleet.getRegisteredVehicles();
      const currentPlateNumbers = new Set<PlateNumber>(
        currentVehicles.map((vehicle) => vehicle.plateNumber)
      );

      // Remove vehicles that are no longer in the fleet
      const vehiclesToRemove = [...existingPlateNumbers].filter(
        (plateNumber) => !currentPlateNumbers.has(plateNumber)
      );

      for (const plateNumber of vehiclesToRemove) {
        this.database.deleteVehicle(fleet.id, plateNumber);
      }

      // Upsert vehicles and handle locations
      for (const vehicle of currentVehicles) {
        // Upsert vehicle
        this.database.upsertVehicle(fleet.id, vehicle.plateNumber, vehicle.type);

        // Handle location - upsert if exists, delete if not
        const location = fleet.getVehicleLocation(vehicle.plateNumber);

        if (location) {
          this.database.upsertLocation(
            fleet.id,
            vehicle.plateNumber,
            location.latitude,
            location.longitude,
            location.altitude
          );
        } else {
          // Remove location if vehicle is no longer localized
          this.database.deleteLocation(fleet.id, vehicle.plateNumber);
        }
      }
    });
  }

  async findOneById(id: FleetId): Promise<Fleet | undefined> {
    const row = this.database.findOne({ id });

    if (!row) {
      return undefined;
    }

    const rows = this.database.findMany({ id: row.fleet_id, userId: row.fleet_user_id });

    return this.toDomainFromRows(rows);
  }

  async findManyByUserId(userId: UserId): Promise<Fleet[]> {
    const rows = this.database.findMany({ userId });

    // Group rows by fleet_id
    const fleetGroups = new Map<FleetId, FleetRow[]>();

    for (const row of rows) {
      if (!fleetGroups.has(row.fleet_id)) {
        fleetGroups.set(row.fleet_id, []);
      }

      fleetGroups.get(row.fleet_id)!.push(row);
    }

    // Convert each group to a Fleet domain object
    return Array.from(fleetGroups.values()).map((fleetRows) => this.toDomainFromRows(fleetRows));
  }

  async exists(params: FleetExistsParams): Promise<boolean> {
    return this.database.exists(params);
  }

  private toDomainFromRows(rows: FleetRow[]): Fleet {
    if (rows.length === 0) {
      throw new Error('Cannot create fleet from empty rows');
    }

    const firstRow = rows[0];
    const fleet = new Fleet(firstRow.fleet_id, firstRow.fleet_user_id);

    // Process all vehicles from the rows
    const processedVehicles = new Set<PlateNumber>();

    for (const row of rows) {
      if (
        row.vehicle_plate_number &&
        row.vehicle_type &&
        !processedVehicles.has(row.vehicle_plate_number)
      ) {
        const vehicle = createVehicle(
          row.vehicle_type as 'car' | 'truck' | 'motorcycle',
          row.vehicle_plate_number
        );
        fleet.registerVehicle(vehicle);
        processedVehicles.add(row.vehicle_plate_number);

        // Add location if exists
        if (
          row.latitude !== undefined &&
          row.longitude !== undefined &&
          row.latitude !== null &&
          row.longitude !== null
        ) {
          const location = new Location(row.latitude, row.longitude, row.altitude ?? undefined);
          fleet.localizeVehicle(row.vehicle_plate_number, location);
        }
      }
    }

    return fleet;
  }
}
