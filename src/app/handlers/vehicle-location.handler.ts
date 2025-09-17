import { FleetNotFoundException } from '../../domain/exceptions/fleet-not-found.exception';
import { VehicleLocationNotFoundException } from '../../domain/exceptions/vehicle-location-not-found.exception';
import type { Location } from '../../domain/object-values/location';
import type { FleetRepository } from '../../domain/repositories/fleet.repository';
import type { VehicleLocationQuery } from '../queries/vehicle-location.query';

export class VehicleLocationHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(query: VehicleLocationQuery): Promise<Location> {
    const fleet = await this.fleetRepository.findOneById(query.fleetId);

    if (!fleet) {
      throw new FleetNotFoundException(query.fleetId);
    }

    const vehicleLocation = fleet.getVehicleLocation(query.plateNumber);

    if (!vehicleLocation) {
      throw new VehicleLocationNotFoundException(query.plateNumber);
    }

    return vehicleLocation;
  }
}
