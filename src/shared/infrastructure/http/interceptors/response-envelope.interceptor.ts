import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { map, type Observable } from 'rxjs';
import type { I18nKey } from '#src/shared/infrastructure/i18n/i18n.types.js';
import { TranslatorService } from '#src/shared/infrastructure/i18n/translator.service.js';
import { getRequestId } from '#src/shared/infrastructure/logger/request-id.js';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator.js';
import { PaginatedResponse, type PaginationMeta } from '../dto/paginated-response.js';

export interface SuccessEnvelope<T> {
  success: true;
  data: T | null;
  message: string;
  meta: { requestId?: string; pagination?: PaginationMeta };
}

/** Wraps every successful HTTP response in the success envelope and sets Content-Language. */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly translator: TranslatorService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const lang = this.translator.langOf(context);
    const key =
      this.reflector.getAllAndOverride<I18nKey | undefined>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'common.SUCCESS';

    return next.handle().pipe(
      map((body: unknown): SuccessEnvelope<unknown> => {
        res.setHeader('Content-Language', lang);
        const meta: SuccessEnvelope<unknown>['meta'] = { requestId: getRequestId(req) };
        let data = body ?? null;
        if (body instanceof PaginatedResponse) {
          data = body.items;
          meta.pagination = body.pagination;
        }
        return { success: true, data, message: this.translator.translate(key, lang), meta };
      }),
    );
  }
}
