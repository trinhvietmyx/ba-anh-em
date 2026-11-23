import assert from 'node:assert/strict';
import test from 'node:test';
import { readApiResponse } from './http-client.ts';

test('reads a successful JSON response', async () => {
  const response = new Response(JSON.stringify({ id: 'BAE-1042' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

  assert.deepEqual(await readApiResponse(response), { id: 'BAE-1042' });
});

test('accepts a no-content success response for void operations', async () => {
  assert.equal(
    await readApiResponse<void>(new Response(null, { status: 204 })),
    undefined,
  );
});

test('converts a structured API failure into a typed error', async () => {
  const response = new Response(
    JSON.stringify({
      code: 'SLOT_UNAVAILABLE',
      message: 'Khung giờ này vừa hết chỗ.',
      fields: { time: 'Chọn khung giờ khác.' },
      traceId: 'trace-42',
    }),
    { status: 409, headers: { 'content-type': 'application/json' } },
  );

  await assert.rejects(readApiResponse(response), (error: unknown) => {
    assert.equal((error as Error & { status: number }).status, 409);
    assert.equal((error as Error & { code: string }).code, 'SLOT_UNAVAILABLE');
    assert.equal((error as Error & { traceId: string }).traceId, 'trace-42');
    assert.deepEqual((error as Error & { fields: object }).fields, {
      time: 'Chọn khung giờ khác.',
    });
    return true;
  });
});

test('reports an invalid response instead of exposing parser details', async () => {
  const response = new Response('<html>not json</html>', {
    status: 200,
    headers: { 'content-type': 'text/html' },
  });

  await assert.rejects(readApiResponse(response), (error: unknown) => {
    assert.equal((error as Error & { code: string }).code, 'INVALID_RESPONSE');
    assert.equal(
      (error as Error).message,
      'Máy chủ trả về dữ liệu không hợp lệ.',
    );
    return true;
  });
});
