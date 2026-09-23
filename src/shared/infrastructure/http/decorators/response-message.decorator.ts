import { SetMetadata } from '@nestjs/common';
import type { I18nKey } from '#src/shared/infrastructure/i18n/i18n.types.js';

export const RESPONSE_MESSAGE_KEY = 'http:responseMessage';

/** i18n key the response interceptor translates into `message`. Defaults to `common.SUCCESS`. */
export const ResponseMessage = (key: I18nKey) => SetMetadata(RESPONSE_MESSAGE_KEY, key);
