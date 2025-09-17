export class UnsupportedVehicleTypeException extends Error {
  constructor(type: string) {
    super(`Unsupported vehicle type: ${type}`);

    this.name = 'UnsupportedVehicleTypeException';
  }
}
