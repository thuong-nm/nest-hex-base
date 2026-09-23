import type { Role } from '../../domain/value-objects/role.vo.js';

export interface ChangeUserRoleCommand {
  /** The authenticated admin performing the change. */
  actorId: string;
  userId: string;
  role: Role;
}
