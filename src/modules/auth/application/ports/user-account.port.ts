/**
 * What auth needs to know about a user. Defined here, by the consumer, and implemented by an
 * adapter over the users facade (rule 5), so auth never depends on the users module's types.
 */
export type AccountStatus = 'ACTIVE' | 'DISABLED';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  status: AccountStatus;
  createdAt: Date;
}

export interface UserAccountPort {
  /** Always creates a USER; there is no way to pass a role. */
  register(input: { email: string; name: string; password: string }): Promise<UserAccount>;
  /** null when the email is unknown or the password is wrong, without saying which. */
  verifyCredentials(input: { email: string; password: string }): Promise<UserAccount | null>;
  findById(id: string): Promise<UserAccount | null>;
}

export const USER_ACCOUNT = Symbol('USER_ACCOUNT');
