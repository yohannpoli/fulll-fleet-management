import { isFleetId, makeFleetId } from '../fleet-id';

describe('FleetId', () => {
  describe('makeFleetId', () => {
    it('should create a valid fleet ID', () => {
      const fleetId = makeFleetId('fleet-123');

      expect(fleetId).toBe('fleet-123');
    });

    it('should throw error for empty fleet ID', () => {
      expect(() => makeFleetId('')).toThrow('Invalid fleet ID: empty');
      expect(() => makeFleetId('   ')).toThrow('Invalid fleet ID: empty');
    });

    it('should create fleet ID with special characters', () => {
      const fleetId = makeFleetId('fleet-123-abc_def');

      expect(fleetId).toBe('fleet-123-abc_def');
    });

    it('should create fleet ID with UUID format', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const fleetId = makeFleetId(uuid);

      expect(fleetId).toBe(uuid);
    });
  });

  describe('isFleetId', () => {
    it('should return true for valid fleet ID', () => {
      expect(isFleetId('fleet-123')).toBe(true);
      expect(isFleetId('valid-fleet-id')).toBe(true);
      expect(isFleetId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should return false for empty fleet ID', () => {
      expect(isFleetId('')).toBe(false);
      expect(isFleetId('   ')).toBe(false);
    });

    it('should return false for whitespace-only fleet ID', () => {
      expect(isFleetId('  \t  ')).toBe(false);
      expect(isFleetId('\n')).toBe(false);
    });
  });
});
