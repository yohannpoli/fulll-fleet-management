import type { PlateNumber } from '../object-values/plate-number';

export class VehicleNotFoundException extends Error {
  constructor(plateNumber: PlateNumber) {
    super(`Vehicle with plate number ${plateNumber} is not registered in this fleet`);

    this.name = 'VehicleNotFoundException';
  }
}
