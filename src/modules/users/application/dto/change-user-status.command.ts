import type { UserStatus } from '../../domain/value-objects/user-status.vo.js';

export interface ChangeUserStatusCommand {
  /** The authenticated admin performing the change. */
  actorId: string;
  userId: string;
  status: UserStatus;
}
