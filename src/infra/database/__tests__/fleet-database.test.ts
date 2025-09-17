import fs from 'node:fs';
import { makeFleetId } from '../../../domain/object-values/fleet-id';
import { makePlateNumber } from '../../../domain/object-values/plate-number';
import { makeUserId } from '../../../domain/object-values/user-id';
import { SQLiteFleetDatabase } from '../fleet-database';

const mockPragma = jest.fn();
const mockExec = jest.fn();
const mockPrepare = jest.fn();
const mockClose = jest.fn();
const mockTransaction = jest.fn();

const mockDatabase = {
  pragma: mockPragma,
  exec: mockExec,
  prepare: mockPrepare,
  close: mockClose,
  transaction: mockTransaction,
};

const mockStatement = {
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
};

jest.mock('better-sqlite3', () => {
  return jest.fn(() => mockDatabase);
});

describe('SQLiteFleetDatabase', () => {
  let database: SQLiteFleetDatabase;

  beforeEach(() => {
    mockPrepare.mockReturnValue(mockStatement);
    mockTransaction.mockImplementation((fn) => () => fn());

    database = new SQLiteFleetDatabase(':memory:');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor (directory creation)', () => {
    it('should create database directory when using file-backed path and directory is missing', () => {
      const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const mkdirSpy = jest
        .spyOn(fs, 'mkdirSync')
        .mockImplementation(
          (_path: fs.PathLike, _options?: fs.Mode | fs.MakeDirectoryOptions | null) => {
            return undefined;
          }
        );

      const fileBackedPath = './tmp-data/fleets.db';
      new SQLiteFleetDatabase(fileBackedPath);

      expect(existsSpy).toHaveBeenCalledWith('./tmp-data');
      expect(mkdirSpy).toHaveBeenCalledWith('./tmp-data', { recursive: true });

      existsSpy.mockRestore();
      mkdirSpy.mockRestore();
    });

    it('should not create database directory when it already exists', () => {
      const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const mkdirSpy = jest
        .spyOn(fs, 'mkdirSync')
        .mockImplementation(
          (_path: fs.PathLike, _options?: fs.Mode | fs.MakeDirectoryOptions | null) => {
            return undefined;
          }
        );

      new SQLiteFleetDatabase('./data/fleets.db');

      expect(existsSpy).toHaveBeenCalled();
      expect(mkdirSpy).not.toHaveBeenCalled();

      existsSpy.mockRestore();
      mkdirSpy.mockRestore();
    });
  });

  describe('upsertFleet', () => {
    it('should insert a new fleet', () => {
      const fleetId = makeFleetId('fleet-1');
      const userId = makeUserId('user-1');

      database.upsertFleet(fleetId, userId);

      expect(mockPrepare).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO fleets (id, user_id) VALUES (?, ?)'
      );
      expect(mockStatement.run).toHaveBeenCalledWith(fleetId, userId);
    });

    it('should update an existing fleet', () => {
      const fleetId = makeFleetId('fleet-1');
      const originalUserId = makeUserId('user-1');
      const newUserId = makeUserId('user-2');

      database.upsertFleet(fleetId, originalUserId);
      database.upsertFleet(fleetId, newUserId);

      expect(mockPrepare).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO fleets (id, user_id) VALUES (?, ?)'
      );
      expect(mockStatement.run).toHaveBeenCalledTimes(2);
      expect(mockStatement.run).toHaveBeenNthCalledWith(1, fleetId, originalUserId);
      expect(mockStatement.run).toHaveBeenNthCalledWith(2, fleetId, newUserId);
    });
  });

  describe('close', () => {
    it('should close the underlying database connection', () => {
      database.close();

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return fleet when it exists', () => {
      const fleetId = makeFleetId('fleet-1');
      const userId = makeUserId('user-1');
      const mockFleetRow = { fleet_id: fleetId, fleet_user_id: userId };

      mockStatement.get.mockReturnValue(mockFleetRow);

      const result = database.findOne({ id: fleetId });

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(mockStatement.get).toHaveBeenCalledWith(fleetId);
      expect(result).toEqual(mockFleetRow);
    });

    it('should return undefined when fleet does not exist', () => {
      const fleetId = makeFleetId('non-existent');

      mockStatement.get.mockReturnValue(undefined);

      const result = database.findOne({ id: fleetId });

      expect(mockStatement.get).toHaveBeenCalledWith(fleetId);
      expect(result).toBeUndefined();
    });
  });

  describe('findMany', () => {
    it('should return all fleets for a user', () => {
      const userId = makeUserId('user-1');
      const firstFleetId = makeFleetId('fleet-1');
      const secondFleetId = makeFleetId('fleet-2');
      const mockRows = [
        { fleet_id: firstFleetId, fleet_user_id: userId },
        { fleet_id: secondFleetId, fleet_user_id: userId },
      ];

      mockStatement.all.mockReturnValue(mockRows);

      const results = database.findMany({ userId });

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('LEFT JOIN'));
      expect(mockStatement.all).toHaveBeenCalledWith(userId);
      expect(results).toEqual(mockRows);
    });

    it('should return empty array when user has no fleets', () => {
      const userId = makeUserId('user-without-fleets');

      mockStatement.all.mockReturnValue([]);

      const results = database.findMany({ userId });

      expect(mockStatement.all).toHaveBeenCalledWith(userId);
      expect(results).toEqual([]);
    });

    it('should include vehicle and location data in results', () => {
      const userId = makeUserId('user-1');
      const fleetId = makeFleetId('fleet-1');
      const plateNumber = makePlateNumber('ABC-123');
      const mockRowWithVehicle = {
        fleet_id: fleetId,
        fleet_user_id: userId,
        vehicle_plate_number: plateNumber,
        vehicle_type: 'car',
        latitude: 48.8566,
        longitude: 2.3522,
        altitude: 100,
      };

      mockStatement.all.mockReturnValue([mockRowWithVehicle]);

      const results = database.findMany({ userId });

      expect(results).toEqual([mockRowWithVehicle]);
    });

    it('should filter by fleet id when id is provided', () => {
      const fleetId = makeFleetId('fleet-1');
      const mockRows = [{ fleet_id: fleetId, fleet_user_id: makeUserId('user-1') }];

      mockStatement.all.mockReturnValue(mockRows);

      const results = database.findMany({ id: fleetId });

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('WHERE 1 = 1'));
      expect(mockStatement.all).toHaveBeenCalledWith(fleetId);
      expect(results).toEqual(mockRows);
    });

    it('should filter by fleet id and user id when both are provided', () => {
      const fleetId = makeFleetId('fleet-1');
      const userId = makeUserId('user-1');
      const mockRows = [{ fleet_id: fleetId, fleet_user_id: userId }];

      mockStatement.all.mockReturnValue(mockRows);

      const results = database.findMany({ id: fleetId, userId });

      expect(mockStatement.all).toHaveBeenCalledWith(fleetId, userId);
      expect(results).toEqual(mockRows);
    });
  });

  describe('upsertVehicle', () => {
    it('should insert a new vehicle', () => {
      const fleetId = makeFleetId('fleet-1');
      const plateNumber = makePlateNumber('ABC-123');

      database.upsertVehicle(fleetId, plateNumber, 'car');

      expect(mockPrepare).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO vehicles (fleet_id, plate_number, vehicle_type) VALUES (?, ?, ?)'
      );
      expect(mockStatement.run).toHaveBeenCalledWith(fleetId, plateNumber, 'car');
    });

    it('should update an existing vehicle', () => {
      const fleetId = makeFleetId('fleet-1');
      const plateNumber = makePlateNumber('ABC-123');

      database.upsertVehicle(fleetId, plateNumber, 'car');
      database.upsertVehicle(fleetId, plateNumber, 'truck');

      expect(mockPrepare).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO vehicles (fleet_id, plate_number, vehicle_type) VALUES (?, ?, ?)'
      );
      expect(mockStatement.run).toHaveBeenCalledTimes(2);
      expect(mockStatement.run).toHaveBeenNthCalledWith(1, fleetId, plateNumber, 'car');
      expect(mockStatement.run).toHaveBeenNthCalledWith(2, fleetId, plateNumber, 'truck');
    });
  });

  describe('findVehiclesByFleetId', () => {
    it('should return all vehicles for a fleet', () => {
      const fleetId = makeFleetId('fleet-1');
      const firstPlate = makePlateNumber('ABC-123');
      const secondPlate = makePlateNumber('DEF-456');
      const mockVehicles = [
        { fleet_id: fleetId, plate_number: firstPlate, vehicle_type: 'car' },
        { fleet_id: fleetId, plate_number: secondPlate, vehicle_type: 'truck' },
      ];

      mockStatement.all.mockReturnValue(mockVehicles);

      const vehicles = database.findVehiclesByFleetId(fleetId);

      expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM vehicles WHERE fleet_id = ?');
      expect(mockStatement.all).toHaveBeenCalledWith(fleetId);
      expect(vehicles).toEqual(mockVehicles);
    });

    it('should return empty array when fleet has no vehicles', () => {
      const fleetId = makeFleetId('fleet-1');

      mockStatement.all.mockReturnValue([]);

      const vehicles = database.findVehiclesByFleetId(fleetId);

      expect(mockStatement.all).toHaveBeenCalledWith(fleetId);
      expect(vehicles).toEqual([]);
    });
  });

  describe('upsertLocation', () => {
    it('should insert a new location', () => {
      const fleetId = makeFleetId('fleet-1');
      const plateNumber = makePlateNumber('ABC-123');

      database.upsertLocation(fleetId, plateNumber, 48.8566, 2.3522, 100);

      expect(mockPrepare).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO vehicle_locations (fleet_id, plate_number, latitude, longitude, altitude) VALUES (?, ?, ?, ?, ?)'
      );
      expect(mockStatement.run).toHaveBeenCalledWith(fleetId, plateNumber, 48.8566, 2.3522, 100);
    });

    it('should update an existing location', () => {
      const fleetId = makeFleetId('fleet-1');
      const plateNumber = makePlateNumber('ABC-123');

      database.upsertLocation(fleetId, plateNumber, 48.8566, 2.3522, 100);
      database.upsertLocation(fleetId, plateNumber, 40.7128, -74.006, 50);

      expect(mockPrepare).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO vehicle_locations (fleet_id, plate_number, latitude, longitude, altitude) VALUES (?, ?, ?, ?, ?)'
      );
      expect(mockStatement.run).toHaveBeenCalledTimes(2);
      expect(mockStatement.run).toHaveBeenNthCalledWith(
        1,
        fleetId,
        plateNumber,
        48.8566,
        2.3522,
        100
      );
      expect(mockStatement.run).toHaveBeenNthCalledWith(
        2,
        fleetId,
        plateNumber,
        40.7128,
        -74.006,
        50
      );
    });

    it('should handle location without altitude', () => {
      const fleetId = makeFleetId('fleet-1');
      const plateNumber = makePlateNumber('ABC-123');

      database.upsertLocation(fleetId, plateNumber, 48.8566, 2.3522);

      expect(mockPrepare).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO vehicle_locations (fleet_id, plate_number, latitude, longitude, altitude) VALUES (?, ?, ?, ?, ?)'
      );
      expect(mockStatement.run).toHaveBeenCalledWith(
        fleetId,
        plateNumber,
        48.8566,
        2.3522,
        undefined
      );
    });
  });

  describe('exists', () => {
    it('should return true when fleet exists by id', () => {
      const fleetId = makeFleetId('fleet-1');

      mockStatement.get.mockReturnValue({ id: fleetId });

      const result = database.exists({ id: fleetId });

      expect(mockPrepare).toHaveBeenCalledWith('SELECT 1 FROM fleets WHERE id = ? LIMIT 1');
      expect(mockStatement.get).toHaveBeenCalledWith(fleetId);
      expect(result).toBe(true);
    });

    it('should return false when fleet does not exist by id', () => {
      const fleetId = makeFleetId('non-existent');

      mockStatement.get.mockReturnValue(undefined);

      const result = database.exists({ id: fleetId });

      expect(mockStatement.get).toHaveBeenCalledWith(fleetId);
      expect(result).toBe(false);
    });

    it('should return true when fleet exists by userId', () => {
      const userId = makeUserId('user-1');

      mockStatement.get.mockReturnValue({ user_id: userId });

      const result = database.exists({ userId });

      expect(mockPrepare).toHaveBeenCalledWith('SELECT 1 FROM fleets WHERE user_id = ? LIMIT 1');
      expect(mockStatement.get).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    it('should return false when no fleet exists for userId', () => {
      const userId = makeUserId('user-without-fleets');

      mockStatement.get.mockReturnValue(undefined);

      const result = database.exists({ userId });

      expect(mockStatement.get).toHaveBeenCalledWith(userId);
      expect(result).toBe(false);
    });

    it('should return false for unsupported params shape', () => {
      // @ts-expect-error intentional invalid shape to cover fallback branch
      const result = database.exists({ foo: 'bar' });

      expect(result).toBe(false);
    });
  });

  describe('deleteVehicle', () => {
    it('should delete a vehicle', () => {
      const fleetId = makeFleetId('fleet-1');
      const plateNumber = makePlateNumber('ABC-123');

      database.deleteVehicle(fleetId, plateNumber);

      expect(mockPrepare).toHaveBeenCalledWith(
        'DELETE FROM vehicles WHERE fleet_id = ? AND plate_number = ?'
      );
      expect(mockStatement.run).toHaveBeenCalledWith(fleetId, plateNumber);
    });
  });

  describe('deleteLocation', () => {
    it('should delete a vehicle location', () => {
      const fleetId = makeFleetId('fleet-1');
      const plateNumber = makePlateNumber('ABC-123');

      database.deleteLocation(fleetId, plateNumber);

      expect(mockPrepare).toHaveBeenCalledWith(
        'DELETE FROM vehicle_locations WHERE fleet_id = ? AND plate_number = ?'
      );
      expect(mockStatement.run).toHaveBeenCalledWith(fleetId, plateNumber);
    });
  });

  describe('deleteFleet', () => {
    it('should delete a fleet', () => {
      const fleetId = makeFleetId('fleet-1');

      database.deleteFleet(fleetId);

      expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM fleets WHERE id = ?');
      expect(mockStatement.run).toHaveBeenCalledWith(fleetId);
    });
  });

  describe('transaction', () => {
    it('should execute operations within a transaction', () => {
      const mockFn = jest.fn(() => 'success');
      const mockTransactionFn = jest.fn(() => 'success');

      mockTransaction.mockReturnValue(mockTransactionFn);

      const result = database.transaction(mockFn);

      expect(mockTransaction).toHaveBeenCalledWith(mockFn);
      expect(mockTransactionFn).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should propagate transaction errors', () => {
      const error = new Error('Transaction failed');
      const mockFn = jest.fn(() => {
        throw error;
      });
      const mockTransactionFn = jest.fn(() => {
        throw error;
      });

      mockTransaction.mockReturnValue(mockTransactionFn);

      expect(() => {
        database.transaction(mockFn);
      }).toThrow('Transaction failed');

      expect(mockTransaction).toHaveBeenCalledWith(mockFn);
    });
  });

  describe('clearAllFleets', () => {
    it('should clear all fleets in test mode', () => {
      database.clearAllFleets();

      expect(mockExec).toHaveBeenCalledWith('DELETE FROM fleets');
    });

    it('should throw error when not in test mode', () => {
      const originalEnv = process.env.NODE_ENV;

      process.env.NODE_ENV = 'production';

      expect(() => {
        database.clearAllFleets();
      }).toThrow('clearAllFleets is only available in test mode');

      process.env.NODE_ENV = originalEnv;
    });
  });
});
