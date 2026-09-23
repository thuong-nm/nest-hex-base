import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '#src/shared/infrastructure/http/dto/pagination-query.dto.js';
import type { I18nTranslations } from '#src/shared/infrastructure/i18n/i18n.types.js';
import { Role, ROLES } from '../../../domain/value-objects/role.vo.js';
import { USER_STATUSES, UserStatus } from '../../../domain/value-objects/user-status.vo.js';

export class ListUsersRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsEnum(Role, { message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM') })
  role?: Role;

  @ApiPropertyOptional({ enum: USER_STATUSES })
  @IsOptional()
  @IsEnum(UserStatus, { message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM') })
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Case-insensitive match on email' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage<I18nTranslations>('validation.IS_STRING') })
  @MaxLength(254, { message: i18nValidationMessage<I18nTranslations>('validation.MAX_LENGTH') })
  search?: string;
}
