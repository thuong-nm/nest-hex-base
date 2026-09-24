import { normalizeLang, resolveLang } from '#src/shared/infrastructure/i18n/lang.resolver.js';

describe('resolveLang', () => {
  const options = { supported: ['en', 'vi'], fallback: 'en' };

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
    expect(resolveLang(headers, options)).toBe(expected);
  });

  it('never returns a language outside the supported list', () => {
    expect(
      resolveLang({ lang: 'vi', acceptLanguage: 'vi' }, { supported: ['en'], fallback: 'en' }),
    ).toBe('en');
  });

  it('falls back to the configured default language', () => {
    const vi = { supported: ['en', 'vi'], fallback: 'vi' };
    expect(resolveLang({}, vi)).toBe('vi');
    expect(resolveLang({ lang: 'de', acceptLanguage: 'fr' }, vi)).toBe('vi');
    expect(resolveLang({ lang: 'en' }, vi)).toBe('en');
  });
});

describe('normalizeLang', () => {
  it('keeps only the lower-cased primary subtag', () => {
    expect(normalizeLang(' EN-us ')).toBe('en');
  });
});
