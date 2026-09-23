import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CLOCK } from '#src/shared/kernel/ports/clock.port.js';
import { DOMAIN_EVENT_PUBLISHER } from '#src/shared/kernel/ports/domain-event-publisher.port.js';
import { ID_GENERATOR } from '#src/shared/kernel/ports/id-generator.port.js';
import { CqrsDomainEventPublisher } from './cqrs-domain-event-publisher.adapter.js';
import { SystemClock } from './system-clock.adapter.js';
import { UuidGenerator } from './uuid-generator.adapter.js';

/** Binds the shared-kernel ports once for every module. */
@Global()
@Module({
  imports: [CqrsModule.forRoot()],
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: ID_GENERATOR, useClass: UuidGenerator },
    { provide: DOMAIN_EVENT_PUBLISHER, useClass: CqrsDomainEventPublisher },
  ],
  exports: [CLOCK, ID_GENERATOR, DOMAIN_EVENT_PUBLISHER],
})
export class SharedAdaptersModule {}
