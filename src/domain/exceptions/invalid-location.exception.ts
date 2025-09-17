export class InvalidLocationException extends Error {
  constructor(value: string) {
    super(`Invalid location: ${value}`);

    this.name = 'InvalidLocationException';
  }
}
