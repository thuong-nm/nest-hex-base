import { createTestApp, type TestApp } from './setup/app.js';
import { login, PASSWORD, register } from './setup/auth-helpers.js';

describe('auth flow (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(async () => {
    await t.reset();
  });
  afterAll(async () => {
    await t.close();
  });

  it('register → login → me → refresh → logout', async () => {
    const reg = await t
      .http()
      .post('/api/v1/auth/register')
      .send({ email: 'Jane@Example.com', password: PASSWORD, name: 'Jane' })
      .expect(201);
    expect(reg.body).toMatchObject({
      success: true,
      data: { email: 'jane@example.com', name: 'Jane', role: 'USER', status: 'ACTIVE' },
      message: 'Registration successful',
      meta: { requestId: expect.any(String) },
    });
    expect(reg.body.data).not.toHaveProperty('passwordHash');

    const loginRes = await t
      .http()
      .post('/api/v1/auth/login')
      .send({ email: 'jane@example.com', password: PASSWORD })
      .expect(200);
    const { accessToken, refreshToken } = loginRes.body.data;
    expect(loginRes.body.data).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 });

    const me = await t
      .http()
      .get('/api/v1/auth/me')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(me.body.data).toMatchObject({ email: 'jane@example.com', role: 'USER' });

    const refreshed = await t
      .http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    const rotated = refreshed.body.data.refreshToken as string;
    expect(rotated).not.toBe(refreshToken);

    await t.http().post('/api/v1/auth/logout').send({ refreshToken: rotated }).expect(200);
    const afterLogout = await t
      .http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotated })
      .expect(401);
    expect(afterLogout.body.error.code).toBe('AUTH.REFRESH_TOKEN_REUSED');
  });

  it('revokes the whole token family when a rotated refresh token is reused', async () => {
    await register(t, 'jane@example.com');
    const { refreshToken: first } = await login(t, 'jane@example.com');
    const second = (
      await t.http().post('/api/v1/auth/refresh').send({ refreshToken: first }).expect(200)
    ).body.data.refreshToken;

    const reuse = await t
      .http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first })
      .expect(401);
    expect(reuse.body.error.code).toBe('AUTH.REFRESH_TOKEN_REUSED');
    await t.http().post('/api/v1/auth/refresh').send({ refreshToken: second }).expect(401);
  });

  it('allows exactly one of two concurrent refreshes with the same token', async () => {
    await register(t, 'jane@example.com');
    const { refreshToken } = await login(t, 'jane@example.com');

    const results = await Promise.all([
      t.http().post('/api/v1/auth/refresh').send({ refreshToken }),
      t.http().post('/api/v1/auth/refresh').send({ refreshToken }),
    ]);

    expect(results.map((r) => r.status).sort((a, b) => a - b)).toEqual([200, 401]);
  });

  it('returns the same generic error for unknown email and wrong password', async () => {
    await register(t, 'jane@example.com');
    const unknown = await t
      .http()
      .post('/api/v1/auth/login')
      .send({ email: 'ghost@example.com', password: PASSWORD });
    const wrong = await t
      .http()
      .post('/api/v1/auth/login')
      .send({ email: 'jane@example.com', password: 'Wrong1234' });

    for (const res of [unknown, wrong]) {
      expect(res.status).toBe(401);
      expect(res.body.error).toEqual({
        code: 'AUTH.INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });
    }
  });

  it('never lets the client choose a role at registration', async () => {
    const res = await t
      .http()
      .post('/api/v1/auth/register')
      .send({ email: 'sneaky@example.com', password: PASSWORD, name: 'Sneaky', role: 'ADMIN' })
      .expect(400);
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ field: 'role' }));
  });

  it('rejects a duplicate email with USERS.EMAIL_TAKEN', async () => {
    await register(t, 'jane@example.com');
    const res = await t
      .http()
      .post('/api/v1/auth/register')
      .send({ email: 'JANE@example.com', password: PASSWORD, name: 'Jane 2' })
      .expect(409);
    expect(res.body.error.code).toBe('USERS.EMAIL_TAKEN');
  });

  it('requires a valid access token for /me', async () => {
    const missing = await t.http().get('/api/v1/auth/me').expect(401);
    expect(missing.body.error.code).toBe('COMMON.UNAUTHORIZED');
    await t.http().get('/api/v1/auth/me').set('authorization', 'Bearer not-a-jwt').expect(401);
  });
});
