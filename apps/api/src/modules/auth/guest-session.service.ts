import type { IncomingHttpHeaders } from 'node:http';
import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { sql } from 'kysely';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../platform/config/runtime-config';
import { DatabaseService } from '../../platform/db/database.service';
import {
  csrfToken,
  GUEST_COOKIE,
  opaqueToken,
  readCookie,
  requireCookie,
  requireCsrf,
  requireOrigin,
  tokenDigest,
} from './session-security';

interface GuestSessionRow {
  id: string;
  expires_at: Date;
}

@Injectable()
export class GuestSessionService {
  constructor(
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    private readonly database: DatabaseService,
  ) {}

  private settings() {
    const { auth } = this.config;
    const db = this.database.connection;
    if (!db || !auth?.guestTtlSeconds) throw new ServiceUnavailableException();
    return { db, origin: auth.origin, ttl: auth.guestTtlSeconds };
  }

  private async findSession(token: string) {
    const { db } = this.settings();
    return (
      await sql<GuestSessionRow>`
      SELECT id, expires_at FROM ba_anh_em.guest_sessions
      WHERE token_digest = ${tokenDigest(token)} AND revoked_at IS NULL AND expires_at > now()
    `.execute(db)
    ).rows[0];
  }

  async establish(headers: IncomingHttpHeaders) {
    const { db, origin, ttl } = this.settings();
    requireOrigin(headers, origin);
    const existingToken = readCookie(headers, GUEST_COOKIE);
    const existing = existingToken && (await this.findSession(existingToken));
    if (existing && existingToken) {
      return {
        body: {
          csrfToken: csrfToken(GUEST_COOKIE, existingToken),
          expiresAt: existing.expires_at.toISOString(),
        },
      };
    }

    const token = opaqueToken();
    const [created] = (
      await sql<GuestSessionRow>`
      INSERT INTO ba_anh_em.guest_sessions (token_digest, expires_at)
      VALUES (${tokenDigest(token)}, now() + ${ttl} * interval '1 second')
      RETURNING id, expires_at
    `.execute(db)
    ).rows;
    if (!created) throw new Error('Guest session insert returned no row');
    return {
      cookie: { token, ttl },
      body: {
        csrfToken: csrfToken(GUEST_COOKIE, token),
        expiresAt: created.expires_at.toISOString(),
      },
    };
  }

  async requireWriteSession(headers: IncomingHttpHeaders): Promise<string> {
    const { origin } = this.settings();
    requireOrigin(headers, origin);
    const token = requireCookie(headers, GUEST_COOKIE);
    requireCsrf(headers, GUEST_COOKIE, token);
    const guest = await this.findSession(token);
    if (!guest) throw new UnauthorizedException();
    return guest.id;
  }
}
