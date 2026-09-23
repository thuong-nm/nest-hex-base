/**
 * Maps a stable error code to its translation key:
 * `AUTH.INVALID_CREDENTIALS` → `auth.errors.INVALID_CREDENTIALS`,
 * `ORDER_ITEMS.OUT_OF_STOCK` → `order-items.errors.OUT_OF_STOCK` (namespace = module folder name).
 */
export function errorCodeToI18nKey(code: string): string {
  const separator = code.indexOf('.');
  if (separator <= 0) return `common.errors.${code}`;
  const namespace = code.slice(0, separator).toLowerCase().replaceAll('_', '-');
  return `${namespace}.errors.${code.slice(separator + 1)}`;
}
