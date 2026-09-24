import { validateEnv } from '#src/shared/infrastructure/config/env.schema.js';

describe('validateEnv', () => {
  const base = {
    DATABASE_URL: 'postgresql://app:app@localhost:5432/app',
    JWT_ACCESS_SECRET: 'x'.repeat(32),
  };

  it('defaults to en when neither language variable is set', () => {
    const env = validateEnv(base);
    expect(env.DEFAULT_LANG).toBe('en');
    expect(env.SUPPORTED_LANGS).toEqual(['en']);
  });

  it('uses DEFAULT_LANG as the fallback and does not force en', () => {
    const env = validateEnv({ ...base, DEFAULT_LANG: ' VI ' });
    expect(env.DEFAULT_LANG).toBe('vi');
    expect(env.SUPPORTED_LANGS).toEqual(['vi']);
  });

  it('adds DEFAULT_LANG to SUPPORTED_LANGS when it is missing, without duplicates', () => {
    expect(
      validateEnv({ ...base, DEFAULT_LANG: 'vi', SUPPORTED_LANGS: 'en' }).SUPPORTED_LANGS,
    ).toEqual(['vi', 'en']);
    expect(
      validateEnv({ ...base, DEFAULT_LANG: 'vi', SUPPORTED_LANGS: 'EN, vi' }).SUPPORTED_LANGS,
    ).toEqual(['vi', 'en']);
  });

  it('rejects an empty DEFAULT_LANG', () => {
    expect(() => validateEnv({ ...base, DEFAULT_LANG: '  ' })).toThrow(/DEFAULT_LANG/);
  });
});
