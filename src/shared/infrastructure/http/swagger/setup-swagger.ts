import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LANG_HEADER, type LangOptions } from '#src/shared/infrastructure/i18n/lang.resolver.js';

export const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication, langs: LangOptions): void {
  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      name: LANG_HEADER,
      required: false,
      description: `Response language. Falls back to Accept-Language, then \`${langs.fallback}\`.`,
      schema: { type: 'string', enum: [...langs.supported], default: langs.fallback },
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, { jsonDocumentUrl: `${SWAGGER_PATH}/json` });
}
