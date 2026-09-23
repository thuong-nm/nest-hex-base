import { Module } from '@nestjs/common';
import { AppConfigService } from '#src/shared/infrastructure/config/app-config.service.js';
import { provideUseCase } from '#src/shared/infrastructure/di/provide-use-case.js';
import { CLOCK } from '#src/shared/kernel/ports/clock.port.js';
import { ID_GENERATOR } from '#src/shared/kernel/ports/id-generator.port.js';
import { TRANSACTION_RUNNER } from '#src/shared/kernel/ports/transaction-runner.port.js';
import { UsersModule } from '#src/modules/users/index.js';
import { AUTH_SETTINGS, type AuthSettings } from './application/ports/auth-settings.port.js';
import { REFRESH_TOKEN_REPOSITORY } from './application/ports/refresh-token.repository.port.js';
import { TOKEN_SERVICE } from './application/ports/token-service.port.js';
import { USER_ACCOUNT } from './application/ports/user-account.port.js';
import { SessionIssuer } from './application/services/session-issuer.js';
import { GetMeUseCase } from './application/use-cases/get-me.use-case.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { LogoutUseCase } from './application/use-cases/logout.use-case.js';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case.js';
import { RegisterUseCase } from './application/use-cases/register.use-case.js';
import { RevokeUserSessionsUseCase } from './application/use-cases/revoke-user-sessions.use-case.js';
import { JwtTokenServiceAdapter } from './infrastructure/adapters/jwt-token-service.adapter.js';
import { UsersFacadeUserAccountAdapter } from './infrastructure/adapters/users-facade-user-account.adapter.js';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository.js';
import { UserStatusChangedHandler } from './interface/events/user-status-changed.handler.js';
import { AuthController } from './interface/http/auth.controller.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    // Port bindings: the only place adapters are chosen.
    { provide: USER_ACCOUNT, useClass: UsersFacadeUserAccountAdapter },
    { provide: TOKEN_SERVICE, useClass: JwtTokenServiceAdapter },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    {
      provide: AUTH_SETTINGS,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): AuthSettings => ({
        refreshTokenTtlSeconds: config.get('REFRESH_TOKEN_TTL_SECONDS'),
      }),
    },

    provideUseCase(SessionIssuer, [TOKEN_SERVICE, ID_GENERATOR, AUTH_SETTINGS]),
    provideUseCase(RegisterUseCase, [USER_ACCOUNT]),
    provideUseCase(LoginUseCase, [USER_ACCOUNT, REFRESH_TOKEN_REPOSITORY, SessionIssuer, CLOCK]),
    provideUseCase(RefreshSessionUseCase, [
      USER_ACCOUNT,
      REFRESH_TOKEN_REPOSITORY,
      TOKEN_SERVICE,
      SessionIssuer,
      TRANSACTION_RUNNER,
      CLOCK,
    ]),
    provideUseCase(LogoutUseCase, [REFRESH_TOKEN_REPOSITORY, TOKEN_SERVICE, CLOCK]),
    provideUseCase(GetMeUseCase, [USER_ACCOUNT]),
    provideUseCase(RevokeUserSessionsUseCase, [REFRESH_TOKEN_REPOSITORY, CLOCK]),

    UserStatusChangedHandler,
  ],
})
export class AuthModule {}
