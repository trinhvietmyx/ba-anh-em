import type { IncomingHttpHeaders } from 'node:http';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { sql } from 'kysely';
import * as oidc from 'openid-client';
import type { StaffAuthConfig } from '../../platform/config/auth-config';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../platform/config/runtime-config';
import { DatabaseService } from '../../platform/db/database.service';
import {
  LOGIN_COOKIE,
  opaqueToken,
  readCookie,
  tokenDigest,
} from './session-security';
import {
  StaffSessionService,
  type StaffDestination,
} from './staff-session.service';

const LOGIN_TTL_SECONDS = 300;
const CALLBACK_PATH = '/api/v1/ops/auth/callback';
const STAFF_HOME = '/van-hanh';
const DEFAULT_DESTINATIONS: StaffDestination[] = [
  { path: '/van-hanh/dat-cho', permission: 'reservations.read' },
  { path: '/van-hanh/so-do-ban', permission: 'floorplan.read' },
  { path: '/van-hanh/chuan-bi-bep', permission: 'kitchen.read' },
  { path: '/van-hanh/dat-coc', permission: 'deposits.read' },
  { path: '/van-hanh/bao-cao', permission: 'reports.read' },
  { path: '/van-hanh/thuc-don', permission: 'menu.read' },
];
const BOOKING_DETAILS = /^\/van-hanh\/dat-cho\/[A-Za-z0-9_-]+(\/doi-huy)?$/;

function destinationsFor(path: string, origin: string): StaffDestination[] {
  const { pathname, search } = new URL(path, origin);
  const normalizedPath = pathname.replace(/\/$/, '');
  if (normalizedPath === STAFF_HOME) return DEFAULT_DESTINATIONS;
  const destination = DEFAULT_DESTINATIONS.find(
    (item) => item.path === normalizedPath,
  );
  if (destination) return [{ ...destination, path: normalizedPath + search }];
  const detail = BOOKING_DETAILS.exec(normalizedPath);
  if (detail)
    return [
      {
        path: normalizedPath + search,
        permission: detail[1]
          ? 'reservations.write_events'
          : 'reservations.read',
      },
    ];
  throw new BadRequestException();
}

function returnPath(value: unknown, origin: string): string {
  if (value === undefined) return STAFF_HOME;
  if (
    typeof value !== 'string' ||
    value.length > 512 ||
    /[\\#]/u.test(value) ||
    [...value].some((character) => character.charCodeAt(0) < 33) ||
    !/^\/van-hanh(?:\/|\?|$)/.test(value) ||
    /[%.]/.test(value.split('?')[0] ?? '')
  ) {
    throw new BadRequestException();
  }
  const url = new URL(value, origin);
  const path = url.pathname + url.search;
  if (path.length > 512) throw new BadRequestException();
  destinationsFor(path, origin);
  return path;
}

class OidcUnavailable extends Error {}

const fetchIssuer: NonNullable<
  oidc.DiscoveryRequestOptions[typeof oidc.customFetch]
> = async (url, init) => {
  try {
    const body =
      init.body instanceof Uint8Array ? new Uint8Array(init.body) : init.body;
    const response = await fetch(url, { ...init, body });
    if (response.status !== 429 && response.status < 500) return response;
    await response.body?.cancel();
  } catch {
    throw new OidcUnavailable();
  }
  throw new OidcUnavailable();
};

function callbackQuery(rawUrl: string): URLSearchParams {
  const index = rawUrl.indexOf('?');
  return new URLSearchParams(index === -1 ? '' : rawUrl.slice(index + 1));
}

@Injectable()
export class StaffAuthService {
  private readonly logger = new Logger(StaffAuthService.name);
  private discovery?: Promise<oidc.Configuration>;

  constructor(
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    private readonly database: DatabaseService,
    private readonly sessions: StaffSessionService,
  ) {}

  private settings() {
    const { auth } = this.config;
    const db = this.database.connection;
    if (!db || !auth?.staff) throw new ServiceUnavailableException();
    return { db, origin: auth.origin, staff: auth.staff };
  }

  private async client(staff: StaffAuthConfig): Promise<oidc.Configuration> {
    this.discovery ??= (async () => {
      const issuer = new URL(staff.issuer);
      const client = await oidc.discovery(
        issuer,
        staff.clientId,
        undefined,
        oidc.ClientSecretBasic(staff.clientSecret),
        {
          timeout: 5,
          [oidc.customFetch]: fetchIssuer,
          execute: staff.allowLoopbackIssuer
            ? [oidc.allowInsecureRequests, oidc.enableNonRepudiationChecks]
            : [oidc.enableNonRepudiationChecks],
        },
      );
      const metadata = client.serverMetadata();
      for (const field of [
        metadata.authorization_endpoint,
        metadata.token_endpoint,
        metadata.jwks_uri,
      ]) {
        const endpoint = field && URL.parse(field);
        if (
          !endpoint ||
          endpoint.username ||
          endpoint.password ||
          !(
            endpoint.protocol === 'https:' ||
            (staff.allowLoopbackIssuer && endpoint.origin === issuer.origin)
          )
        ) {
          throw new Error('Invalid OIDC metadata');
        }
      }
      if (metadata.issuer !== staff.issuer || !metadata.supportsPKCE())
        throw new Error('Invalid OIDC issuer or PKCE support');
      return client;
    })().catch(() => {
      this.discovery = undefined;
      this.logger.warn({ event: 'staff.oidc.unavailable' });
      throw new ServiceUnavailableException();
    });
    return this.discovery;
  }

  async begin(requestedPath: unknown) {
    const { db, origin, staff } = this.settings();
    const returnTo = returnPath(requestedPath, origin);
    const client = await this.client(staff);
    const token = opaqueToken();
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const verifier = oidc.randomPKCECodeVerifier();
    const location = oidc.buildAuthorizationUrl(client, {
      redirect_uri: new URL(CALLBACK_PATH, origin).href,
      response_type: 'code',
      scope: 'openid',
      state,
      nonce,
      code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
      code_challenge_method: 'S256',
    });
    await sql`
      DELETE FROM ba_anh_em.staff_login_attempts WHERE token_digest IN (
        SELECT token_digest FROM ba_anh_em.staff_login_attempts
        WHERE expires_at <= now() ORDER BY expires_at LIMIT 100
      )
    `.execute(db);
    await sql`
      INSERT INTO ba_anh_em.staff_login_attempts (token_digest, state_digest, nonce, code_verifier, return_to, expires_at)
      VALUES (${tokenDigest(token)}, ${tokenDigest(state)}, ${nonce}, ${verifier}, ${returnTo}, now() + ${LOGIN_TTL_SECONDS} * interval '1 second')
    `.execute(db);
    return { token, ttl: LOGIN_TTL_SECONDS, location: location.href };
  }

  async finish(headers: IncomingHttpHeaders, rawUrl: string) {
    const { db, origin, staff } = this.settings();
    const query = callbackQuery(rawUrl);
    const state = query.get('state');
    const code = query.get('code');
    if (
      !state ||
      !/^[A-Za-z0-9_-]{43}$/.test(state) ||
      query.getAll('state').length !== 1 ||
      (code && code.length > 4096)
    )
      throw new BadRequestException();
    const token = readCookie(headers, LOGIN_COOKIE);
    if (!token) throw new ForbiddenException();

    const {
      rows: [attempt],
    } = await sql<{ nonce: string; code_verifier: string; return_to: string }>`
      DELETE FROM ba_anh_em.staff_login_attempts
      WHERE token_digest = ${tokenDigest(token)} AND state_digest = ${tokenDigest(state)} AND expires_at > now()
      RETURNING nonce, code_verifier, return_to
    `.execute(db);
    if (!attempt) throw new ForbiddenException();
    const client = await this.client(staff);
    const callback = new URL(CALLBACK_PATH, origin);
    callback.search = query.toString();
    let identity: oidc.IDToken | undefined;
    try {
      const tokens = await oidc.authorizationCodeGrant(client, callback, {
        pkceCodeVerifier: attempt.code_verifier,
        expectedNonce: attempt.nonce,
        expectedState: state,
        idTokenExpected: true,
      });
      identity = tokens.claims();
    } catch (error) {
      if (
        error instanceof OidcUnavailable ||
        (error instanceof oidc.ClientError &&
          (error.cause instanceof OidcUnavailable ||
            error.code === 'OAUTH_TIMEOUT' ||
            error.code === 'OAUTH_ABORT'))
      ) {
        this.logger.warn({ event: 'staff.oidc.unavailable' });
        throw new ServiceUnavailableException();
      }
      this.logger.warn({ event: 'staff.oidc.rejected' });
      throw new ForbiddenException();
    }
    if (!identity?.sub || identity.iss !== staff.issuer)
      throw new ForbiddenException();
    return this.sessions.create(
      headers,
      identity.iss,
      identity.sub,
      destinationsFor(attempt.return_to, origin),
    );
  }
}
