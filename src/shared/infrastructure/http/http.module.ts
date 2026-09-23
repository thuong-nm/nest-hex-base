import { Global, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from '../config/app-config.module.js';
import { AppConfigService } from '../config/app-config.service.js';
import { RequestValidationException } from './errors/request-validation.exception.js';
import { AllExceptionsFilter } from './filters/all-exceptions.filter.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { ResponseEnvelopeInterceptor } from './interceptors/response-envelope.interceptor.js';

/**
 * HTTP cross-cutting concerns registered globally through DI, so tests that build the app from
 * AppModule get exactly the production pipeline.
 */
@Global()
@Module({
  imports: [
    // Access tokens are verified here (JwtAuthGuard) and signed by the auth module's adapter.
    JwtModule.registerAsync({
      global: true,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.get('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get('JWT_ACCESS_TTL_SECONDS') },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
    // Registered globally but only enforced where ThrottlerGuard is applied (auth controller).
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => [
        { ttl: config.get('AUTH_THROTTLE_TTL_MS'), limit: config.get('AUTH_THROTTLE_LIMIT') },
      ],
    }),
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    // Order matters: authentication first, then role checks.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          exceptionFactory: (errors) => new RequestValidationException(errors),
        }),
    },
  ],
})
export class HttpModule {}
