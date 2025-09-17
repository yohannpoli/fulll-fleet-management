import { Fleet } from '../../../domain/entities/fleet';
import { Car, Truck } from '../../../domain/entities/vehicle';
import { makeFleetId } from '../../../domain/object-values/fleet-id';
import { Location } from '../../../domain/object-values/location';
import { makePlateNumber } from '../../../domain/object-values/plate-number';
import { makeUserId } from '../../../domain/object-values/user-id';
import type { FleetDatabase, FleetRow } from '../../database/fleet-database';
import { SQLiteFleetRepository } from '../sqlite-fleet.repository';

const mockDatabase: jest.Mocked<FleetDatabase> = {
  findOne: jest.fn(),
  findMany: jest.fn(),
  findVehiclesByFleetId: jest.fn(),
  deleteFleet: jest.fn(),
  deleteLocation: jest.fn(),
  deleteVehicle: jest.fn(),
  exists: jest.fn(),
  upsertFleet: jest.fn(),
  upsertLocation: jest.fn(),
  upsertVehicle: jest.fn(),
  transaction: jest.fn(),
  clearAllFleets: jest.fn(),
  close: jest.fn(),
};

describe('SQLiteFleetRepository', () => {
  let repository: SQLiteFleetRepository;

  beforeEach(() => {
    mockDatabase.transaction.mockImplementation((fn) => fn());
    mockDatabase.findVehiclesByFleetId.mockReturnValue([]);

    repository = new SQLiteFleetRepository(mockDatabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save and findOneById', () => {
    it('should save and retrieve a fleet', async () => {
      const fleetId = makeFleetId('fleet-1');
      const userId = makeUserId('user-1');
      const fleet = new Fleet(fleetId, userId);
      const mockFleetRow: FleetRow = {
        fleet_id: fleetId,
        fleet_user_id: userId,
      };

      mockDatabase.findOne.mockReturnValue(mockFleetRow);
      mockDatabase.findMany.mockReturnValue([mockFleetRow]);

      await repository.save(fleet);

      const retrievedFleet = await repository.findOneById(fleetId);

      expect(mockDatabase.upsertFleet).toHaveBeenCalledWith(fleetId, userId);
      expect(mockDatabase.findOne).toHaveBeenCalledWith({ id: fleetId });
      expect(mockDatabase.findMany).toHaveBeenCalledWith({ id: fleetId, userId });
      expect(retrievedFleet).toBeDefined();
      expect(retrievedFleet!.id).toBe(fleetId);
      expect(retrievedFleet!.userId).toBe(userId);
    });

    it('should save and retrieve a fleet with vehicles', async () => {
      const fleetId = makeFleetId('fleet-1');
      const userId = makeUserId('user-1');
      const carPlateNumber = makePlateNumber('ABC-123');
      const truckPlateNumber = makePlateNumber('XYZ-789');
      const fleet = new Fleet(fleetId, userId);
      const car = new Car(carPlateNumber);
      const truck = new Truck(truckPlateNumber);
      const mockFleetRows: FleetRow[] = [
        {
          fleet_id: fleetId,
          fleet_user_id: userId,
          vehicle_plate_number: carPlateNumber,
          vehicle_type: 'car',
        },
        {
          fleet_id: fleetId,
          fleet_user_id: userId,
          vehicle_plate_number: truckPlateNumber,
          vehicle_type: 'truck',
        },
      ];

      fleet.registerVehicle(car);
      fleet.registerVehicle(truck);

      mockDatabase.findOne.mockReturnValue(mockFleetRows[0]);
      mockDatabase.findMany.mockReturnValue(mockFleetRows);

      await repository.save(fleet);

      const retrievedFleet = await repository.findOneById(fleetId);

      expect(mockDatabase.upsertVehicle).toHaveBeenCalledWith(fleetId, carPlateNumber, 'car');
      expect(mockDatabase.upsertVehicle).toHaveBeenCalledWith(fleetId, truckPlateNumber, 'truck');
      expect(mockDatabase.findOne).toHaveBeenCalledWith({ id: fleetId });
      expect(mockDatabase.findMany).toHaveBeenCalledWith({ id: fleetId, userId });
      expect(retrievedFleet).toBeDefined();
      expect(retrievedFleet!.getVehicleCount()).toBe(2);

      const vehicles = retrievedFleet!.getRegisteredVehicles();

      expect(vehicles).toHaveLength(2);
      expect(vehicles.some((v) => v.plateNumber === carPlateNumber && v.type === 'car')).toBe(true);
      expect(vehicles.some((v) => v.plateNumber === truckPlateNumber && v.type === 'truck')).toBe(
        true
      );
    });

    it('should save and retrieve a fleet with vehicle locations', async () => {
      const fleetId = makeFleetId('fleet-1');
      const userId = makeUserId('user-1');
      const plateNumber = makePlateNumber('ABC-123');
      const fleet = new Fleet(fleetId, userId);
      const car = new Car(plateNumber);
      const location = new Location(48.8566, 2.3522, 35);
      const mockFleetRow: FleetRow = {
        fleet_id: fleetId,
        fleet_user_id: userId,
        vehicle_plate_number: plateNumber,
        vehicle_type: 'car',
        latitude: 48.8566,
        longitude: 2.3522,
        altitude: 35,
      };

      fleet.registerVehicle(car);
      fleet.localizeVehicle(plateNumber, location);

      mockDatabase.findOne.mockReturnValue(mockFleetRow);
      mockDatabase.findMany.mockReturnValue([mockFleetRow]);

      await repository.save(fleet);

      const retrievedFleet = await repository.findOneById(fleetId);

      expect(mockDatabase.upsertVehicle).toHaveBeenCalledWith(fleetId, plateNumber, 'car');
      expect(mockDatabase.upsertLocation).toHaveBeenCalledWith(
        fleetId,
        plateNumber,
        48.8566,
        2.3522,
        35
      );
      expect(mockDatabase.findOne).toHaveBeenCalledWith({ id: fleetId });
      expect(mockDatabase.findMany).toHaveBeenCalledWith({ id: fleetId, userId });
      expect(retrievedFleet).toBeDefined();

      const retrievedLocation = retrievedFleet!.getVehicleLocation(plateNumber);

      expect(retrievedLocation).toBeDefined();
      expect(retrievedLocation!.latitude).toBe(48.8566);
      expect(retrievedLocation!.longitude).toBe(2.3522);
      expect(retrievedLocation!.altitude).toBe(35);
    });

    it('should return undefined for non-existent fleet', async () => {
      const fleetId = makeFleetId('non-existent');

      mockDatabase.findOne.mockReturnValue(undefined);

      const retrievedFleet = await repository.findOneById(fleetId);

      expect(mockDatabase.findOne).toHaveBeenCalledWith({ id: fleetId });
      expect(mockDatabase.findMany).not.toHaveBeenCalled();
      expect(retrievedFleet).toBeUndefined();
    });

    it('should update existing fleet when saving again', async () => {
      const fleetId = makeFleetId('fleet-1');
      const userId = makeUserId('user-1');
      const carPlateNumber = makePlateNumber('ABC-123');
      const truckPlateNumber = makePlateNumber('XYZ-789');
      const fleet = new Fleet(fleetId, userId);
      const car = new Car(carPlateNumber);
      const truck = new Truck(truckPlateNumber);

      fleet.registerVehicle(car);
      fleet.registerVehicle(truck);

      await repository.save(fleet);
      await repository.save(fleet);

      expect(mockDatabase.upsertFleet).toHaveBeenCalledTimes(2);
      expect(mockDatabase.upsertVehicle).toHaveBeenCalledTimes(4);
    });

    it('should remove vehicles that are no longer present in the fleet', async () => {
      const fleetId = makeFleetId('fleet-remove');
      const userId = makeUserId('user-remove');
      const remainingPlate = makePlateNumber('NEW-123');
      const removedPlate = makePlateNumber('OLD-999');
      const fleet = new Fleet(fleetId, userId);
      const remainingVehicle = new Car(remainingPlate);

      mockDatabase.findVehiclesByFleetId.mockReturnValueOnce([
        { fleet_id: fleetId, plate_number: removedPlate, vehicle_type: 'car' },
      ]);

      fleet.registerVehicle(remainingVehicle);

      await repository.save(fleet);

      expect(mockDatabase.deleteVehicle).toHaveBeenCalledWith(fleetId, removedPlate);
      expect(mockDatabase.upsertVehicle).toHaveBeenCalledWith(fleetId, remainingPlate, 'car');
    });

    it('should delete location when a vehicle has no location', async () => {
      const fleetId = makeFleetId('fleet-noloc');
      const userId = makeUserId('user-noloc');
      const plate = makePlateNumber('NO-LOC');
      const fleet = new Fleet(fleetId, userId);
      const car = new Car(plate);

      fleet.registerVehicle(car);

      await repository.save(fleet);

      expect(mockDatabase.deleteLocation).toHaveBeenCalledWith(fleetId, plate);
    });

    it('should throw when database returns empty rows for existing fleet', async () => {
      const fleetId = makeFleetId('fleet-empty-rows');
      const userId = makeUserId('user-empty-rows');
      const mockFleetRow: FleetRow = {
        fleet_id: fleetId,
        fleet_user_id: userId,
      };

      mockDatabase.findOne.mockReturnValueOnce(mockFleetRow);
      mockDatabase.findMany.mockReturnValueOnce([]);

      await expect(repository.findOneById(fleetId)).rejects.toThrow(
        'Cannot create fleet from empty rows'
      );
    });
  });

  describe('findManyByUserId', () => {
    it('should return empty array when user has no fleets', async () => {
      const userId = makeUserId('user-1');

      mockDatabase.findMany.mockReturnValue([]);

      const fleets = await repository.findManyByUserId(userId);

      expect(mockDatabase.findMany).toHaveBeenCalledWith({ userId });
      expect(fleets).toEqual([]);
    });

    it('should return all fleets for a user', async () => {
      const firstUserId = makeUserId('user-1');
      const secondUserId = makeUserId('user-2');
      const firstFleetId = makeFleetId('fleet-1');
      const secondFleetId = makeFleetId('fleet-2');
      const thirdFleetId = makeFleetId('fleet-3');
      const mockFirstUserRows: FleetRow[] = [
        { fleet_id: firstFleetId, fleet_user_id: firstUserId },
        { fleet_id: secondFleetId, fleet_user_id: firstUserId },
      ];
      const mockSecondUserRows: FleetRow[] = [
        { fleet_id: thirdFleetId, fleet_user_id: secondUserId },
      ];

      mockDatabase.findMany
        .mockReturnValueOnce(mockFirstUserRows)
        .mockReturnValueOnce(mockSecondUserRows);

      const firstUserFleets = await repository.findManyByUserId(firstUserId);
      const secondUserFleets = await repository.findManyByUserId(secondUserId);

      expect(mockDatabase.findMany).toHaveBeenCalledWith({ userId: firstUserId });
      expect(mockDatabase.findMany).toHaveBeenCalledWith({ userId: secondUserId });
      expect(firstUserFleets).toHaveLength(2);
      expect(firstUserFleets.map((f) => f.id).sort()).toEqual([firstFleetId, secondFleetId]);
      expect(secondUserFleets).toHaveLength(1);
      expect(secondUserFleets[0].id).toBe(thirdFleetId);
    });

    it('should group multiple rows for the same fleet into a single Fleet', async () => {
      const userId = makeUserId('user-group');
      const fleetId = makeFleetId('fleet-group');
      const rows: FleetRow[] = [
        { fleet_id: fleetId, fleet_user_id: userId },
        { fleet_id: fleetId, fleet_user_id: userId },
      ];

      mockDatabase.findMany.mockReturnValue(rows);

      const fleets = await repository.findManyByUserId(userId);

      expect(mockDatabase.findMany).toHaveBeenCalledWith({ userId });
      expect(fleets).toHaveLength(1);
      expect(fleets[0].id).toBe(fleetId);
    });
  });

  describe('exists', () => {
    it('should return true when fleet exists', async () => {
      const fleetId = makeFleetId('fleet-1');

      mockDatabase.exists.mockReturnValue(true);

      const result = await repository.exists({ id: fleetId });

      expect(mockDatabase.exists).toHaveBeenCalledWith({ id: fleetId });
      expect(result).toBe(true);
    });

    it('should return false for non-existent fleet', async () => {
      const fleetId = makeFleetId('non-existent');

      mockDatabase.exists.mockReturnValue(false);

      const result = await repository.exists({ id: fleetId });

      expect(mockDatabase.exists).toHaveBeenCalledWith({ id: fleetId });
      expect(result).toBe(false);
    });
  });

  describe('data integrity', () => {
    it('should handle vehicles without locations', async () => {
      const fleetId = makeFleetId('fleet-1');
      const userId = makeUserId('user-1');
      const carPlateNumber = makePlateNumber('ABC-123');
      const truckPlateNumber = makePlateNumber('XYZ-789');
      const fleet = new Fleet(fleetId, userId);
      const car = new Car(carPlateNumber);
      const truck = new Truck(truckPlateNumber);
      const location = new Location(48.8566, 2.3522);
      const mockFleetRows: FleetRow[] = [
        {
          fleet_id: fleetId,
          fleet_user_id: userId,
          vehicle_plate_number: carPlateNumber,
          vehicle_type: 'car',
          latitude: 48.8566,
          longitude: 2.3522,
        },
        {
          fleet_id: fleetId,
          fleet_user_id: userId,
          vehicle_plate_number: truckPlateNumber,
          vehicle_type: 'truck',
        },
      ];

      fleet.registerVehicle(car);
      fleet.registerVehicle(truck);
      fleet.localizeVehicle(carPlateNumber, location);

      mockDatabase.findOne.mockReturnValue(mockFleetRows[0]);
      mockDatabase.findMany.mockReturnValue(mockFleetRows);

      await repository.save(fleet);

      const retrievedFleet = await repository.findOneById(fleetId);

      expect(retrievedFleet!.getVehicleCount()).toBe(2);
      expect(retrievedFleet!.getVehicleLocation(carPlateNumber)).toBeDefined();
      expect(retrievedFleet!.getVehicleLocation(truckPlateNumber)).toBeUndefined();
    });

    it('should handle locations without altitude', async () => {
      const fleetId = makeFleetId('fleet-1');
      const userId = makeUserId('user-1');
      const plateNumber = makePlateNumber('ABC-123');
      const fleet = new Fleet(fleetId, userId);
      const car = new Car(plateNumber);
      const location = new Location(48.8566, 2.3522);
      const mockFleetRow: FleetRow = {
        fleet_id: fleetId,
        fleet_user_id: userId,
        vehicle_plate_number: plateNumber,
        vehicle_type: 'car',
        latitude: 48.8566,
        longitude: 2.3522,
        altitude: undefined,
      };

      fleet.registerVehicle(car);
      fleet.localizeVehicle(plateNumber, location);

      mockDatabase.findOne.mockReturnValue(mockFleetRow);
      mockDatabase.findMany.mockReturnValue([mockFleetRow]);

      await repository.save(fleet);

      const retrievedFleet = await repository.findOneById(fleetId);

      expect(mockDatabase.upsertLocation).toHaveBeenCalledWith(
        fleetId,
        plateNumber,
        48.8566,
        2.3522,
        undefined
      );
      expect(retrievedFleet).toBeDefined();

      const retrievedLocation = retrievedFleet!.getVehicleLocation(plateNumber);

      expect(retrievedLocation).toBeDefined();
      expect(retrievedLocation!.latitude).toBe(48.8566);
      expect(retrievedLocation!.longitude).toBe(2.3522);
      expect(retrievedLocation!.altitude).toBeUndefined();
    });

    it('should ignore duplicate vehicle rows when building domain', async () => {
      const fleetId = makeFleetId('fleet-dup');
      const userId = makeUserId('user-dup');
      const plate = makePlateNumber('DUP-111');
      const mockFleetRow: FleetRow = {
        fleet_id: fleetId,
        fleet_user_id: userId,
        vehicle_plate_number: plate,
        vehicle_type: 'car',
      };

      mockDatabase.findOne.mockReturnValueOnce(mockFleetRow);
      mockDatabase.findMany.mockReturnValueOnce([mockFleetRow, mockFleetRow]);

      const fleet = await repository.findOneById(fleetId);

      expect(fleet).toBeDefined();
      expect(fleet!.getVehicleCount()).toBe(1);
    });

    it('should not set location when latitude/longitude are null', async () => {
      const fleetId = makeFleetId('fleet-null-loc');
      const userId = makeUserId('user-null-loc');
      const plate = makePlateNumber('NULL-LOC');
      const baseRow: FleetRow = {
        fleet_id: fleetId,
        fleet_user_id: userId,
      };
      const nullLocationRow = {
        fleet_id: fleetId,
        fleet_user_id: userId,
        vehicle_plate_number: plate,
        vehicle_type: 'car',
        latitude: null,
        longitude: null,
      } as unknown as FleetRow;

      mockDatabase.findOne.mockReturnValueOnce(baseRow);
      mockDatabase.findMany.mockReturnValueOnce([nullLocationRow]);

      const fleet = await repository.findOneById(fleetId);

      expect(fleet).toBeDefined();
      expect(fleet!.isVehicleRegistered(plate)).toBe(true);
      expect(fleet!.getVehicleLocation(plate)).toBeUndefined();
    });
  });
});
