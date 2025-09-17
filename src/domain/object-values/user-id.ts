import { InvalidUserIdException } from '../exceptions/invalid-user-id.exception';
import type { Brand } from '../types/brand';

const UserIdBrand = Symbol('UserId');

export type UserId = Brand<string, typeof UserIdBrand>;

export const makeUserId = (value: string): UserId => {
  if (!value || value.trim().length === 0) {
    throw new InvalidUserIdException('empty');
  }

  return value as UserId;
};

export const isUserId = (value: string): value is UserId => {
  try {
    makeUserId(value);

    return true;
  } catch {
    return false;
  }
};
