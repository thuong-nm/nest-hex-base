import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthenticatedUser } from '#src/shared/infrastructure/http/auth-context.js';
import { CurrentUser } from '#src/shared/infrastructure/http/decorators/current-user.decorator.js';
import { Public } from '#src/shared/infrastructure/http/decorators/public.decorator.js';
import { ResponseMessage } from '#src/shared/infrastructure/http/decorators/response-message.decorator.js';
import {
  ApiEnvelopeResponse,
  ApiErrorResponses,
} from '#src/shared/infrastructure/http/swagger/api-envelope.decorator.js';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case.js';
import { LoginUseCase } from '../../application/use-cases/login.use-case.js';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case.js';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case.js';
import { RegisterUseCase } from '../../application/use-cases/register.use-case.js';
import { AccountResponseDto } from './dto/account.response.dto.js';
import { LoginRequestDto } from './dto/login.request.dto.js';
import { RefreshTokenRequestDto } from './dto/refresh-token.request.dto.js';
import { RegisterRequestDto } from './dto/register.request.dto.js';
import { SessionResponseDto } from './dto/session.response.dto.js';

@ApiTags('auth')
@ApiErrorResponses(HttpStatus.TOO_MANY_REQUESTS)
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSession: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMe: GetMeUseCase,
  ) {}

  @Public()
  @Post('register')
  @ResponseMessage('auth.REGISTER_SUCCESS')
  @ApiEnvelopeResponse(AccountResponseDto, { status: HttpStatus.CREATED })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT)
  async register(@Body() body: RegisterRequestDto): Promise<AccountResponseDto> {
    return AccountResponseDto.from(await this.registerUseCase.execute(body));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('auth.LOGIN_SUCCESS')
  @ApiEnvelopeResponse(SessionResponseDto)
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async login(@Body() body: LoginRequestDto): Promise<SessionResponseDto> {
    return SessionResponseDto.from(await this.loginUseCase.execute(body));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('auth.REFRESH_SUCCESS')
  @ApiEnvelopeResponse(SessionResponseDto)
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async refresh(@Body() body: RefreshTokenRequestDto): Promise<SessionResponseDto> {
    return SessionResponseDto.from(await this.refreshSession.execute(body));
  }

  /** Public: the refresh token itself is the credential, so logout works after the access token expired. */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('auth.LOGOUT_SUCCESS')
  @ApiEnvelopeResponse(null)
  @ApiErrorResponses(HttpStatus.BAD_REQUEST)
  async logout(@Body() body: RefreshTokenRequestDto): Promise<null> {
    await this.logoutUseCase.execute(body);
    return null;
  }

  @Get('me')
  @ApiBearerAuth()
  @ResponseMessage('auth.ME_SUCCESS')
  @ApiEnvelopeResponse(AccountResponseDto)
  @ApiErrorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AccountResponseDto> {
    return AccountResponseDto.from(await this.getMe.execute(user.id));
  }
}
