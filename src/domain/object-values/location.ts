import { InvalidLocationException } from '../exceptions/invalid-location.exception';

export class Location {
  constructor(
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly altitude?: number
  ) {
    this.validateCoordinates();
  }

  private validateCoordinates(): void {
    if (this.latitude < -90 || this.latitude > 90) {
      throw new InvalidLocationException('Latitude must be between -90 and 90 degrees');
    }

    if (this.longitude < -180 || this.longitude > 180) {
      throw new InvalidLocationException('Longitude must be between -180 and 180 degrees');
    }

    if (this.altitude !== undefined && this.altitude < -11000) {
      throw new InvalidLocationException('Altitude cannot be below -11000 meters (Mariana Trench)');
    }
  }
}
