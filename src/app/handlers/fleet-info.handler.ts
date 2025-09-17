import type { Fleet } from '../../domain/entities/fleet';
import { FleetNotFoundException } from '../../domain/exceptions/fleet-not-found.exception';
import type { FleetRepository } from '../../domain/repositories/fleet.repository';
import type { FleetInfoQuery } from '../queries/fleet-info.query';

export class FleetInfoHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(query: FleetInfoQuery): Promise<Fleet> {
    const fleet = await this.fleetRepository.findOneById(query.fleetId);

    if (!fleet) {
      throw new FleetNotFoundException(query.fleetId);
    }

    return fleet;
  }
}
