import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '#src/shared/infrastructure/i18n/i18n.types.js';
import { Role, ROLES } from '../../../domain/value-objects/role.vo.js';

export class ChangeUserRoleRequestDto {
  @ApiProperty({ enum: ROLES })
  @IsEnum(Role, { message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM') })
  role: Role;
}
