import { expect, test, type Page } from '@playwright/test';

test.describe('local booking', () => {
  test.skip(
    process.env.BAE_E2E_BOOKING !== '1',
    'Requires the disposable booking database',
  );

  async function completeDraft(page: Page, time: string) {
    const date = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(Date.now() + 2 * 86_400_000));
    await page.goto('/dat-ban');
    await page.getByLabel(/Ngày đến/).fill(date);
    await page.getByRole('button', { name: 'Kiểm tra khung giờ' }).click();
    await page.getByRole('button', { name: time, exact: true }).click();
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await page.getByRole('button', { name: 'Dùng thông tin mẫu' }).click();
    await page.getByRole('button', { name: 'Kiểm tra lại' }).click();
  }

  test('recovers a committed booking after the response is lost and reloads its result', async ({
    page,
    browser,
  }) => {
    await completeDraft(page, '11:00');
    let recordedId: string | undefined;
    await page.route('**/api/v1/reservations', async (route) => {
      const response = await route.fetch();
      expect(response.status()).toBe(201);
      recordedId = (await response.json()).id;
      await route.abort('failed');
    });
    await page.getByRole('button', { name: 'Gửi yêu cầu đặt bàn' }).click();
    await page.getByRole('button', { name: 'Kiểm tra kết quả' }).click();
    await expect(
      page.getByRole('heading', { name: 'Kết quả đặt bàn thử' }),
    ).toBeVisible();
    expect(new URL(page.url()).searchParams.get('id')).toBe(recordedId);
    await expect(page.getByRole('link', { name: 'Xem tiền cọc' })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole('link', { name: 'Chọn món trước' }),
    ).toHaveCount(0);
    await page.reload();
    await expect(page.getByText(`Mã tham chiếu ${recordedId}`)).toBeVisible();

    const otherContext = await browser.newContext();
    try {
      const other = await otherContext.newPage();
      await other.goto(page.url());
      await expect(
        other.getByText('Không tìm thấy lượt trong phiên này'),
      ).toBeVisible();
    } finally {
      await otherContext.close();
    }
  });

  test('uses the same key and request when checking finds no committed booking', async ({
    page,
  }) => {
    await completeDraft(page, '16:00');
    const requests: Array<{ key: string | undefined; data: unknown }> = [];
    await page.route('**/api/v1/reservations', (route) => {
      requests.push({
        key: route.request().headers()['idempotency-key'],
        data: route.request().postDataJSON(),
      });
      return requests.length === 1 ? route.abort('failed') : route.continue();
    });
    await page.getByRole('button', { name: 'Gửi yêu cầu đặt bàn' }).click();
    await page.getByRole('button', { name: 'Kiểm tra kết quả' }).click();
    await expect(
      page.getByText('Chưa thấy kết quả.', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Gửi lại cùng yêu cầu' }).click();
    await expect(
      page.getByRole('heading', { name: 'Kết quả đặt bàn thử' }),
    ).toBeVisible();
    expect(requests).toHaveLength(2);
    expect(requests[0]?.key).toMatch(/^[A-Za-z0-9-]{16,128}$/);
    expect(requests[1]).toEqual(requests[0]);
  });

  test('lets the guest retry a session setup failure before sending a reservation', async ({
    page,
  }) => {
    await completeDraft(page, '18:00');
    let sessionCalls = 0;
    let reservationCalls = 0;
    await page.route('**/api/v1/guest/session', async (route) => {
      sessionCalls += 1;
      if (sessionCalls === 1)
        await route.fulfill({
          status: 503,
          json: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Fixture' },
        });
      else await route.continue();
    });
    await page.route('**/api/v1/reservations', async (route) => {
      reservationCalls += 1;
      await route.continue();
    });
    await page.getByRole('button', { name: 'Gửi yêu cầu đặt bàn' }).click();
    await expect(
      page.getByText('Chưa thiết lập được phiên khách. Vui lòng thử lại.'),
    ).toBeVisible();
    expect(reservationCalls).toBe(0);
    await page.getByRole('button', { name: 'Gửi yêu cầu đặt bàn' }).click();
    await expect(
      page.getByRole('heading', { name: 'Kết quả đặt bàn thử' }),
    ).toBeVisible();
    expect(reservationCalls).toBe(1);
  });

  test('updates a pending result while the tab stays open', async ({
    page,
  }) => {
    await page.clock.install();
    let held = true;
    await page.route('**/api/v1/reservations/BAE-FIXTURE', (route) =>
      route.fulfill({
        status: 200,
        json: {
          id: 'BAE-FIXTURE',
          date: '2040-01-01',
          time: '11:00',
          guests: 4,
          status: held ? 'pending' : 'cancelled',
          statusReason: held ? null : 'HOLD_EXPIRED',
        },
      }),
    );
    await page.goto('/dat-ban/ket-qua?id=BAE-FIXTURE');
    await expect(
      page.getByText('Bàn đang được giữ tạm cho lượt đặt thử.'),
    ).toBeVisible();
    held = false;
    await page.clock.fastForward(31_000);
    await expect(
      page.getByRole('heading', { name: 'Lượt giữ bàn đã hết hạn' }),
    ).toBeVisible();
  });

  test('requires an explicit new request after losing the original guest session', async ({
    page,
    context,
  }) => {
    await completeDraft(page, '19:30');
    let sends = 0;
    await page.route('**/api/v1/reservations', async (route) => {
      sends += 1;
      await route.abort('failed');
    });
    await page.getByRole('button', { name: 'Gửi yêu cầu đặt bàn' }).click();
    await expect(
      page.getByRole('button', { name: 'Kiểm tra kết quả' }),
    ).toBeVisible();
    await context.clearCookies();
    await page.getByRole('button', { name: 'Kiểm tra kết quả' }).click();
    await expect(
      page.getByText(
        'Phiên khách đã hết hạn. Lượt trước có thể đã được ghi nhận.',
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Gửi lại cùng yêu cầu' }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Bắt đầu yêu cầu mới' }).click();
    await expect(
      page.getByRole('button', { name: 'Kiểm tra khung giờ' }),
    ).toBeVisible();
    expect(sends).toBe(1);
  });
});
