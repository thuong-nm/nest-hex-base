import { createTestApp, type TestApp } from './setup/app.js';

describe('DEFAULT_LANG (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    // Must be set before createTestApp() imports AppModule, which validates the env once.
    process.env.DEFAULT_LANG = 'vi';
    process.env.SUPPORTED_LANGS = 'en';
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  const missing = () => t.http().get('/api/v1/does-not-exist');

  it('answers in DEFAULT_LANG without any language header', async () => {
    const res = await missing().expect(404);
    expect(res.body.error.message).toBe('Không tìm thấy tài nguyên được yêu cầu');
    expect(res.headers['content-language']).toBe('vi');
  });

  it('falls back to DEFAULT_LANG for unsupported languages', async () => {
    const res = await missing().set('lang', 'de').set('accept-language', 'fr').expect(404);
    expect(res.headers['content-language']).toBe('vi');
  });

  it('still serves the other supported languages', async () => {
    const res = await missing().set('lang', 'en').expect(404);
    expect(res.body.error.message).toBe('The requested resource was not found');
    expect(res.headers['content-language']).toBe('en');
  });
});
