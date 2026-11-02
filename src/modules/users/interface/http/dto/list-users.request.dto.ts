import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ListQueryDto } from '#src/shared/infrastructure/http/dto/list-query.dto.js';
import type { I18nTranslations } from '#src/shared/infrastructure/i18n/i18n.types.js';
import { USER_SORT_FIELDS } from '../../../application/ports/user.repository.port.js';
import { Role, ROLES } from '../../../domain/value-objects/role.vo.js';
import { USER_STATUSES, UserStatus } from '../../../domain/value-objects/user-status.vo.js';

export class ListUsersRequestDto extends ListQueryDto(USER_SORT_FIELDS) {
  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsEnum(Role, { message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM') })
  role?: Role;

  @ApiPropertyOptional({ enum: USER_STATUSES })
  @IsOptional()
  @IsEnum(UserStatus, { message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM') })
  status?: UserStatus;
}
