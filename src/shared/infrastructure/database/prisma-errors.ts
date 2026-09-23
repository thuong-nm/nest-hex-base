import { Prisma } from '#src/generated/prisma/client.js';

/** True when a write failed on a unique constraint (optionally on a specific field). */
export function isUniqueViolation(error: unknown, field?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }
  if (field === undefined) return true;
  return JSON.stringify(error.meta ?? {}).includes(field);
}
