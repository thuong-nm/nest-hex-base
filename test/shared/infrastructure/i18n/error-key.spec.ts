import { errorCodeToI18nKey } from '#src/shared/infrastructure/i18n/error-key.js';

describe('errorCodeToI18nKey', () => {
  it.each([
    ['AUTH.INVALID_CREDENTIALS', 'auth.errors.INVALID_CREDENTIALS'],
    ['COMMON.NOT_FOUND', 'common.errors.NOT_FOUND'],
    ['ORDER_ITEMS.OUT_OF_STOCK', 'order-items.errors.OUT_OF_STOCK'],
    ['NO_NAMESPACE', 'common.errors.NO_NAMESPACE'],
  ])('%s → %s', (code, key) => {
    expect(errorCodeToI18nKey(code)).toBe(key);
  });
});
