import { InvalidFleetIdException } from '../exceptions/invalid-fleet-id.exception';
import type { Brand } from '../types/brand';

const FleetIdBrand = Symbol('FleetId');

export type FleetId = Brand<string, typeof FleetIdBrand>;

export const makeFleetId = (value: string): FleetId => {
  if (!value || value.trim().length === 0) {
    throw new InvalidFleetIdException('empty');
  }

  return value as FleetId;
};

export const isFleetId = (value: string): value is FleetId => {
  try {
    makeFleetId(value);

    return true;
  } catch {
    return false;
  }
};
