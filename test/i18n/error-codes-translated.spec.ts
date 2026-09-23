import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { errorCodeToI18nKey } from '#src/shared/infrastructure/i18n/error-key.js';
import { CommonErrorCode } from '#src/shared/kernel/errors/error-codes.js';
import { localeKeys, locales } from './locales.js';

const MODULES_DIR = join(import.meta.dirname, '../../src/modules');
const CODE_FORMAT = /^[A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*$/;

/** Collects the values of every exported `*ErrorCode` object in src/modules/*\/domain/errors. */
async function declaredCodes(): Promise<string[]> {
  const codes: string[] = Object.values(CommonErrorCode);
  for (const context of readdirSync(MODULES_DIR)) {
    const dir = join(MODULES_DIR, context, 'domain/errors');
    let files: string[] = [];
    try {
      files = readdirSync(dir).filter((file) => file.endsWith('.errors.ts'));
    } catch {
      continue;
    }
    for (const file of files) {
      const exported = (await import(pathToFileURL(join(dir, file)).href)) as Record<
        string,
        unknown
      >;
      for (const [name, value] of Object.entries(exported)) {
        if (name.endsWith('ErrorCode') && typeof value === 'object' && value !== null) {
          codes.push(...Object.values(value).filter((v): v is string => typeof v === 'string'));
        }
      }
    }
  }
  return codes;
}

describe('error codes', () => {
  it('follow <CONTEXT>.<SCREAMING_SNAKE> and have a translation in every locale', async () => {
    const codes = await declaredCodes();
    expect(codes.length).toBeGreaterThan(0);

    const problems = locales().flatMap((lang) => {
      const keys = localeKeys(lang);
      return codes.flatMap((code) => [
        ...(CODE_FORMAT.test(code) ? [] : [`${code}: bad format`]),
        ...(keys.has(errorCodeToI18nKey(code))
          ? []
          : [`${lang}: missing ${errorCodeToI18nKey(code)}`]),
      ]);
    });
    expect(problems).toEqual([]);
  });
});
