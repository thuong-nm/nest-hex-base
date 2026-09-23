import { ApiProperty } from '@nestjs/swagger';
import type { UserResult } from '../../../application/dto/user.result.js';
import { ROLES, type Role } from '../../../domain/value-objects/role.vo.js';
import { USER_STATUSES, type UserStatus } from '../../../domain/value-objects/user-status.vo.js';

/** Explicit field list: never spread a result into a response, or new fields leak by default. */
export class UserResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'jane@example.com' }) email: string;
  @ApiProperty({ example: 'Jane Doe' }) name: string;
  @ApiProperty({ enum: ROLES }) role: Role;
  @ApiProperty({ enum: USER_STATUSES }) status: UserStatus;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static from(user: UserResult): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.role = user.role;
    dto.status = user.status;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
