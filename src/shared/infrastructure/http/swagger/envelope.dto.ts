import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() total: number;
  @ApiProperty() totalPages: number;
}

export class ResponseMetaDto {
  @ApiProperty({ example: '0b6f5c1e-3f7a-4c1e-9a8b-2d6f0e7c1a23' }) requestId: string;
  @ApiPropertyOptional({ type: PaginationMetaDto }) pagination?: PaginationMetaDto;
}

export class ErrorDetailDto {
  @ApiProperty({ example: 'email' }) field: string;
  @ApiProperty({ example: 'VALIDATION.IS_EMAIL' }) code: string;
  @ApiProperty({ example: 'email must be a valid email address' }) message: string;
}

export class ErrorBodyDto {
  @ApiProperty({ example: 'AUTH.INVALID_CREDENTIALS', description: 'Stable, never translated' })
  code: string;
  @ApiProperty({ description: 'Translated according to the `lang` header' }) message: string;
  @ApiPropertyOptional({ type: [ErrorDetailDto] }) details?: ErrorDetailDto[];
}

export class ErrorEnvelopeDto {
  @ApiProperty({ example: false }) success: false;
  @ApiProperty({ type: ErrorBodyDto }) error: ErrorBodyDto;
  @ApiProperty({ type: ResponseMetaDto }) meta: ResponseMetaDto;
}
