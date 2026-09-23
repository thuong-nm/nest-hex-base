import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/**
 * Carries class-validator errors untranslated (`validation.KEY|{args}`); AllExceptionsFilter
 * turns them into translated `{ field, code, message }` details. nestjs-i18n's own factory is
 * not used because it translates eagerly, which would lose the key needed for `code`.
 */
export class RequestValidationException extends BadRequestException {
  constructor(readonly errors: ValidationError[]) {
    super();
  }
}
