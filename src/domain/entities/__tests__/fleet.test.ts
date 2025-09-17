import { VehicleAlreadyRegisteredException } from '../../exceptions/vehicle-already-registered.exception';
import { VehicleNotFoundException } from '../../exceptions/vehicle-not-found.exception';
import { makeFleetId } from '../../object-values/fleet-id';
import { Location } from '../../object-values/location';
import { makePlateNumber } from '../../object-values/plate-number';
import { makeUserId } from '../../object-values/user-id';
import { Fleet } from '../fleet';
import { Car, Truck } from '../vehicle';

describe('Fleet', () => {
  let fleet: Fleet;
  let car: Car;
  let truck: Truck;
  let location: Location;

  beforeEach(() => {
    fleet = new Fleet(makeFleetId('fleet-1'), makeUserId('user-1'));
    car = new Car(makePlateNumber('ABC-123'));
    truck = new Truck(makePlateNumber('TRK-456'));
    location = new Location(48.8566, 2.3522, 35);
  });

  describe('registerVehicle', () => {
    it('should register a vehicle successfully', () => {
      fleet.registerVehicle(car);
      expect(fleet.isVehicleRegistered(car.plateNumber)).toBe(true);
      expect(fleet.getVehicleCount()).toBe(1);
    });

    it('should register multiple different vehicles', () => {
      fleet.registerVehicle(car);
      fleet.registerVehicle(truck);

      expect(fleet.isVehicleRegistered(car.plateNumber)).toBe(true);
      expect(fleet.isVehicleRegistered(truck.plateNumber)).toBe(true);
      expect(fleet.getVehicleCount()).toBe(2);
    });

    it('should throw error when registering same vehicle twice', () => {
      fleet.registerVehicle(car);

      expect(() => fleet.registerVehicle(car)).toThrow(VehicleAlreadyRegisteredException);
    });

    it('should throw error when registering vehicle with same plate number', () => {
      const anotherCar = new Car(makePlateNumber('ABC-123'));

      fleet.registerVehicle(car);

      expect(() => fleet.registerVehicle(anotherCar)).toThrow(VehicleAlreadyRegisteredException);
    });
  });

  describe('isVehicleRegistered', () => {
    it('should return false for unregistered vehicle', () => {
      expect(fleet.isVehicleRegistered(makePlateNumber('UNKNOWN-123'))).toBe(false);
    });

    it('should return true for registered vehicle', () => {
      fleet.registerVehicle(car);

      expect(fleet.isVehicleRegistered(car.plateNumber)).toBe(true);
    });
  });

  describe('localizeVehicle', () => {
    beforeEach(() => {
      fleet.registerVehicle(car);
    });

    it('should localize registered vehicle', () => {
      fleet.localizeVehicle(car.plateNumber, location);

      const vehicleLocation = fleet.getVehicleLocation(car.plateNumber);

      expect(vehicleLocation).toBeDefined();
      expect(vehicleLocation!.latitude).toBe(location.latitude);
      expect(vehicleLocation!.longitude).toBe(location.longitude);
      expect(vehicleLocation!.altitude).toBe(location.altitude);
    });

    it('should update vehicle location', () => {
      const firstLocation = new Location(48.8566, 2.3522, 35);
      const secondLocation = new Location(51.5074, -0.1278, 50);

      fleet.localizeVehicle(car.plateNumber, firstLocation);
      fleet.localizeVehicle(car.plateNumber, secondLocation);

      const vehicleLocation = fleet.getVehicleLocation(car.plateNumber);

      expect(vehicleLocation!.latitude).toBe(secondLocation.latitude);
      expect(vehicleLocation!.longitude).toBe(secondLocation.longitude);
      expect(vehicleLocation!.altitude).toBe(secondLocation.altitude);
    });

    it('should throw error for unregistered vehicle', () => {
      const unknownPlate = makePlateNumber('UNKNOWN-123');

      expect(() => fleet.localizeVehicle(unknownPlate, location)).toThrow(VehicleNotFoundException);
    });
  });

  describe('getVehicleLocation', () => {
    beforeEach(() => {
      fleet.registerVehicle(car);
    });

    it('should return undefined for vehicle without location', () => {
      const vehicleLocation = fleet.getVehicleLocation(car.plateNumber);

      expect(vehicleLocation).toBeUndefined();
    });

    it('should return location for localized vehicle', () => {
      fleet.localizeVehicle(car.plateNumber, location);

      const vehicleLocation = fleet.getVehicleLocation(car.plateNumber);

      expect(vehicleLocation).toBeDefined();
      expect(vehicleLocation!.latitude).toBe(location.latitude);
      expect(vehicleLocation!.longitude).toBe(location.longitude);
      expect(vehicleLocation!.altitude).toBe(location.altitude);
    });

    it('should throw error for unregistered vehicle', () => {
      expect(() => fleet.getVehicleLocation(makePlateNumber('UNKNOWN-123'))).toThrow(
        VehicleNotFoundException
      );
    });
  });

  describe('getRegisteredVehicles', () => {
    it('should return empty array for new fleet', () => {
      expect(fleet.getRegisteredVehicles()).toEqual([]);
    });

    it('should return all registered vehicles', () => {
      fleet.registerVehicle(car);
      fleet.registerVehicle(truck);

      const vehicles = fleet.getRegisteredVehicles();

      expect(vehicles).toHaveLength(2);
      expect(vehicles).toContain(car);
      expect(vehicles).toContain(truck);
    });
  });

  describe('getVehicleCount', () => {
    it('should return 0 for new fleet', () => {
      expect(fleet.getVehicleCount()).toBe(0);
    });

    it('should return correct count after registering vehicles', () => {
      expect(fleet.getVehicleCount()).toBe(0);

      fleet.registerVehicle(car);

      expect(fleet.getVehicleCount()).toBe(1);

      fleet.registerVehicle(truck);

      expect(fleet.getVehicleCount()).toBe(2);
    });
  });
});
