import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '#src/shared/infrastructure/http/auth-context.js';
import { CurrentUser } from '#src/shared/infrastructure/http/decorators/current-user.decorator.js';
import { ResponseMessage } from '#src/shared/infrastructure/http/decorators/response-message.decorator.js';
import { Roles } from '#src/shared/infrastructure/http/decorators/roles.decorator.js';
import { PaginatedResponse } from '#src/shared/infrastructure/http/dto/paginated-response.js';
import {
  ApiEnvelopeResponse,
  ApiErrorResponses,
} from '#src/shared/infrastructure/http/swagger/api-envelope.decorator.js';
import { ChangeUserRoleUseCase } from '../../application/use-cases/change-user-role.use-case.js';
import { ChangeUserStatusUseCase } from '../../application/use-cases/change-user-status.use-case.js';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case.js';
import { Role } from '../../domain/value-objects/role.vo.js';
import { ChangeUserRoleRequestDto } from './dto/change-user-role.request.dto.js';
import { ChangeUserStatusRequestDto } from './dto/change-user-status.request.dto.js';
import { ListUsersRequestDto } from './dto/list-users.request.dto.js';
import { UserResponseDto } from './dto/user.response.dto.js';

@ApiTags('admin / users')
@ApiBearerAuth()
@ApiErrorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
@Roles(Role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly changeUserRole: ChangeUserRoleUseCase,
    private readonly changeUserStatus: ChangeUserStatusUseCase,
  ) {}

  @Get()
  @ResponseMessage('users.LIST_SUCCESS')
  @ApiEnvelopeResponse(UserResponseDto, { paginated: true })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST)
  async list(@Query() query: ListUsersRequestDto): Promise<PaginatedResponse<UserResponseDto>> {
    const result = await this.listUsers.execute(query);
    return new PaginatedResponse(
      result.items.map((user) => UserResponseDto.from(user)),
      result.page,
      result.limit,
      result.total,
    );
  }

  @Patch(':id/role')
  @ResponseMessage('users.ROLE_CHANGED')
  @ApiEnvelopeResponse(UserResponseDto)
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  async changeRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ChangeUserRoleRequestDto,
  ): Promise<UserResponseDto> {
    const user = await this.changeUserRole.execute({
      actorId: actor.id,
      userId: id,
      role: body.role,
    });
    return UserResponseDto.from(user);
  }

  @Patch(':id/status')
  @ResponseMessage('users.STATUS_CHANGED')
  @ApiEnvelopeResponse(UserResponseDto)
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  async changeStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ChangeUserStatusRequestDto,
  ): Promise<UserResponseDto> {
    const user = await this.changeUserStatus.execute({
      actorId: actor.id,
      userId: id,
      status: body.status,
    });
    return UserResponseDto.from(user);
  }
}
