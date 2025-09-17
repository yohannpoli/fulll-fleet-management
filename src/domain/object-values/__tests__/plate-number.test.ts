import { isPlateNumber, makePlateNumber } from '../plate-number';

describe('PlateNumber', () => {
  describe('makePlateNumber', () => {
    it('should create a valid plate number', () => {
      const plateNumber = makePlateNumber('ABC-123');

      expect(plateNumber).toBe('ABC-123');
    });

    it('should throw error for empty plate number', () => {
      expect(() => makePlateNumber('')).toThrow('Invalid plate number: empty');
      expect(() => makePlateNumber('   ')).toThrow('Invalid plate number: empty');
    });

    it('should create plate number with various formats', () => {
      const formats = [
        'ABC-123',
        'XYZ789',
        '123-ABC',
        'CA-1234567',
        'NY-ABC-1234',
        'BIKE-789',
        'TRK-456',
      ];

      formats.forEach((format) => {
        const plateNumber = makePlateNumber(format);
        expect(plateNumber).toBe(format);
      });
    });

    it('should create plate number with special characters', () => {
      const plateNumber = makePlateNumber('ABC-123_DEF');

      expect(plateNumber).toBe('ABC-123_DEF');
    });

    it('should handle international plate number formats', () => {
      const internationalFormats = [
        'GB-ABC-123',
        'FR-1234-AB-56',
        'DE-B-MW-1234',
        'JP-品川-123-あ-45-67',
      ];

      internationalFormats.forEach((format) => {
        const plateNumber = makePlateNumber(format);
        expect(plateNumber).toBe(format);
      });
    });
  });

  describe('isPlateNumber', () => {
    it('should return true for valid plate numbers', () => {
      expect(isPlateNumber('ABC-123')).toBe(true);
      expect(isPlateNumber('XYZ789')).toBe(true);
      expect(isPlateNumber('BIKE-789')).toBe(true);
      expect(isPlateNumber('TRK-456')).toBe(true);
      expect(isPlateNumber('CA-1234567')).toBe(true);
    });

    it('should return false for empty plate number', () => {
      expect(isPlateNumber('')).toBe(false);
      expect(isPlateNumber('   ')).toBe(false);
    });

    it('should return false for whitespace-only plate number', () => {
      expect(isPlateNumber('  \t  ')).toBe(false);
      expect(isPlateNumber('\n')).toBe(false);
      expect(isPlateNumber('  \r  ')).toBe(false);
    });

    it('should return true for various valid formats', () => {
      const validFormats = [
        '123-ABC',
        'NY-ABC-1234',
        'GB-ABC-123',
        'single',
        'VERY-LONG-PLATE-NUMBER-123',
      ];

      validFormats.forEach((format) => {
        expect(isPlateNumber(format)).toBe(true);
      });
    });
  });
});
