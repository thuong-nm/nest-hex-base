import type { TestApp } from './app.js';

export const PASSWORD = 'Password123';

export async function register(t: TestApp, email: string, name = 'Test User') {
  const res = await t
    .http()
    .post('/api/v1/auth/register')
    .send({ email, password: PASSWORD, name });
  if (res.status !== 201)
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data as { id: string; email: string; role: string };
}

export async function login(t: TestApp, email: string, password = PASSWORD) {
  const res = await t.http().post('/api/v1/auth/login').send({ email, password });
  if (res.status !== 200)
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data as { accessToken: string; refreshToken: string };
}

/** Creates an admin through the same use case `pnpm seed:admin` uses. */
export async function seedAdmin(t: TestApp, email = 'admin@example.com') {
  const { UsersFacade } = await import('#src/modules/users/index.js');
  await t.app.get(UsersFacade).ensureAdmin({ email, password: PASSWORD, name: 'Admin' });
  return login(t, email);
}
