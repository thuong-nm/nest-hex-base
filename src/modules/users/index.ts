/**
 * Public API of the users bounded context. Other modules may import ONLY from this file, and
 * only from their infrastructure adapters, event handlers and module file (see AGENTS.md rule 5).
 */
export { UsersModule } from './users.module.js';
export { UsersFacade } from './users.facade.js';
export type { UserResult } from './application/dto/user.result.js';
export type { RegisterUserCommand } from './application/dto/register-user.command.js';
export type { VerifyCredentialsCommand } from './application/dto/verify-credentials.command.js';
export type {
  EnsureAdminCommand,
  EnsureAdminResult,
} from './application/dto/ensure-admin.command.js';
export { Role } from './domain/value-objects/role.vo.js';
export { UserStatus } from './domain/value-objects/user-status.vo.js';
export { UserRegisteredEvent } from './domain/events/user-registered.event.js';
export { UserRoleChangedEvent } from './domain/events/user-role-changed.event.js';
export { UserStatusChangedEvent } from './domain/events/user-status-changed.event.js';
