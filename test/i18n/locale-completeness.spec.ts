import { flattenKeys, localeKeys, locales, namespaces, readNamespace } from './locales.js';

/**
 * Fails when a key exists in one locale but not in another. Every locale is compared with the
 * union of all locales, so no language (in particular not DEFAULT_LANG) is treated as the source.
 */
describe('locale completeness', () => {
  const all = locales();
  const allKeys = new Set(all.flatMap((lang) => [...localeKeys(lang)]));
  const allNamespaces = [...new Set(all.flatMap(namespaces))].sort();

  it.each(all)('%s has every key of the other locales', (lang) => {
    const keys = localeKeys(lang);
    expect([...allKeys].filter((key) => !keys.has(key))).toEqual([]);
  });

  it.each(all)('%s has every namespace file of the other locales', (lang) => {
    expect(namespaces(lang)).toEqual(allNamespaces);
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
