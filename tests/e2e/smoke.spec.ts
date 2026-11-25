import { expect, test } from '@playwright/test';

test('loads the storefront and reaches NestJS through the Vite proxy', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Ba Anh Em' }),
  ).toBeVisible();

  const result = await page.evaluate(async () => {
    const [live, ready] = await Promise.all([
      fetch('/api/v1/health/live'),
      fetch('/api/v1/health/ready'),
    ]);
    return {
      live: {
        status: live.status,
        traceId: live.headers.get('x-trace-id'),
        body: await live.json(),
      },
      ready: {
        status: ready.status,
        body: await ready.json(),
      },
    };
  });

  expect(result.live).toMatchObject({ status: 200, body: { status: 'ok' } });
  expect(result.live.traceId).toMatch(/^[0-9a-f-]{36}$/);
  if (process.env.BAE_TEST_DATABASE_URL) {
    expect(result.ready).toEqual({ status: 200, body: { status: 'ok' } });
  } else {
    expect(result.ready).toMatchObject({
      status: 503,
      body: { code: 'NOT_READY', retryable: true },
    });
  }
});

test('keeps the HttpOnly guest session across a storefront reload', async ({
  page,
  context,
}) => {
  test.skip(
    process.env.BAE_E2E_GUEST_SESSION !== '1',
    'Requires the guest session database fixture',
  );
  await page.goto('/');
  const bootstrap = () =>
    page.evaluate(async () => {
      const response = await fetch('/api/v1/guest/session', { method: 'POST' });
      return { status: response.status, body: await response.json() };
    });
  const established = await bootstrap();
  expect(established.status).toBe(200);
  expect(established.body.csrfToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
  const cookies = await context.cookies();
  expect(
    cookies.find((cookie) => cookie.name === '__Host-bae_guest'),
  ).toMatchObject({
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
  });
  await page.reload();
  expect(await bootstrap()).toEqual(established);
});
