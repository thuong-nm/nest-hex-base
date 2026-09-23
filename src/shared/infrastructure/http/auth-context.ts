/** Claims inside the access token. The auth module signs them; JwtAuthGuard verifies them. */
export interface AccessTokenClaims {
  sub: string;
  role: string;
}

/** What `@CurrentUser()` returns. Always derived from a verified token, never from the request body. */
export interface AuthenticatedUser {
  id: string;
  role: string;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}
