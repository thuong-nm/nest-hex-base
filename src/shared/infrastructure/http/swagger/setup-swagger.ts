import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DEFAULT_LANG } from '#src/shared/infrastructure/i18n/i18n.types.js';
import { LANG_HEADER } from '#src/shared/infrastructure/i18n/lang.resolver.js';

export const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication, supportedLangs: readonly string[]): void {
  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      name: LANG_HEADER,
      required: false,
      description: `Response language. Falls back to Accept-Language, then \`${DEFAULT_LANG}\`.`,
      schema: { type: 'string', enum: [...supportedLangs], default: DEFAULT_LANG },
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, { jsonDocumentUrl: `${SWAGGER_PATH}/json` });
}
