import type { Fleet } from '../entities/fleet';
import type { FleetId } from '../object-values/fleet-id';
import type { UserId } from '../object-values/user-id';

export type FleetExistsParams =
  | {
      id: FleetId;
    }
  | {
      userId: UserId;
    };

export interface FleetRepository {
  save(fleet: Fleet): Promise<void>;
  findOneById(id: FleetId): Promise<Fleet | undefined>;
  findManyByUserId(userId: UserId): Promise<Fleet[]>;
  exists(params: FleetExistsParams): Promise<boolean>;
}
