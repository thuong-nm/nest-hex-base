export interface EnsureAdminCommand {
  email: string;
  password: string;
  name: string;
}

export interface EnsureAdminResult {
  created: boolean;
  userId: string;
}
