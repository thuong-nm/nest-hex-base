export interface AuthSettings {
  refreshTokenTtlSeconds: number;
}

export const AUTH_SETTINGS = Symbol('AUTH_SETTINGS');
