import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '#src/shared/infrastructure/i18n/i18n.types.js';
import { USER_STATUSES, UserStatus } from '../../../domain/value-objects/user-status.vo.js';

export class ChangeUserStatusRequestDto {
  @ApiProperty({ enum: USER_STATUSES })
  @IsEnum(UserStatus, { message: i18nValidationMessage<I18nTranslations>('validation.IS_ENUM') })
  status: UserStatus;
}
