import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '#src/shared/infrastructure/i18n/i18n.types.js';

const msg = i18nValidationMessage<I18nTranslations>;

/** Body of both /auth/refresh and /auth/logout. */
export class RefreshTokenRequestDto {
  @ApiProperty()
  @IsString({ message: msg('validation.IS_STRING') })
  @IsNotEmpty({ message: msg('validation.IS_NOT_EMPTY') })
  @MaxLength(256, { message: msg('validation.MAX_LENGTH') })
  refreshToken: string;
}
