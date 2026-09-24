import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Global, Module } from '@nestjs/common';
import { I18nModule as NestI18nModule } from 'nestjs-i18n';
import { AppConfigModule } from '../config/app-config.module.js';
import { AppConfigService } from '../config/app-config.service.js';
import { type LangOptions, LangResolver } from './lang.resolver.js';
import { TranslatorService } from './translator.service.js';

// Resolves to src/i18n in dev/tests and dist/i18n in production (copied as a Nest CLI asset).
const TRANSLATIONS_DIR = join(import.meta.dirname, '../../../i18n');

function assertLocalesExist(langs: readonly string[]): void {
  const missing = langs.filter((lang) => !existsSync(join(TRANSLATIONS_DIR, lang)));
  if (missing.length > 0) {
    throw new Error(
      `SUPPORTED_LANGS contains languages without translations: ${missing.join(', ')}`,
    );
  }
}

@Global()
@Module({
  imports: [
    NestI18nModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        assertLocalesExist(config.get('SUPPORTED_LANGS'));
        return {
          fallbackLanguage: config.get('DEFAULT_LANG'),
          loaderOptions: {
            path: TRANSLATIONS_DIR,
            watch: config.get('NODE_ENV') === 'development',
          },
          logging: false,
        };
      },
      resolvers: [
        {
          use: LangResolver,
          inject: [AppConfigService],
          useFactory: (config: AppConfigService): LangOptions => ({
            supported: config.get('SUPPORTED_LANGS'),
            fallback: config.get('DEFAULT_LANG'),
          }),
        },
      ],
    }),
  ],
  providers: [TranslatorService],
  exports: [TranslatorService],
})
export class I18nModule {}
