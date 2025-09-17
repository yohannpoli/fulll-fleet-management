import type { PlateNumber } from '../object-values/plate-number';

export class VehicleAlreadyRegisteredException extends Error {
  constructor(plateNumber: PlateNumber) {
    super(`Vehicle with plate number ${plateNumber} has already been registered into this fleet`);

    this.name = 'VehicleAlreadyRegisteredException';
  }
}
