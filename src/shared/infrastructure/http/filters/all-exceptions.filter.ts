import { randomUUID } from 'node:crypto';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import type { Request, Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { DomainError, type DomainErrorKind } from '#src/shared/kernel/errors/domain.error.js';
import { CommonErrorCode } from '#src/shared/kernel/errors/error-codes.js';
import { errorCodeToI18nKey } from '#src/shared/infrastructure/i18n/error-key.js';
import { DEFAULT_LANG } from '#src/shared/infrastructure/i18n/i18n.types.js';
import { TranslatorService } from '#src/shared/infrastructure/i18n/translator.service.js';
import { getRequestId, REQUEST_ID_HEADER } from '#src/shared/infrastructure/logger/request-id.js';
import { RequestValidationException } from '../errors/request-validation.exception.js';

export interface ErrorDetail {
  field: string;
  code: string;
  message: string;
}

interface NormalizedError {
  status: number;
  code: string;
  params?: Record<string, unknown>;
  details?: ErrorDetail[];
}

const STATUS_BY_KIND: Record<DomainErrorKind, HttpStatus> = {
  VALIDATION: HttpStatus.BAD_REQUEST,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  BUSINESS_RULE: HttpStatus.UNPROCESSABLE_ENTITY,
};

const CODE_BY_STATUS: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: CommonErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: CommonErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: CommonErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: CommonErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: CommonErrorCode.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: CommonErrorCode.TOO_MANY_REQUESTS,
  [HttpStatus.SERVICE_UNAVAILABLE]: CommonErrorCode.SERVICE_UNAVAILABLE,
};

const toScreamingSnake = (value: string) =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

/**
 * Single place that turns any thrown value into the error envelope. `code` is stable; `message`
 * is translated from `<namespace>.errors.<CODE>` in the request language.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly translator: TranslatorService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') throw exception;
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const lang = I18nContext.current(host)?.lang ?? DEFAULT_LANG;

    const error = this.normalize(exception, lang);
    if (error.status >= 500) {
      this.logger.error(exception instanceof Error ? exception : String(exception));
    }

    const message =
      this.translator.tryTranslate(errorCodeToI18nKey(error.code), lang, error.params) ??
      this.translator.translate('common.errors.INTERNAL_ERROR', lang);

    res
      .status(error.status)
      .setHeader('Content-Language', lang)
      .json({
        success: false,
        error: {
          code: error.code,
          message,
          ...(error.details ? { details: error.details } : {}),
        },
        meta: { requestId: this.requestId(req, res) },
      });
  }

  /**
   * Errors raised before pino-http runs (e.g. malformed JSON rejected by the body parser) have no
   * `req.id`; mint one so every error response is still traceable.
   */
  private requestId(req: Request, res: Response): string {
    const existing = getRequestId(req) ?? res.getHeader(REQUEST_ID_HEADER);
    if (typeof existing === 'string') return existing;
    const id = randomUUID();
    res.setHeader(REQUEST_ID_HEADER, id);
    return id;
  }

  private normalize(exception: unknown, lang: string): NormalizedError {
    if (exception instanceof DomainError) {
      return {
        status: STATUS_BY_KIND[exception.kind],
        code: exception.code,
        params: exception.params,
      };
    }
    if (exception instanceof RequestValidationException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: CommonErrorCode.VALIDATION_FAILED,
        details: this.validationDetails(exception.errors, lang),
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (
        typeof body === 'object' &&
        body !== null &&
        typeof (body as { code?: unknown }).code === 'string'
      ) {
        const { code, params } = body as { code: string; params?: Record<string, unknown> };
        return { status, code, params };
      }
      return {
        status,
        code:
          CODE_BY_STATUS[status] ??
          (status >= 500 ? CommonErrorCode.INTERNAL_ERROR : CommonErrorCode.BAD_REQUEST),
      };
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: CommonErrorCode.INTERNAL_ERROR };
  }

  /** Flattens nested class-validator errors into `{ field, code, message }`, one per constraint. */
  private validationDetails(errors: ValidationError[], lang: string, parent = ''): ErrorDetail[] {
    return errors.flatMap((error) => {
      const field = parent ? `${parent}.${error.property}` : error.property;
      const own = Object.entries(error.constraints ?? {}).map(([constraint, raw]) =>
        this.validationDetail(field, error.value, constraint, raw, lang),
      );
      return [...own, ...this.validationDetails(error.children ?? [], lang, field)];
    });
  }

  /**
   * `raw` is either `validation.KEY|{json}` (from i18nValidationMessage) or class-validator's
   * default English text. For the latter we still try `validation.<CONSTRAINT_NAME>` so built-in
   * errors like `whitelistValidation` are translated too.
   */
  private validationDetail(
    field: string,
    value: unknown,
    constraint: string,
    raw: string,
    lang: string,
  ): ErrorDetail {
    const separator = raw.indexOf('|');
    const isKey = separator !== -1 || raw.startsWith('validation.');
    const key = isKey
      ? raw.slice(0, separator === -1 ? undefined : separator)
      : `validation.${toScreamingSnake(constraint)}`;

    let constraints: Record<string, unknown> = {};
    if (separator !== -1) {
      try {
        const parsed = JSON.parse(raw.slice(separator + 1)) as { constraints?: unknown[] };
        constraints = Object.fromEntries((parsed.constraints ?? []).map((c, i) => [String(i), c]));
      } catch {
        constraints = {};
      }
    }

    const code = key.replace(/^validation\./, 'VALIDATION.');
    const message =
      this.translator.tryTranslate(key, lang, { property: field, value, constraints }) ??
      (isKey ? key : raw);
    return { field, code, message };
  }
}
