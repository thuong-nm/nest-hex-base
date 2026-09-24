import type { Path } from 'nestjs-i18n';
import type { I18nTranslations } from '#src/generated/i18n.generated.js';

export type { I18nTranslations };

/** Any valid translation key. Misspelled or removed keys fail `pnpm typecheck`. */
export type I18nKey = Path<I18nTranslations>;
