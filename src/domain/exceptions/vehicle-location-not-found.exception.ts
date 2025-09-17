import type { PlateNumber } from '../object-values/plate-number';

export class VehicleLocationNotFoundException extends Error {
  constructor(plateNumber: PlateNumber) {
    super(`Vehicle location with plate number ${plateNumber} not found`);

    this.name = 'VehicleLocationNotFoundException';
  }
}
