import { ApiProperty } from '@nestjs/swagger';
import type { AccountResult } from '../../../application/dto/account.result.js';

export class AccountResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'jane@example.com' }) email: string;
  @ApiProperty({ example: 'Jane Doe' }) name: string;
  @ApiProperty({ example: 'USER' }) role: string;
  @ApiProperty({ example: 'ACTIVE' }) status: string;
  @ApiProperty() createdAt: Date;

  static from(account: AccountResult): AccountResponseDto {
    const dto = new AccountResponseDto();
    dto.id = account.id;
    dto.email = account.email;
    dto.name = account.name;
    dto.role = account.role;
    dto.status = account.status;
    dto.createdAt = account.createdAt;
    return dto;
  }
}
