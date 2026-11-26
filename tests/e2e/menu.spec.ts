import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { Client } from 'pg';

const testMenu = process.env.BAE_E2E_MENU === '1';

test.describe('PostgreSQL menu', () => {
  test.skip(!testMenu, 'Requires a disposable menu database');

  test('shows published data and preserves the dish link', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Món nổi bật' }),
    ).toBeVisible();
    await page
      .getByRole('link', { name: 'Xem Gà nướng lá chanh' })
      .first()
      .click();
    await expect(page).toHaveURL(/\/thuc-don\?mon=ga-nuong-la-chanh/);
    await expect(page.getByRole('dialog')).toContainText('Gà nướng lá chanh');
  });

  test('displays load errors and a successfully loaded empty menu separately', async ({
    page,
  }) => {
    let failure = true;
    await page.route('**/api/v1/menu', (route) =>
      failure
        ? route.fulfill({
            status: 503,
            json: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Fixture' },
          })
        : route.fulfill({ status: 200, json: { items: [] } }),
    );
    await page.goto('/thuc-don');
    await expect(page.getByText('Chưa tải được thực đơn')).toBeVisible();
    await expect(page.getByText('Gà nướng lá chanh')).toHaveCount(0);
    failure = false;
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Thực đơn đang trống')).toBeVisible();
  });

  test('requires staff and saves menu changes across browser reloads', async ({
    page,
    context,
    baseURL,
  }) => {
    const adminUrl = process.env.BAE_E2E_MENU_ADMIN_URL;
    if (!adminUrl || !/_test(?:_[a-z0-9]+)*$/i.test(new URL(adminUrl).pathname))
      throw new Error(
        'Provide a disposable test database for the menu browser test',
      );
    const client = new Client({ connectionString: adminUrl });
    const subject = randomUUID();
    const token = randomBytes(32).toString('base64url');
    await client.connect();
    try {
      await client.query(
        `
        WITH account AS (
          INSERT INTO ba_anh_em.staff_users (oidc_issuer, oidc_subject, display_name)
          VALUES ('https://fixture.example', $1, 'Nhân sự kiểm thử') RETURNING id
        ), venue AS (
          SELECT id FROM ba_anh_em.venues WHERE code = 'BAE-TEST-FIXTURE'
        ), grants AS (
          INSERT INTO ba_anh_em.staff_venue_grants (staff_user_id, venue_id, permission)
          SELECT account.id, venue.id, permission FROM account, venue, unnest(ARRAY['menu.read', 'menu.write']) permission
        )
        INSERT INTO ba_anh_em.staff_sessions (staff_user_id, venue_id, token_digest, permissions_at_login, idle_expires_at, expires_at)
        SELECT account.id, venue.id, $2, ARRAY['menu.read','menu.write'], now() + interval '15 minutes', now() + interval '1 hour' FROM account, venue
      `,
        [subject, createHash('sha256').update(token).digest()],
      );
    } finally {
      await client.end();
    }

    await page.goto('/van-hanh/thuc-don');
    await expect(
      page.getByRole('link', { name: 'Đăng nhập nhân sự' }),
    ).toHaveAttribute('href', /\/api\/v1\/ops\/auth\/login\?/);
    await context.addCookies([
      {
        name: '__Host-bae_staff',
        value: token,
        domain: new URL(baseURL!).hostname,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ]);
    await page.reload();
    await page.getByRole('button', { name: 'Thêm món' }).click();
    const name = `Món trình duyệt ${subject.slice(0, 8)}`;
    await page.getByLabel('Tên món').fill(name);
    await page
      .getByRole('dialog')
      .getByLabel('Nhóm món', { exact: true })
      .fill('Khai vị');
    await page.getByLabel('Giá bán (₫)').fill('123000');
    await page.getByLabel('Mô tả món').fill('Dữ liệu kiểm thử trình duyệt.');
    const createKeys: Array<string | undefined> = [];
    await page.route('**/api/v1/ops/menu', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      createKeys.push(route.request().headers()['idempotency-key']);
      if (createKeys.length !== 1) return route.continue();
      const committed = await route.fetch();
      expect(committed.status()).toBe(201);
      await route.abort('failed');
    });
    await page.getByRole('button', { name: 'Lưu món' }).click();
    await expect(
      page.getByText('Chưa lưu được món. Vui lòng thử lại.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Lưu món' }).click();
    await expect(
      page.getByText(`Đã lưu ${name}.`, { exact: false }),
    ).toBeVisible();
    expect(createKeys).toEqual([expect.any(String), createKeys[0]]);
    const publicPage = await context.newPage();
    await publicPage.goto('/thuc-don');
    await expect(
      publicPage.getByRole('link', { name: 'Xem Gà nướng lá chanh' }).first(),
    ).toBeVisible();
    await expect(publicPage.getByText(name, { exact: true })).toHaveCount(0);
    await publicPage.goto('/');

    await page.reload();
    await page.getByRole('button', { name: `Sửa ${name}` }).click();
    await page.getByLabel('Giá bán (₫)').fill('129000');
    await page.getByLabel('Công bố trong thực đơn').check();
    await page.getByLabel('Cho phép đặt trước').uncheck();
    await page.getByRole('button', { name: 'Lưu món' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await publicPage
      .getByRole('link', { name: 'Xem thực đơn', exact: true })
      .click();
    const card = publicPage.locator('.dish-card').filter({ hasText: name });
    await expect(card).toContainText('129.000');
    await expect(card).toContainText('Hết món');

    const colleague = await context.newPage();
    await colleague.goto('/van-hanh/thuc-don');
    await page.getByRole('button', { name: `Sửa ${name}` }).click();
    await colleague.getByRole('button', { name: `Sửa ${name}` }).click();
    await page.getByLabel('Giá bán (₫)').fill('139000');
    await colleague.getByLabel('Cho phép đặt trước').check();
    await colleague.getByRole('button', { name: 'Lưu món' }).click();
    await expect(colleague.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Lưu món' }).click();
    await expect(
      page.getByText('Món đã thay đổi. Kiểm tra phiên bản mới trước khi lưu.'),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Tiếp tục sửa trên phiên bản mới' })
      .click();
    await expect(page.getByLabel('Giá bán (₫)')).toHaveValue('139000');
    await expect(page.getByLabel('Cho phép đặt trước')).toBeChecked();
    await page.getByRole('button', { name: 'Lưu món' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
