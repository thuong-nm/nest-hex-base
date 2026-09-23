import { ApiProperty } from '@nestjs/swagger';
import type { SessionResult } from '../../../application/dto/session.result.js';

/** The only response that carries tokens. Never add tokens to any other DTO. */
export class SessionResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty({ example: 'Bearer' }) tokenType: 'Bearer';
  @ApiProperty({ description: 'Access token lifetime in seconds', example: 900 }) expiresIn: number;
  @ApiProperty({ description: 'Single use: each refresh returns a new one' }) refreshToken: string;
  @ApiProperty() refreshTokenExpiresAt: Date;

  static from(session: SessionResult): SessionResponseDto {
    const dto = new SessionResponseDto();
    dto.accessToken = session.accessToken;
    dto.tokenType = 'Bearer';
    dto.expiresIn = session.accessTokenExpiresIn;
    dto.refreshToken = session.refreshToken;
    dto.refreshTokenExpiresAt = session.refreshTokenExpiresAt;
    return dto;
  }
}
