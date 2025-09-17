export class InvalidPlateNumberException extends Error {
  constructor(value: string) {
    super(`Invalid plate number: ${value}`);

    this.name = 'InvalidPlateNumberException';
  }
}
