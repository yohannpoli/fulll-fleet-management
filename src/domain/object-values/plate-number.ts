import { InvalidPlateNumberException } from '../exceptions/invalid-vehicle-plate-number.exception';
import type { Brand } from '../types/brand';

const PlateNumberBrand = Symbol('PlateNumber');

export type PlateNumber = Brand<string, typeof PlateNumberBrand>;

export const makePlateNumber = (value: string): PlateNumber => {
  if (!value || value.trim().length === 0) {
    throw new InvalidPlateNumberException('empty');
  }

  return value as PlateNumber;
};

export const isPlateNumber = (value: string): value is PlateNumber => {
  try {
    makePlateNumber(value);

    return true;
  } catch {
    return false;
  }
};
