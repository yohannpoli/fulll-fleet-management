export class InvalidUserIdException extends Error {
  constructor(value: string) {
    super(`Invalid user ID: ${value}`);

    this.name = 'InvalidUserIdException';
  }
}
