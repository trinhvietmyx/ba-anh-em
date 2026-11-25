const assert = require('node:assert/strict');
const {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
} = require('node:crypto');
const { once } = require('node:events');
const { createServer } = require('node:http');

async function startOidc(t, clientId, clientSecret) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const attempts = new Map();
  let issuer;
  const server = createServer(async (req, res) => {
    const json = (value, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(value));
    };
    if (req.url === '/.well-known/openid-configuration') {
      return json({
        issuer,
        authorization_endpoint: issuer + '/authorize',
        token_endpoint: issuer + '/token',
        jwks_uri: issuer + '/jwks',
        code_challenge_methods_supported: ['S256'],
        id_token_signing_alg_values_supported: ['RS256'],
      });
    }
    if (req.url === '/jwks')
      return json({
        keys: [
          {
            ...publicKey.export({ format: 'jwk' }),
            kid: 'fixture-key',
            alg: 'RS256',
            use: 'sig',
          },
        ],
      });
    if (req.url !== '/token') return json({}, 404);

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const form = new URLSearchParams(Buffer.concat(chunks).toString());
    const code = form.get('code');
    const attempt = attempts.get(code);
    attempts.delete(code);
    const verifier = form.get('code_verifier');
    if (!req.headers.authorization?.startsWith('Basic '))
      return json({ error: 'invalid_client' }, 400);
    const credentials = Buffer.from(
      req.headers.authorization.slice(6),
      'base64',
    ).toString();
    const colon = credentials.indexOf(':');
    const decode = (value) => decodeURIComponent(value.replace(/\+/g, ' '));
    if (
      colon < 0 ||
      decode(credentials.slice(0, colon)) !== clientId ||
      decode(credentials.slice(colon + 1)) !== clientSecret
    ) {
      return json({ error: 'invalid_client' }, 400);
    }
    if (
      !attempt ||
      !verifier ||
      createHash('sha256').update(verifier).digest('base64url') !==
        attempt.challenge
    ) {
      return json(
        {
          error: 'invalid_grant',
          error_description: 'Invalid fixture code or PKCE verifier',
        },
        400,
      );
    }
    if (
      form.get('redirect_uri') !== attempt.redirectUri ||
      form.get('grant_type') !== 'authorization_code'
    ) {
      return json(
        {
          error: 'invalid_grant',
          error_description: 'Invalid fixture redirect URI or grant type',
        },
        400,
      );
    }
    if (attempt.unavailable)
      return json({ error: 'temporarily_unavailable' }, 503);
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      iss: issuer,
      aud: clientId,
      sub: 'fixture-staff',
      iat: now,
      exp: now + 120,
      nonce: attempt.nonce,
      ...attempt.claims,
    };
    const encode = (value) =>
      Buffer.from(JSON.stringify(value)).toString('base64url');
    const payload = `${encode({ alg: 'RS256', kid: 'fixture-key' })}.${encode(claims)}`;
    const signature = sign('sha256', Buffer.from(payload), privateKey);
    if (attempt.invalidSignature) signature[0] ^= 1;
    return json({
      access_token: 'fixture-access-token',
      token_type: 'Bearer',
      id_token: `${payload}.${signature.toString('base64url')}`,
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  issuer = `http://127.0.0.1:${server.address().port}`;
  t.after(
    () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  );

  return {
    issuer,
    issue(location, options = {}) {
      const authorization = new URL(location);
      assert.equal(authorization.origin, issuer);
      assert.equal(authorization.pathname, '/authorize');
      const params = authorization.searchParams;
      assert.equal(params.get('response_type'), 'code');
      assert.equal(params.get('client_id'), clientId);
      assert.equal(params.get('scope'), 'openid');
      assert.equal(params.get('code_challenge_method'), 'S256');
      for (const key of ['state', 'nonce', 'code_challenge'])
        assert.match(params.get(key), /^[A-Za-z0-9_-]{43}$/);

      const redirectUri = params.get('redirect_uri');
      const code = 'fixture-code-' + randomBytes(8).toString('hex');
      attempts.set(code, {
        nonce: params.get('nonce'),
        challenge: params.get('code_challenge'),
        redirectUri,
        ...options,
      });
      const callback = new URL(redirectUri);
      callback.searchParams.set('code', code);
      callback.searchParams.set('state', params.get('state'));
      return { code, callback };
    },
  };
}

module.exports = { startOidc };
