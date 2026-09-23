import { applyDecorators, HttpStatus, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorEnvelopeDto, ResponseMetaDto } from './envelope.dto.js';

interface EnvelopeOptions {
  status?: HttpStatus;
  isArray?: boolean;
  /** Documents `meta.pagination`; implies an array. */
  paginated?: boolean;
  description?: string;
}

/** Documents the success envelope `{ success, data, message, meta }` around `model`. */
export function ApiEnvelopeResponse(model: Type<unknown> | null, options: EnvelopeOptions = {}) {
  const { status = HttpStatus.OK, paginated = false, description } = options;
  const isArray = paginated || options.isArray === true;
  const itemSchema = model ? { $ref: getSchemaPath(model) } : { type: 'object', nullable: true };
  return applyDecorators(
    ApiExtraModels(ResponseMetaDto, ErrorEnvelopeDto, ...(model ? [model] : [])),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        required: ['success', 'data', 'message', 'meta'],
        properties: {
          success: { type: 'boolean', example: true },
          data: isArray ? { type: 'array', items: itemSchema } : itemSchema,
          message: { type: 'string', description: 'Translated according to the `lang` header' },
          meta: { $ref: getSchemaPath(ResponseMetaDto) },
        },
      },
    }),
  );
}

/** Documents the error envelope for each listed status. */
export function ApiErrorResponses(...statuses: HttpStatus[]) {
  return applyDecorators(
    ApiExtraModels(ErrorEnvelopeDto),
    ...statuses.map((status) => ApiResponse({ status, type: ErrorEnvelopeDto })),
  );
}
