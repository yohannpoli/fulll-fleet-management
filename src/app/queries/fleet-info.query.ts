import type { FleetId } from '../../domain/object-values/fleet-id';

export class FleetInfoQuery {
  constructor(public readonly fleetId: FleetId) {}
}
