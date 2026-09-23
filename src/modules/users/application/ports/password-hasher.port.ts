export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  /**
   * Pass `hash: null` when the user does not exist: implementations must still spend the same
   * time verifying, so response timing does not reveal which emails are registered.
   */
  verify(hash: string | null, plain: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
