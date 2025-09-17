import type { UserId } from '../object-values/user-id';

export class FleetAlreadyExistsException extends Error {
  constructor(userId: UserId) {
    super(`Fleet with user ID ${userId} already exists`);

    this.name = 'FleetAlreadyExistsException';
  }
}
