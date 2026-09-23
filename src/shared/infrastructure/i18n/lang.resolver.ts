import type { ExecutionContext } from '@nestjs/common';
import { I18nResolverOptions, type I18nResolver } from 'nestjs-i18n';
import { DEFAULT_LANG } from './i18n.types.js';

export const LANG_HEADER = 'lang';

/** `en-US` / `EN_us` → `en`. */
export function normalizeLang(value: string): string {
  return value.trim().split(/[-_]/)[0]!.toLowerCase();
}

/** Accept-Language entries ordered by quality, e.g. `vi-VN,vi;q=0.9,en;q=0.8` → [vi, vi, en]. */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag, quality: Number.isNaN(quality) ? 0 : quality, index };
    })
    .filter(({ tag, quality }) => tag !== '' && tag !== '*' && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
    .map(({ tag }) => normalizeLang(tag));
}

/**
 * `lang` header wins, then Accept-Language, then `en`. Anything not in `supported` is skipped,
 * so the result is always a language we have translations for.
 */
export function resolveLang(
  headers: { lang?: string | string[]; acceptLanguage?: string | string[] },
  supported: readonly string[],
): string {
  const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);
  const explicit = first(headers.lang);
  if (explicit) {
    const lang = normalizeLang(explicit);
    if (supported.includes(lang)) return lang;
  }
  const accept = first(headers.acceptLanguage);
  if (accept) {
    const match = parseAcceptLanguage(accept).find((lang) => supported.includes(lang));
    if (match) return match;
  }
  return DEFAULT_LANG;
}

export class LangResolver implements I18nResolver {
  constructor(@I18nResolverOptions() private readonly supported: string[]) {}

  resolve(context: ExecutionContext): string {
    const req = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    return resolveLang(
      { lang: req.headers[LANG_HEADER], acceptLanguage: req.headers['accept-language'] },
      this.supported,
    );
  }
}
