import type { UserId } from '../../domain/object-values/user-id';

export class CreateFleetCommand {
  constructor(public readonly userId: UserId) {}
}
