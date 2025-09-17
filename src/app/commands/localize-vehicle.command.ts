import type { FleetId } from '../../domain/object-values/fleet-id';
import { Location } from '../../domain/object-values/location';
import type { PlateNumber } from '../../domain/object-values/plate-number';

export class LocalizeVehicleCommand {
  public readonly location: Location;

  constructor(
    public readonly fleetId: FleetId,
    public readonly plateNumber: PlateNumber,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly altitude?: number
  ) {
    this.location = new Location(latitude, longitude, altitude);
  }
}
