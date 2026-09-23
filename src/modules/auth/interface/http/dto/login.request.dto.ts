import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '#src/shared/infrastructure/i18n/i18n.types.js';

const msg = i18nValidationMessage<I18nTranslations>;

export class LoginRequestDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail({}, { message: msg('validation.IS_EMAIL') })
  @MaxLength(254, { message: msg('validation.MAX_LENGTH') })
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString({ message: msg('validation.IS_STRING') })
  @IsNotEmpty({ message: msg('validation.IS_NOT_EMPTY') })
  @MaxLength(128, { message: msg('validation.MAX_LENGTH') })
  password: string;
}
