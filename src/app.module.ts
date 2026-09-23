import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/index.js';
import { UsersModule } from './modules/users/index.js';
import { InfrastructureModule } from './shared/infrastructure/infrastructure.module.js';

@Module({
  imports: [
    InfrastructureModule,
    UsersModule,
    AuthModule,
    // gen:module inserts new bounded contexts above this line
  ],
})
export class AppModule {}
