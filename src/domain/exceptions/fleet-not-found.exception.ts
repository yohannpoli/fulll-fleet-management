import type { FleetId } from '../object-values/fleet-id';

export class FleetNotFoundException extends Error {
  constructor(fleetId: FleetId) {
    super(`Fleet with ID ${fleetId} not found`);

    this.name = 'FleetNotFoundException';
  }
}
