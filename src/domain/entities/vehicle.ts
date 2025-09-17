import { UnsupportedVehicleTypeException } from '../exceptions/unsupported-vehicle-type.exception';
import type { PlateNumber } from '../object-values/plate-number';

export abstract class Vehicle {
  constructor(public readonly plateNumber: PlateNumber) {}

  abstract get type(): string;
}

export class Car extends Vehicle {
  get type(): string {
    return 'car';
  }
}

export class Truck extends Vehicle {
  get type(): string {
    return 'truck';
  }
}

export class Motorcycle extends Vehicle {
  get type(): string {
    return 'motorcycle';
  }
}

export function createVehicle(
  type: 'car' | 'truck' | 'motorcycle',
  plateNumber: PlateNumber
): Vehicle {
  switch (type.toLowerCase()) {
    case 'car':
      return new Car(plateNumber);

    case 'truck':
      return new Truck(plateNumber);

    case 'motorcycle':
      return new Motorcycle(plateNumber);

    default:
      throw new UnsupportedVehicleTypeException(type);
  }
}
