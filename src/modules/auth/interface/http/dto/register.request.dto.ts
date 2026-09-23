import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import type { I18nTranslations } from '#src/shared/infrastructure/i18n/i18n.types.js';

const msg = i18nValidationMessage<I18nTranslations>;

/** No `role` field on purpose: unknown fields are rejected, so a client cannot choose its role. */
export class RegisterRequestDto {
  @ApiProperty({ example: 'jane@example.com', maxLength: 254 })
  @IsEmail({}, { message: msg('validation.IS_EMAIL') })
  @MaxLength(254, { message: msg('validation.MAX_LENGTH') })
  email: string;

  @ApiProperty({ example: 'Password123', minLength: 8, maxLength: 128 })
  @IsString({ message: msg('validation.IS_STRING') })
  @MinLength(8, { message: msg('validation.MIN_LENGTH') })
  @MaxLength(128, { message: msg('validation.MAX_LENGTH') })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, { message: msg('validation.PASSWORD_STRENGTH') })
  password: string;

  @ApiProperty({ example: 'Jane Doe', maxLength: 100 })
  @IsString({ message: msg('validation.IS_STRING') })
  @IsNotEmpty({ message: msg('validation.IS_NOT_EMPTY') })
  @MaxLength(100, { message: msg('validation.MAX_LENGTH') })
  name: string;
}
