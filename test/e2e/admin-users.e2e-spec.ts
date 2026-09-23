import { createTestApp, type TestApp } from './setup/app.js';
import { login, PASSWORD, register, seedAdmin } from './setup/auth-helpers.js';

describe('admin users (e2e)', () => {
  let t: TestApp;
  let adminToken: string;

  beforeAll(async () => {
    t = await createTestApp();
  });
  beforeEach(async () => {
    await t.reset();
    adminToken = (await seedAdmin(t)).accessToken;
  });
  afterAll(async () => {
    await t.close();
  });

  const asAdmin = (req: ReturnType<ReturnType<TestApp['http']>['get']>) =>
    req.set('authorization', `Bearer ${adminToken}`);

  it('lets an admin change a user role', async () => {
    const user = await register(t, 'jane@example.com');

    const res = await t
      .http()
      .patch(`/api/v1/admin/users/${user.id}/role`)
      .set('authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN' })
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      data: { id: user.id, role: 'ADMIN' },
      message: 'User role updated',
    });
    // The new role is reflected in tokens issued from now on.
    const { accessToken } = await login(t, 'jane@example.com');
    await t
      .http()
      .get('/api/v1/admin/users')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('returns 403 when a USER calls an admin endpoint', async () => {
    await register(t, 'jane@example.com');
    const { accessToken } = await login(t, 'jane@example.com');

    const res = await t
      .http()
      .get('/api/v1/admin/users')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(403);
    expect(res.body).toMatchObject({ success: false, error: { code: 'COMMON.FORBIDDEN' } });
  });

  it('forbids an admin from demoting or disabling themselves', async () => {
    const me = (await t.http().get('/api/v1/auth/me').set('authorization', `Bearer ${adminToken}`))
      .body.data;

    for (const [path, body] of [
      ['role', { role: 'USER' }],
      ['status', { status: 'DISABLED' }],
    ] as const) {
      const res = await t
        .http()
        .patch(`/api/v1/admin/users/${me.id}/${path}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send(body)
        .expect(403);
      expect(res.body.error.code).toBe('USERS.CANNOT_MODIFY_SELF');
    }
  });

  it('disabling a user blocks login and revokes their refresh tokens', async () => {
    const user = await register(t, 'jane@example.com');
    const { refreshToken } = await login(t, 'jane@example.com');

    await t
      .http()
      .patch(`/api/v1/admin/users/${user.id}/status`)
      .set('authorization', `Bearer ${adminToken}`)
      .send({ status: 'DISABLED' })
      .expect(200);

    const loginRes = await t
      .http()
      .post('/api/v1/auth/login')
      .send({ email: 'jane@example.com', password: PASSWORD });
    expect(loginRes.status).toBe(403);
    expect(loginRes.body.error.code).toBe('AUTH.ACCOUNT_DISABLED');
    await expect
      .poll(async () => (await t.http().post('/api/v1/auth/refresh').send({ refreshToken })).status)
      .toBe(401);
  });

  it('lists users with pagination, filters and email search', async () => {
    await register(t, 'alice@example.com');
    await register(t, 'bob@example.com');

    const page = await asAdmin(t.http().get('/api/v1/admin/users?limit=2&page=1')).expect(200);
    expect(page.body.data).toHaveLength(2);
    expect(page.body.meta.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });

    const admins = await asAdmin(t.http().get('/api/v1/admin/users?role=ADMIN')).expect(200);
    expect(admins.body.data.map((u: { email: string }) => u.email)).toEqual(['admin@example.com']);

    const search = await asAdmin(t.http().get('/api/v1/admin/users?search=ALI')).expect(200);
    expect(search.body.data.map((u: { email: string }) => u.email)).toEqual(['alice@example.com']);
    expect(search.body.data[0]).not.toHaveProperty('passwordHash');
  });

  it('returns USERS.NOT_FOUND for an unknown user id', async () => {
    const res = await t
      .http()
      .patch('/api/v1/admin/users/00000000-0000-4000-8000-000000000000/role')
      .set('authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN' })
      .expect(404);
    expect(res.body.error.code).toBe('USERS.NOT_FOUND');
  });
});
