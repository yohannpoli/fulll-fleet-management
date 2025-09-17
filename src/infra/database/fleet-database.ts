import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { FleetId } from '../../domain/object-values/fleet-id';
import type { PlateNumber } from '../../domain/object-values/plate-number';
import type { UserId } from '../../domain/object-values/user-id';
import type { FleetExistsParams } from '../../domain/repositories/fleet.repository';

export interface FleetRow {
  fleet_id: FleetId;
  fleet_user_id: UserId;
  vehicle_plate_number?: PlateNumber;
  vehicle_type?: 'car' | 'truck' | 'motorcycle';
  latitude?: number;
  longitude?: number;
  altitude?: number;
}

interface VehicleRow {
  fleet_id: FleetId;
  plate_number: PlateNumber;
  vehicle_type: 'car' | 'truck' | 'motorcycle';
}

interface FindOneParams {
  id: FleetId;
}

type FindManyParams =
  | {
      userId: UserId;
    }
  | {
      id: FleetId;
    }
  | {
      id: FleetId;
      userId: UserId;
    };

export interface FleetDatabase {
  findOne({ id }: FindOneParams): FleetRow | undefined;
  findMany(params: FindManyParams): FleetRow[];
  findVehiclesByFleetId(fleetId: FleetId): VehicleRow[];
  deleteFleet(fleetId: FleetId): void;
  deleteLocation(fleetId: FleetId, plateNumber: PlateNumber): void;
  deleteVehicle(fleetId: FleetId, plateNumber: PlateNumber): void;
  exists(params: FleetExistsParams): boolean;
  upsertFleet(fleetId: FleetId, userId: UserId): void;
  upsertLocation(
    fleetId: FleetId,
    plateNumber: PlateNumber,
    latitude: number,
    longitude: number,
    altitude?: number
  ): void;
  upsertVehicle(fleetId: FleetId, plateNumber: PlateNumber, vehicleType: string): void;
  transaction<T>(fn: () => T): T;
  clearAllFleets(): void;
  close(): void;
}

export class SQLiteFleetDatabase implements FleetDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure directory exists when using file-backed DB (skip memory DB)
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);

      if (dir && dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    this.db = new Database(dbPath);

    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.pragma('foreign_keys = ON');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS fleets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vehicles (
        fleet_id TEXT NOT NULL,
        plate_number TEXT NOT NULL,
        vehicle_type TEXT NOT NULL,
        PRIMARY KEY (fleet_id, plate_number),
        FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vehicle_locations (
        fleet_id TEXT NOT NULL,
        plate_number TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        altitude REAL,
        PRIMARY KEY (fleet_id, plate_number),
        FOREIGN KEY (fleet_id, plate_number) REFERENCES vehicles(fleet_id, plate_number) ON DELETE CASCADE
      )
    `);
  }

  findOne({ id }: FindOneParams): FleetRow | undefined {
    const stmt = this.db.prepare(`
      SELECT 
        f.id as fleet_id,
        f.user_id as fleet_user_id
      FROM fleets f
      WHERE f.id = ?
      LIMIT 1
    `);

    return stmt.get(id) as FleetRow | undefined;
  }

  findMany(params: FindManyParams): FleetRow[] {
    let sql = `
      SELECT 
        f.id as fleet_id,
        f.user_id as fleet_user_id,
        v.plate_number as vehicle_plate_number,
        v.vehicle_type,
        vl.latitude,
        vl.longitude,
        vl.altitude
      FROM fleets f
      LEFT JOIN vehicles v ON f.id = v.fleet_id
      LEFT JOIN vehicle_locations vl ON v.fleet_id = vl.fleet_id AND v.plate_number = vl.plate_number
      WHERE 1 = 1
    `;

    if ('id' in params) {
      sql += ' AND f.id = ?';
    }

    if ('userId' in params) {
      sql += ' AND f.user_id = ?';
    }

    sql += ' ORDER BY f.user_id, v.plate_number';

    const stmt = this.db.prepare(sql);
    const args = [];

    if ('id' in params) {
      args.push(params.id);
    }

    if ('userId' in params) {
      args.push(params.userId);
    }

    return stmt.all(...args) as FleetRow[];
  }

  findVehiclesByFleetId(fleetId: FleetId): VehicleRow[] {
    const stmt = this.db.prepare('SELECT * FROM vehicles WHERE fleet_id = ?');

    return stmt.all(fleetId) as VehicleRow[];
  }

  deleteLocation(fleetId: FleetId, plateNumber: PlateNumber): void {
    const stmt = this.db.prepare(
      'DELETE FROM vehicle_locations WHERE fleet_id = ? AND plate_number = ?'
    );

    stmt.run(fleetId, plateNumber);
  }

  deleteVehicle(fleetId: FleetId, plateNumber: PlateNumber): void {
    const stmt = this.db.prepare('DELETE FROM vehicles WHERE fleet_id = ? AND plate_number = ?');

    stmt.run(fleetId, plateNumber);
  }

  exists(params: FleetExistsParams): boolean {
    if ('id' in params) {
      const stmt = this.db.prepare('SELECT 1 FROM fleets WHERE id = ? LIMIT 1');

      return !!stmt.get(params.id);
    }

    if ('userId' in params) {
      const stmt = this.db.prepare('SELECT 1 FROM fleets WHERE user_id = ? LIMIT 1');

      return !!stmt.get(params.userId);
    }

    return false;
  }

  upsertFleet(fleetId: FleetId, userId: UserId): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO fleets (id, user_id) VALUES (?, ?)');

    stmt.run(fleetId, userId);
  }

  upsertVehicle(fleetId: FleetId, plateNumber: PlateNumber, vehicleType: string): void {
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO vehicles (fleet_id, plate_number, vehicle_type) VALUES (?, ?, ?)'
    );

    stmt.run(fleetId, plateNumber, vehicleType);
  }

  upsertLocation(
    fleetId: FleetId,
    plateNumber: PlateNumber,
    latitude: number,
    longitude: number,
    altitude?: number
  ): void {
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO vehicle_locations (fleet_id, plate_number, latitude, longitude, altitude) VALUES (?, ?, ?, ?, ?)'
    );

    stmt.run(fleetId, plateNumber, latitude, longitude, altitude);
  }

  transaction<T>(fn: () => T): T {
    const transaction = this.db.transaction(fn);

    return transaction();
  }

  deleteFleet(fleetId: FleetId): void {
    const stmt = this.db.prepare('DELETE FROM fleets WHERE id = ?');

    stmt.run(fleetId);
  }

  clearAllFleets(): void {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('clearAllFleets is only available in test mode');
    }

    this.db.exec('DELETE FROM fleets');
  }

  close(): void {
    this.db.close();
  }
}
