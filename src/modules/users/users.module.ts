import { Module } from '@nestjs/common';
import { provideUseCase } from '#src/shared/infrastructure/di/provide-use-case.js';
import { CLOCK } from '#src/shared/kernel/ports/clock.port.js';
import { DOMAIN_EVENT_PUBLISHER } from '#src/shared/kernel/ports/domain-event-publisher.port.js';
import { ID_GENERATOR } from '#src/shared/kernel/ports/id-generator.port.js';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port.js';
import { USER_REPOSITORY } from './application/ports/user.repository.port.js';
import { ChangeUserRoleUseCase } from './application/use-cases/change-user-role.use-case.js';
import { ChangeUserStatusUseCase } from './application/use-cases/change-user-status.use-case.js';
import { EnsureAdminUseCase } from './application/use-cases/ensure-admin.use-case.js';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case.js';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case.js';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case.js';
import { VerifyCredentialsUseCase } from './application/use-cases/verify-credentials.use-case.js';
import { Argon2PasswordHasher } from './infrastructure/adapters/argon2-password-hasher.adapter.js';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository.js';
import { AdminUsersController } from './interface/http/admin-users.controller.js';
import { UsersFacade } from './users.facade.js';

@Module({
  controllers: [AdminUsersController],
  providers: [
    // Port bindings: the only place adapters are chosen.
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },

    provideUseCase(RegisterUserUseCase, [
      USER_REPOSITORY,
      PASSWORD_HASHER,
      ID_GENERATOR,
      CLOCK,
      DOMAIN_EVENT_PUBLISHER,
    ]),
    provideUseCase(VerifyCredentialsUseCase, [USER_REPOSITORY, PASSWORD_HASHER]),
    provideUseCase(FindUserByIdUseCase, [USER_REPOSITORY]),
    provideUseCase(ListUsersUseCase, [USER_REPOSITORY]),
    provideUseCase(ChangeUserRoleUseCase, [USER_REPOSITORY, CLOCK, DOMAIN_EVENT_PUBLISHER]),
    provideUseCase(ChangeUserStatusUseCase, [USER_REPOSITORY, CLOCK, DOMAIN_EVENT_PUBLISHER]),
    provideUseCase(EnsureAdminUseCase, [
      USER_REPOSITORY,
      PASSWORD_HASHER,
      ID_GENERATOR,
      CLOCK,
      DOMAIN_EVENT_PUBLISHER,
    ]),

    UsersFacade,
  ],
  exports: [UsersFacade],
})
export class UsersModule {}
