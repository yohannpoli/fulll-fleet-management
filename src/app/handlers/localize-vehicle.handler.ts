import { FleetNotFoundException } from '../../domain/exceptions/fleet-not-found.exception';
import type { FleetRepository } from '../../domain/repositories/fleet.repository';
import type { LocalizeVehicleCommand } from '../commands/localize-vehicle.command';

export class LocalizeVehicleHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(command: LocalizeVehicleCommand): Promise<void> {
    const fleet = await this.fleetRepository.findOneById(command.fleetId);

    if (!fleet) {
      throw new FleetNotFoundException(command.fleetId);
    }

    fleet.localizeVehicle(command.plateNumber, command.location);

    await this.fleetRepository.save(fleet);
  }
}
