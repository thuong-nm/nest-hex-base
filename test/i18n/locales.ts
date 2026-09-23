import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const I18N_DIR = join(import.meta.dirname, '../../src/i18n');

export const locales = (): string[] =>
  readdirSync(I18N_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

export const namespaces = (lang: string): string[] =>
  readdirSync(join(I18N_DIR, lang))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))
    .sort();

export const readNamespace = (lang: string, ns: string): unknown =>
  JSON.parse(readFileSync(join(I18N_DIR, lang, `${ns}.json`), 'utf8'));

/** `{ a: { b: 'x' } }` → ['a.b'] */
export function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

/** Every key as `<namespace>.<path>`, for one locale. */
export const localeKeys = (lang: string): Set<string> =>
  new Set(namespaces(lang).flatMap((ns) => flattenKeys(readNamespace(lang, ns), ns)));
