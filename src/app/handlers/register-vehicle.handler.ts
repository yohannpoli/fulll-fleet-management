import { createVehicle } from '../../domain/entities/vehicle';
import { FleetNotFoundException } from '../../domain/exceptions/fleet-not-found.exception';
import type { FleetRepository } from '../../domain/repositories/fleet.repository';
import type { RegisterVehicleCommand } from '../commands/register-vehicle.command';

export class RegisterVehicleHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(command: RegisterVehicleCommand): Promise<void> {
    const fleet = await this.fleetRepository.findOneById(command.fleetId);

    if (!fleet) {
      throw new FleetNotFoundException(command.fleetId);
    }

    const vehicle = createVehicle(command.vehicleType, command.plateNumber);

    fleet.registerVehicle(vehicle);

    await this.fleetRepository.save(fleet);
  }
}
