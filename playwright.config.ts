import { defineConfig } from '@playwright/test';

function port(name: string, fallback: number): number {
  const result = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(result) || result < 1 || result > 65535) {
    throw new Error(`${name} phải là cổng TCP hợp lệ.`);
  }
  return result;
}

const apiPort = port('BAE_E2E_API_PORT', 3310);
const webPort = port('BAE_E2E_WEB_PORT', 5317);
const webUrl = `http://127.0.0.1:${webPort}`;
const testGuestSession = process.env.BAE_E2E_GUEST_SESSION === '1';
const testMenu = process.env.BAE_E2E_MENU === '1';
const testBooking = process.env.BAE_E2E_BOOKING === '1';

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL: webUrl, browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'npm run start -w @ba-anh-em/api',
      url: `http://127.0.0.1:${apiPort}/api/v1/health/live`,
      env: {
        NODE_ENV: 'test',
        API_HOST: '127.0.0.1',
        API_PORT: String(apiPort),
        DATABASE_URL: process.env.BAE_TEST_DATABASE_URL ?? '',
        ...(testGuestSession || testBooking
          ? { APP_ORIGIN: webUrl, GUEST_SESSION_TTL_SECONDS: '3600' }
          : {}),
        ...(testBooking ? { BOOKING_TEST_ENABLED: '1' } : {}),
        ...(testMenu
          ? {
              APP_ORIGIN: webUrl,
              MENU_VENUE_CODE: 'BAE-TEST-FIXTURE',
              STAFF_VENUE_CODE: 'BAE-TEST-FIXTURE',
              OIDC_ISSUER: 'https://fixture.example',
              OIDC_CLIENT_ID: 'fixture-menu',
              OIDC_CLIENT_SECRET: 'fixture-secret-for-browser-session-checks',
              STAFF_SESSION_TTL_SECONDS: '3600',
              STAFF_SESSION_IDLE_SECONDS: '900',
            }
          : {}),
      },
      reuseExistingServer: false,
    },
    {
      command: `npm run dev -w @ba-anh-em/web -- --port ${webPort}`,
      url: webUrl,
      env: {
        API_PORT: String(apiPort),
        VITE_MENU_SOURCE: testMenu ? 'api' : 'demo',
        VITE_BOOKING_SOURCE: testBooking ? 'api' : 'demo',
      },
      reuseExistingServer: false,
    },
  ],
});
