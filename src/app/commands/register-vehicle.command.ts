import type { FleetId } from '../../domain/object-values/fleet-id';
import type { PlateNumber } from '../../domain/object-values/plate-number';

export class RegisterVehicleCommand {
  constructor(
    public readonly fleetId: FleetId,
    public readonly plateNumber: PlateNumber,
    public readonly vehicleType: 'car' | 'truck' | 'motorcycle'
  ) {}
}
