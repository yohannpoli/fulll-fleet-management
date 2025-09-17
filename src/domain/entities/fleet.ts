import { VehicleAlreadyRegisteredException } from '../exceptions/vehicle-already-registered.exception';
import { VehicleNotFoundException } from '../exceptions/vehicle-not-found.exception';
import type { FleetId } from '../object-values/fleet-id';
import type { Location } from '../object-values/location';
import type { PlateNumber } from '../object-values/plate-number';
import type { UserId } from '../object-values/user-id';
import type { Vehicle } from './vehicle';

export class Fleet {
  private vehicles: Map<PlateNumber, Vehicle> = new Map();
  private vehicleLocations: Map<PlateNumber, Location> = new Map();

  constructor(
    public readonly id: FleetId,
    public readonly userId: UserId
  ) {}

  registerVehicle(vehicle: Vehicle): void {
    if (this.vehicles.has(vehicle.plateNumber)) {
      throw new VehicleAlreadyRegisteredException(vehicle.plateNumber);
    }

    this.vehicles.set(vehicle.plateNumber, vehicle);
  }

  isVehicleRegistered(plateNumber: PlateNumber): boolean {
    return this.vehicles.has(plateNumber);
  }

  localizeVehicle(plateNumber: PlateNumber, location: Location): void {
    if (!this.vehicles.has(plateNumber)) {
      throw new VehicleNotFoundException(plateNumber);
    }

    this.vehicleLocations.set(plateNumber, location);
  }

  getVehicleLocation(plateNumber: PlateNumber): Location | undefined {
    if (!this.vehicles.has(plateNumber)) {
      throw new VehicleNotFoundException(plateNumber);
    }

    return this.vehicleLocations.get(plateNumber);
  }

  getRegisteredVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  getVehicleCount(): number {
    return this.vehicles.size;
  }
}
