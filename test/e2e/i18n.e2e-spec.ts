import { createTestApp, type TestApp } from './setup/app.js';
import { PASSWORD, register } from './setup/auth-helpers.js';

describe('i18n (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
    await t.reset();
    await register(t, 'jane@example.com');
  });
  afterAll(async () => {
    await t.close();
  });

  const badLogin = () =>
    t.http().post('/api/v1/auth/login').send({ email: 'jane@example.com', password: 'Wrong1234' });

  it('translates with lang: en', async () => {
    const res = await badLogin().set('lang', 'en').expect(401);
    expect(res.body.error).toEqual({
      code: 'AUTH.INVALID_CREDENTIALS',
      message: 'Email or password is incorrect',
    });
    expect(res.headers['content-language']).toBe('en');
  });

  it('defaults to en without any language header', async () => {
    const res = await badLogin().expect(401);
    expect(res.body.error.message).toBe('Email or password is incorrect');
    expect(res.headers['content-language']).toBe('en');
  });

  it('translates with lang: vi, keeping the code untranslated', async () => {
    const res = await badLogin().set('lang', 'vi-VN').expect(401);
    expect(res.body.error).toEqual({
      code: 'AUTH.INVALID_CREDENTIALS',
      message: 'Email hoặc mật khẩu không đúng',
    });
    expect(res.headers['content-language']).toBe('vi');
  });

  it('falls back to Accept-Language, then to en for unsupported languages', async () => {
    const accept = await badLogin().set('accept-language', 'fr-FR,vi;q=0.8').expect(401);
    expect(accept.headers['content-language']).toBe('vi');

    const unsupported = await badLogin().set('lang', 'de').expect(401);
    expect(unsupported.headers['content-language']).toBe('en');
  });

  it('translates success messages', async () => {
    const res = await t
      .http()
      .post('/api/v1/auth/login')
      .set('lang', 'vi')
      .send({ email: 'jane@example.com', password: PASSWORD })
      .expect(200);
    expect(res.body.message).toBe('Đăng nhập thành công');
    expect(res.headers['content-language']).toBe('vi');
  });

  it('translates validation errors per field', async () => {
    const body = { email: 'not-an-email', password: 'short', name: '' };

    const en = await t.http().post('/api/v1/auth/register').send(body).expect(400);
    expect(en.body.error.code).toBe('COMMON.VALIDATION_FAILED');
    expect(en.body.error.details).toEqual(
      expect.arrayContaining([
        {
          field: 'email',
          code: 'VALIDATION.IS_EMAIL',
          message: 'email must be a valid email address',
        },
        {
          field: 'password',
          code: 'VALIDATION.MIN_LENGTH',
          message: 'password must be at least 8 characters',
        },
        { field: 'name', code: 'VALIDATION.IS_NOT_EMPTY', message: 'name must not be empty' },
      ]),
    );

    const vi = await t
      .http()
      .post('/api/v1/auth/register')
      .set('lang', 'vi')
      .send(body)
      .expect(400);
    expect(vi.body.error.message).toBe('Dữ liệu gửi lên không hợp lệ');
    expect(vi.body.error.details).toContainEqual({
      field: 'password',
      code: 'VALIDATION.MIN_LENGTH',
      message: 'password phải có ít nhất 8 ký tự',
    });
  });

  it('wraps unknown routes in the translated error envelope', async () => {
    const res = await t.http().get('/api/v1/does-not-exist').set('lang', 'vi').expect(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'COMMON.NOT_FOUND', message: 'Không tìm thấy tài nguyên được yêu cầu' },
      meta: { requestId: expect.any(String) },
    });
  });
});
