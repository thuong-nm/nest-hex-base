import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AppConfigService } from './shared/infrastructure/config/app-config.service.js';
import { configureApp } from './shared/infrastructure/http/configure-app.js';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
configureApp(app);
await app.listen(app.get(AppConfigService).get('PORT'));
