import { createTestApp, type TestApp } from './setup/app.js';

// Must run before createTestApp() imports AppModule, which validates the env once.
process.env['AUTH_THROTTLE_LIMIT'] = '3';

describe('auth rate limiting (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  it('returns COMMON.TOO_MANY_REQUESTS after the limit', async () => {
    const attempt = () =>
      t
        .http()
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@example.com', password: 'Wrong1234' });
    for (let i = 0; i < 3; i += 1) expect((await attempt()).status).toBe(401);

    const blocked = await attempt().expect(429);
    expect(blocked.body.error.code).toBe('COMMON.TOO_MANY_REQUESTS');
  });

  it('does not throttle non-auth routes', async () => {
    for (let i = 0; i < 5; i += 1) await t.http().get('/health').expect(200);
  });
});
