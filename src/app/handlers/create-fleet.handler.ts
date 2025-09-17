import { v4 as uuidv4 } from 'uuid';
import { Fleet } from '../../domain/entities/fleet';
import { FleetAlreadyExistsException } from '../../domain/exceptions/fleet-already-exists.exception';
import { type FleetId, makeFleetId } from '../../domain/object-values/fleet-id';
import type { FleetRepository } from '../../domain/repositories/fleet.repository';
import type { CreateFleetCommand } from '../commands/create-fleet.command';

export class CreateFleetHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(command: CreateFleetCommand): Promise<FleetId> {
    const uuid = uuidv4();
    const fleetId = makeFleetId(uuid);
    const fleet = new Fleet(fleetId, command.userId);

    if (await this.fleetRepository.exists({ userId: command.userId })) {
      throw new FleetAlreadyExistsException(command.userId);
    }

    await this.fleetRepository.save(fleet);

    return fleetId;
  }
}
