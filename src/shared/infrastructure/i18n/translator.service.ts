import { type ArgumentsHost, Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AppConfigService } from '../config/app-config.service.js';
import type { I18nKey, I18nTranslations } from './i18n.types.js';

/** Thin wrapper so callers can translate dynamic keys (error codes) and detect missing ones. */
@Injectable()
export class TranslatorService {
  constructor(
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly config: AppConfigService,
  ) {}

  /** Language resolved for the current request, or `DEFAULT_LANG` when there is no i18n context. */
  langOf(host: ArgumentsHost): string {
    return I18nContext.current(host)?.lang ?? this.config.get('DEFAULT_LANG');
  }

  translate(key: I18nKey, lang: string, args?: Record<string, unknown>): string {
    return this.i18n.translate(key, { lang, args });
  }

  /** Returns undefined when the key does not exist, instead of echoing the key back. */
  tryTranslate(key: string, lang: string, args?: Record<string, unknown>): string | undefined {
    const value: unknown = this.i18n.translate(key as I18nKey, { lang, args });
    return typeof value === 'string' && value !== key ? value : undefined;
  }
}
