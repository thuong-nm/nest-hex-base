import { Module } from '@nestjs/common';
import { SharedAdaptersModule } from './adapters/shared-adapters.module.js';
import { AppConfigModule } from './config/app-config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { HttpModule } from './http/http.module.js';
import { I18nModule } from './i18n/i18n.module.js';
import { LoggerModule } from './logger/logger.module.js';

/** Everything that is not a bounded context. Import once, in AppModule. */
@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    DatabaseModule,
    I18nModule,
    SharedAdaptersModule,
    HttpModule,
    HealthModule,
  ],
})
export class InfrastructureModule {}
