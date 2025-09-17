import { Location } from '../location';

describe('Location', () => {
  describe('constructor', () => {
    it('should create location with valid coordinates', () => {
      const location = new Location(48.8566, 2.3522);

      expect(location.latitude).toBe(48.8566);
      expect(location.longitude).toBe(2.3522);
    });

    it('should throw error for invalid latitude', () => {
      expect(() => new Location(91, 0)).toThrow('Latitude must be between -90 and 90 degrees');
      expect(() => new Location(-91, 0)).toThrow('Latitude must be between -90 and 90 degrees');
    });

    it('should throw error for invalid longitude', () => {
      expect(() => new Location(0, 181)).toThrow('Longitude must be between -180 and 180 degrees');
      expect(() => new Location(0, -181)).toThrow('Longitude must be between -180 and 180 degrees');
    });

    it('should throw error for invalid altitude', () => {
      expect(() => new Location(48.8566, 2.3522, -11001)).toThrow(
        'Altitude cannot be below -11000 meters (Mariana Trench)'
      );
    });

    it('should accept valid boundary values', () => {
      expect(() => new Location(90, 180)).not.toThrow();
      expect(() => new Location(-90, -180)).not.toThrow();
    });
  });
});
