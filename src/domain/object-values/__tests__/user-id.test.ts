import { isUserId, makeUserId } from '../user-id';

describe('UserId', () => {
  describe('makeUserId', () => {
    it('should create a valid user ID', () => {
      const userId = makeUserId('user-123');

      expect(userId).toBe('user-123');
    });

    it('should throw error for empty user ID', () => {
      expect(() => makeUserId('')).toThrow('Invalid user ID: empty');
      expect(() => makeUserId('   ')).toThrow('Invalid user ID: empty');
    });

    it('should create user ID with special characters', () => {
      const userId = makeUserId('user-123-abc_def');

      expect(userId).toBe('user-123-abc_def');
    });

    it('should create user ID with UUID format', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const userId = makeUserId(uuid);

      expect(userId).toBe(uuid);
    });

    it('should create user ID with email format', () => {
      const email = 'user@example.com';
      const userId = makeUserId(email);

      expect(userId).toBe(email);
    });
  });

  describe('isUserId', () => {
    it('should return true for valid user ID', () => {
      expect(isUserId('user-123')).toBe(true);
      expect(isUserId('valid-user-id')).toBe(true);
      expect(isUserId('user@example.com')).toBe(true);
      expect(isUserId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should return false for empty user ID', () => {
      expect(isUserId('')).toBe(false);
      expect(isUserId('   ')).toBe(false);
    });

    it('should return false for whitespace-only user ID', () => {
      expect(isUserId('  \t  ')).toBe(false);
      expect(isUserId('\n')).toBe(false);
    });
  });
});
