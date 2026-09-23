import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '#src/shared/infrastructure/i18n/i18n.types.js';

export const MAX_PAGE_SIZE = 100;

/** Extend this in list request DTOs. */
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage<I18nTranslations>('validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage<I18nTranslations>('validation.MIN') })
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: 20 })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage<I18nTranslations>('validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage<I18nTranslations>('validation.MIN') })
  @Max(MAX_PAGE_SIZE, { message: i18nValidationMessage<I18nTranslations>('validation.MAX') })
  limit: number = 20;
}
