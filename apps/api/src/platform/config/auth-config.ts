export interface AuthConfig {
  origin: string;
  rateLimitPerMinute: number;
  guestTtlSeconds?: number;
  staff?: StaffAuthConfig;
}

export interface StaffAuthConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  venueCode: string;
  ttlSeconds: number;
  idleSeconds: number;
  allowLoopbackIssuer: boolean;
}

function isLoopback(url: URL): boolean {
  return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value?.trim())
    throw new Error(`${key} is required for session configuration`);
  return value;
}

function seconds(env: NodeJS.ProcessEnv, key: string): number {
  const value = required(env, key);
  const duration = Number(value);
  if (!/^\d+$/.test(value) || duration < 1 || duration > 2_147_483_647) {
    throw new Error(`${key} must be a positive integer in seconds`);
  }
  return duration;
}

export function readAuthConfig(
  env: NodeJS.ProcessEnv,
  environment: string,
): AuthConfig | undefined {
  const staffEnabled = [
    'OIDC_ISSUER',
    'OIDC_CLIENT_ID',
    'OIDC_CLIENT_SECRET',
    'STAFF_VENUE_CODE',
    'STAFF_SESSION_TTL_SECONDS',
    'STAFF_SESSION_IDLE_SECONDS',
  ].some((key) => !!env[key]);
  const guestEnabled = !!env.GUEST_SESSION_TTL_SECONDS;
  if (!env.APP_ORIGIN && !staffEnabled && !guestEnabled) return undefined;

  const origin = required(env, 'APP_ORIGIN');
  const url = URL.parse(origin);
  if (
    !url ||
    url.origin !== origin ||
    !(
      url.protocol === 'https:' ||
      (environment !== 'production' &&
        url.protocol === 'http:' &&
        isLoopback(url))
    )
  ) {
    throw new Error(
      'APP_ORIGIN must be an HTTPS origin or a local loopback HTTP origin',
    );
  }
  const guestTtlSeconds = guestEnabled
    ? seconds(env, 'GUEST_SESSION_TTL_SECONDS')
    : undefined;
  const rateLimitPerMinute = env.AUTH_RATE_LIMIT_PER_MINUTE
    ? seconds(env, 'AUTH_RATE_LIMIT_PER_MINUTE')
    : 60;
  if (!staffEnabled) return { origin, guestTtlSeconds, rateLimitPerMinute };

  const issuer = required(env, 'OIDC_ISSUER');
  const issuerUrl = URL.parse(issuer);
  const allowLoopbackIssuer =
    !!issuerUrl &&
    environment === 'test' &&
    issuerUrl.protocol === 'http:' &&
    isLoopback(issuerUrl);
  if (
    !issuerUrl ||
    issuerUrl.username ||
    issuerUrl.password ||
    issuerUrl.search ||
    issuerUrl.hash ||
    !(issuerUrl.protocol === 'https:' || allowLoopbackIssuer)
  ) {
    throw new Error('OIDC_ISSUER must be an HTTPS issuer URL');
  }
  const clientId = required(env, 'OIDC_CLIENT_ID');
  const clientSecret = required(env, 'OIDC_CLIENT_SECRET');
  const venueCode = required(env, 'STAFF_VENUE_CODE');
  const ttlSeconds = seconds(env, 'STAFF_SESSION_TTL_SECONDS');
  const idleSeconds = seconds(env, 'STAFF_SESSION_IDLE_SECONDS');
  if (idleSeconds > ttlSeconds)
    throw new Error(
      'STAFF_SESSION_IDLE_SECONDS must not exceed STAFF_SESSION_TTL_SECONDS',
    );

  return {
    origin,
    guestTtlSeconds,
    rateLimitPerMinute,
    staff: {
      issuer,
      clientId,
      clientSecret,
      venueCode,
      ttlSeconds,
      idleSeconds,
      allowLoopbackIssuer,
    },
  };
}
