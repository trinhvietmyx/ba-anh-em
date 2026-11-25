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
        ...(testGuestSession
          ? { APP_ORIGIN: webUrl, GUEST_SESSION_TTL_SECONDS: '3600' }
          : {}),
      },
      reuseExistingServer: false,
    },
    {
      command: `npm run dev -w @ba-anh-em/web -- --port ${webPort}`,
      url: webUrl,
      env: { API_PORT: String(apiPort) },
      reuseExistingServer: false,
    },
  ],
});
