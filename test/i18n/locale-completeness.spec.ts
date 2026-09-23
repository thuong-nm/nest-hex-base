import { DEFAULT_LANG } from '#src/shared/infrastructure/i18n/i18n.types.js';
import { flattenKeys, localeKeys, locales, namespaces, readNamespace } from './locales.js';

/** Fails when a key exists in one locale but not in another (in either direction). */
describe('locale completeness', () => {
  const all = locales();
  const reference = localeKeys(DEFAULT_LANG);

  it('has the default language', () => {
    expect(all).toContain(DEFAULT_LANG);
  });

  it.each(all.filter((lang) => lang !== DEFAULT_LANG))('%s has exactly the keys of en', (lang) => {
    const keys = localeKeys(lang);
    const missing = [...reference].filter((key) => !keys.has(key));
    const extra = [...keys].filter((key) => !reference.has(key));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it.each(all)('%s has the same namespace files as en', (lang) => {
    expect(namespaces(lang)).toEqual(namespaces(DEFAULT_LANG));
  });

  it.each(all)('%s has no empty translations', (lang) => {
    const empty = namespaces(lang).flatMap((ns) => {
      const data = readNamespace(lang, ns);
      return flattenKeys(data, ns).filter((key) => {
        const value = key
          .split('.')
          .slice(1)
          .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], data);
        return typeof value !== 'string' || value.trim() === '';
      });
    });
    expect(empty).toEqual([]);
  });
});
