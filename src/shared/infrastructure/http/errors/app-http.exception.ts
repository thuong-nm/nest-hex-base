import { HttpException, type HttpStatus } from '@nestjs/common';

/**
 * Interface-layer only. Use when a controller must fail for a transport reason with a specific
 * code; business failures are DomainErrors thrown from the application layer.
 */
export class AppHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    readonly params?: Record<string, unknown>,
  ) {
    super({ code, params }, status);
  }
}
