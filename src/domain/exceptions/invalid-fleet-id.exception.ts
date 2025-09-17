export class InvalidFleetIdException extends Error {
  constructor(value: string) {
    super(`Invalid fleet ID: ${value}`);

    this.name = 'InvalidFleetIdException';
  }
}
