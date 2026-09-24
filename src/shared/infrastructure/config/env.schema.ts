import { z } from 'zod';

const csv = (fallback: string) =>
  z
    .string()
    .default(fallback)
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    );

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    CORS_ORIGINS: csv('*'),
    SWAGGER_ENABLED: z.stringbool().default(true),

    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),

    DEFAULT_LANG: z.string().trim().toLowerCase().min(1).default('en'),
    SUPPORTED_LANGS: csv('').transform((langs) => langs.map((lang) => lang.toLowerCase())),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(60 * 60 * 24 * 30),
    AUTH_THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
    AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),

    // Only read by `pnpm seed:admin`, which validates them itself.
    ADMIN_EMAIL: z.email().optional(),
    ADMIN_PASSWORD: z.string().min(8).optional(),
  })
  // The fallback language must always be servable, so it is added to SUPPORTED_LANGS if missing.
  .transform((env) => ({
    ...env,
    SUPPORTED_LANGS: [...new Set([env.DEFAULT_LANG, ...env.SUPPORTED_LANGS])],
  }));

export type Env = z.infer<typeof envSchema>;

/** Used by ConfigModule: throws on the first boot with every invalid variable listed. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
