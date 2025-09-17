import { makePlateNumber } from '../../object-values/plate-number';
import { Car, createVehicle, Motorcycle, Truck } from '../vehicle';

describe('Vehicle', () => {
  describe('createVehicle factory', () => {
    it('should create car', () => {
      const vehicle = createVehicle('car', makePlateNumber('ABC-123'));

      expect(vehicle).toBeInstanceOf(Car);
      expect(vehicle.type).toBe('car');
    });

    it('should create truck', () => {
      const vehicle = createVehicle('truck', makePlateNumber('TRK-456'));

      expect(vehicle).toBeInstanceOf(Truck);
      expect(vehicle.type).toBe('truck');
    });

    it('should create motorcycle', () => {
      const vehicle = createVehicle('motorcycle', makePlateNumber('BIKE-789'));

      expect(vehicle).toBeInstanceOf(Motorcycle);
      expect(vehicle.type).toBe('motorcycle');
    });

    it('should throw error for unknown vehicle type', () => {
      expect(() =>
        createVehicle('plane' as 'car' | 'truck' | 'motorcycle', makePlateNumber('FLY-123'))
      ).toThrow('Unsupported vehicle type: plane');
    });
  });
});
