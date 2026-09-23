import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { I18nKey, I18nTranslations } from './i18n.types.js';

/** Thin wrapper so callers can translate dynamic keys (error codes) and detect missing ones. */
@Injectable()
export class TranslatorService {
  constructor(private readonly i18n: I18nService<I18nTranslations>) {}

  translate(key: I18nKey, lang: string, args?: Record<string, unknown>): string {
    return this.i18n.translate(key, { lang, args });
  }

  /** Returns undefined when the key does not exist, instead of echoing the key back. */
  tryTranslate(key: string, lang: string, args?: Record<string, unknown>): string | undefined {
    const value: unknown = this.i18n.translate(key as I18nKey, { lang, args });
    return typeof value === 'string' && value !== key ? value : undefined;
  }
}
