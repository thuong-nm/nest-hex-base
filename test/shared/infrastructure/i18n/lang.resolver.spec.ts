import { normalizeLang, resolveLang } from '#src/shared/infrastructure/i18n/lang.resolver.js';

describe('resolveLang', () => {
  const supported = ['en', 'vi'];

  it.each([
    [{ lang: 'vi' }, 'vi'],
    [{ lang: 'VI-vn' }, 'vi'],
    [{ lang: 'en_US' }, 'en'],
    [{ lang: 'de' }, 'en'],
    [{ lang: 'de', acceptLanguage: 'vi' }, 'vi'],
    [{ lang: 'vi', acceptLanguage: 'en' }, 'vi'],
    [{ acceptLanguage: 'fr-FR,vi;q=0.8,en;q=0.9' }, 'en'],
    [{ acceptLanguage: 'fr-FR,vi-VN;q=0.8' }, 'vi'],
    [{ acceptLanguage: 'vi;q=0,en' }, 'en'],
    [{ acceptLanguage: '*' }, 'en'],
    [{ lang: ['vi', 'en'] }, 'vi'],
    [{}, 'en'],
  ])('%o → %s', (headers, expected) => {
    expect(resolveLang(headers, supported)).toBe(expected);
  });

  it('never returns a language outside the supported list', () => {
    expect(resolveLang({ lang: 'vi', acceptLanguage: 'vi' }, ['en'])).toBe('en');
  });
});

describe('normalizeLang', () => {
  it('keeps only the lower-cased primary subtag', () => {
    expect(normalizeLang(' EN-us ')).toBe('en');
  });
});
