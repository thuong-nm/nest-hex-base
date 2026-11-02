import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '#src/shared/infrastructure/i18n/i18n.types.js';
import {
  BASE_SORT_FIELDS,
  type BaseSortField,
  DEFAULT_LIST_QUERY,
  type ListQuery,
  SORT_ORDERS,
  SortOrder,
} from '#src/shared/kernel/list-query.js';

export const MAX_PAGE_SIZE = 100;
export const MAX_SEARCH_LENGTH = 100;

/**
 * Base class for every list request DTO: pagination, `search`, `sortBy` and `sortOrder`.
 * `sortBy` is a free-text field name that must be one of `fields` (build them with
 * `sortFields()` next to the repository port):
 *
 *   export class ListUsersRequestDto extends ListQueryDto(USER_SORT_FIELDS) { ... }
 */
export function ListQueryDto<T extends string = never>(
  fields: readonly (BaseSortField | T)[] = BASE_SORT_FIELDS,
) {
  class ListQueryDtoBase implements ListQuery<BaseSortField | T> {
    @ApiPropertyOptional({ minimum: 1, default: DEFAULT_LIST_QUERY.page })
    @Type(() => Number)
    @IsInt({ message: i18nValidationMessage<I18nTranslations>('validation.IS_INT') })
    @Min(1, { message: i18nValidationMessage<I18nTranslations>('validation.MIN') })
    page: number = DEFAULT_LIST_QUERY.page;

    @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_LIST_QUERY.limit })
    @Type(() => Number)
    @IsInt({ message: i18nValidationMessage<I18nTranslations>('validation.IS_INT') })
    @Min(1, { message: i18nValidationMessage<I18nTranslations>('validation.MIN') })
    @Max(MAX_PAGE_SIZE, { message: i18nValidationMessage<I18nTranslations>('validation.MAX') })
    limit: number = DEFAULT_LIST_QUERY.limit;

    @ApiPropertyOptional({
      maxLength: MAX_SEARCH_LENGTH,
      description:
        'Case-insensitive partial match. The endpoint description lists the fields searched.',
    })
    @IsOptional()
    @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING') })
    @MaxLength(MAX_SEARCH_LENGTH, {
      message: i18nValidationMessage<I18nTranslations>('validation.MAX_LENGTH'),
    })
    search?: string;

    @ApiPropertyOptional({
      type: String,
      default: DEFAULT_LIST_QUERY.sortBy,
      description: `Field name to sort by. One of: ${fields.join(', ')}`,
    })
    @IsIn(fields, { message: i18nValidationMessage<I18nTranslations>('validation.IS_IN') })
    sortBy: BaseSortField | T = DEFAULT_LIST_QUERY.sortBy;

    @ApiPropertyOptional({ enum: SORT_ORDERS, default: DEFAULT_LIST_QUERY.sortOrder })
    @IsEnum(SortOrder, { message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM') })
    sortOrder: SortOrder = DEFAULT_LIST_QUERY.sortOrder;
  }
  return ListQueryDtoBase;
}
