const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const contract = require('@ba-anh-em/api-contract/openapi.json');
const Ajv2020 = require('ajv/dist/2020').default;
const { createApiApp } = require('../../dist/api-app.js');
const {
  readRuntimeConfig,
} = require('../../dist/platform/config/runtime-config.js');

let app;
let baseUrl;
const requestLogs = [];
const schemas = new Ajv2020({ strict: false });
schemas.addFormat('uuid', /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);

function checkResponse(path, status, body) {
  const { schema } =
    contract.paths[path].get.responses[status].content['application/json'];
  const validate = schemas.compile(schema);
  assert.ok(validate(schema.example), JSON.stringify(validate.errors));
  assert.ok(validate(body), JSON.stringify(validate.errors));
}

before(async () => {
  app = await createApiApp(
    readRuntimeConfig({ API_CORS_ORIGINS: 'http://localhost:5173' }),
    {
      log: (value) => requestLogs.push(value),
      warn() {},
      error() {},
    },
  );
  app
    .getHttpAdapter()
    .getInstance()
    .get('/test-only-error', () => {
      throw new Error('fixture-internal-detail');
    });
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
});

after(async () => {
  await app?.close();
});

test('reports the process alive under the API prefix', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health/live`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const payload = await response.json();
  assert.deepEqual(payload, { status: 'ok' });
  checkResponse('/api/v1/health/live', 200, payload);
});

test('reports unavailable readiness while the database is unconfigured', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health/ready`);

  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.code, 'NOT_READY');
  assert.equal(payload.retryable, true);
  assert.equal(payload.traceId, response.headers.get('x-trace-id'));
  checkResponse('/api/v1/health/ready', 503, payload);
});

test('returns a safe, correlated error for an unknown route', async () => {
  const response = await fetch(`${baseUrl}/api/v1/nonexistent`, {
    headers: { 'X-Trace-Id': 'untrusted' },
  });
  const traceId = response.headers.get('x-trace-id');

  assert.equal(response.status, 404);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.match(traceId, /^[0-9a-f-]{36}$/);
  assert.deepEqual(await response.json(), {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Không tìm thấy tài nguyên.',
    traceId,
    retryable: false,
  });
});

test('rejects malformed JSON using the shared error contract', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health/live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"unterminated"',
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'INVALID_REQUEST');
});

test('returns an unexpected server error without exposing or retrying it', async () => {
  const response = await fetch(`${baseUrl}/test-only-error`);
  const payload = await response.json();

  assert.equal(response.status, 500);
  assert.equal(payload.code, 'INTERNAL_ERROR');
  assert.equal(payload.retryable, false);
  assert.doesNotMatch(JSON.stringify(payload), /fixture-internal-detail/);
});

test('rejects JSON payloads above the configured limit', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health/live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'x'.repeat(101 * 1024) }),
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).code, 'PAYLOAD_TOO_LARGE');
});

test('sets credentialed CORS headers only for configured origins', async () => {
  const allowed = await fetch(`${baseUrl}/api/v1/health/live`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET',
    },
  });
  assert.equal(allowed.status, 204);
  assert.equal(
    allowed.headers.get('access-control-allow-origin'),
    'http://localhost:5173',
  );
  assert.equal(allowed.headers.get('access-control-allow-credentials'), 'true');

  const denied = await fetch(`${baseUrl}/api/v1/health/live`, {
    headers: { Origin: 'https://another.example' },
  });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  await denied.body.cancel();
});

test('logs the trace ID and status without request data', async () => {
  const unsafe = 'fixture-private-value';
  const response = await fetch(
    `${baseUrl}/api/v1/health/live?contact=${unsafe}`,
    {
      headers: { Cookie: `session=${unsafe}` },
    },
  );
  await response.json();
  const traceId = response.headers.get('x-trace-id');
  const entry = requestLogs.find((log) => log.traceId === traceId);

  assert.equal(entry?.event, 'http.request');
  assert.equal(entry?.status, 200);
  assert.equal(entry?.method, 'GET');
  assert.ok(!JSON.stringify(entry).includes(unsafe));
});

test('documents the routes served by the foundation', async () => {
  const response = await fetch(`${baseUrl}/api/v1/openapi.json`);

  assert.equal(response.status, 200);
  const document = await response.json();
  assert.deepEqual(document, contract);
  const { paths } = document;
  assert.equal(paths['/api/v1/health/live'].get.operationId, 'getLiveness');
  assert.equal(paths['/api/v1/health/ready'].get.operationId, 'getReadiness');
  assert.deepEqual(paths['/api/v1/health/live'].get.security, []);
  assert.ok(paths['/api/v1/health/live'].get.responses['200']);
  assert.ok(paths['/api/v1/health/ready'].get.responses['200']);
  assert.ok(paths['/api/v1/health/ready'].get.responses['503']);
  assert.ok(
    paths['/api/v1/health/ready'].get.responses['503'].headers['X-Trace-Id'],
  );
});

test('rejects unknown DTO fields and keeps field validation structured', async () => {
  const { IsInt } = require('class-validator');
  const {
    createValidationPipe,
  } = require('../../dist/platform/http/validation.js');
  class OrderInput {}
  IsInt()(OrderInput.prototype, 'quantity');

  await assert.rejects(
    createValidationPipe().transform(
      { quantity: 'oops', unexpected: 'private' },
      { type: 'body', metatype: OrderInput },
    ),
    (error) => {
      assert.equal(error.getStatus(), 422);
      const problem = error.getResponse();
      assert.equal(problem.code, 'VALIDATION_FAILED');
      assert.deepEqual(Object.keys(problem.fields).sort(), [
        'quantity',
        'unexpected',
      ]);
      assert.ok(!JSON.stringify(problem).includes('private'));
      return true;
    },
  );
});

test(
  'reports ready with PostgreSQL 17 and the foundation schema',
  { skip: !process.env.BAE_TEST_DATABASE_URL },
  async () => {
    const dbApp = await createApiApp(
      readRuntimeConfig({
        DATABASE_URL: process.env.BAE_TEST_DATABASE_URL,
      }),
      false,
    );
    try {
      await dbApp.listen(0, '127.0.0.1');
      const response = await fetch(
        `${await dbApp.getUrl()}/api/v1/health/ready`,
      );
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.deepEqual(payload, { status: 'ok' });
      checkResponse('/api/v1/health/ready', 200, payload);
    } finally {
      await dbApp.close();
    }
  },
);
