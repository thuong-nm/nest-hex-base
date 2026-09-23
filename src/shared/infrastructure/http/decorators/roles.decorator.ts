import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'auth:roles';

/** Restricts a route (or controller) to users holding one of `roles`. Enforced by RolesGuard. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
