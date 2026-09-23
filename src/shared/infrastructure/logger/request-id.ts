import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const REQUEST_ID_HEADER = 'x-request-id';

// Accept a caller-supplied id only if it is short and printable, so it cannot be used for log injection.
const SAFE_ID = /^[\w-]{1,128}$/;

/** pino-http `genReqId`: reuse a valid incoming `X-Request-Id`, otherwise mint one, and echo it back. */
export function generateRequestId(req: IncomingMessage, res: ServerResponse): string {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id = typeof incoming === 'string' && SAFE_ID.test(incoming) ? incoming : randomUUID();
  res.setHeader('X-Request-Id', id);
  return id;
}

/** pino-http stores the id on `req.id`. */
export function getRequestId(req: unknown): string | undefined {
  const id = (req as { id?: unknown }).id;
  return typeof id === 'string' ? id : undefined;
}
