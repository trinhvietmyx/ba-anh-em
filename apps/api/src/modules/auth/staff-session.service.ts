import type { IncomingHttpHeaders } from 'node:http';
import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
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
  opaqueToken,
  readCookie,
  requireCookie,
  requireCsrf,
  requireOrigin,
  STAFF_COOKIE,
  tokenDigest,
} from './session-security';

export const STAFF_PERMISSIONS = [
  'menu.read',
  'menu.write',
  'reservations.read',
  'reservations.read_contact',
  'reservations.read_audit',
  'reservations.write_events',
  'floorplan.read',
  'floorplan.allocate',
  'kitchen.read',
  'deposits.read',
  'deposits.reconcile',
  'reports.read',
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export interface StaffDestination {
  path: string;
  permission: StaffPermission;
}

interface StaffSessionRow {
  id: string;
  staff_user_id: string;
  venue_id: string;
  display_name: string;
  display_role: 'employee' | 'admin';
  permissions: StaffPermission[];
}

@Injectable()
export class StaffSessionService {
  private readonly logger = new Logger(StaffSessionService.name);

  constructor(
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    private readonly database: DatabaseService,
  ) {}

  private settings() {
    const { auth } = this.config;
    const db = this.database.connection;
    if (!db || !auth?.staff) throw new ServiceUnavailableException();
    return { db, origin: auth.origin, staff: auth.staff };
  }

  async create(
    headers: IncomingHttpHeaders,
    issuer: string,
    subject: string,
    destinations: StaffDestination[],
  ) {
    const { db, staff } = this.settings();
    const token = opaqueToken();
    const previous = readCookie(headers, STAFF_COOKIE);
    const account = await db.transaction().execute(async (trx) => {
      const {
        rows: [created],
      } = await sql<{
        staff_user_id: string;
        venue_id: string;
        permissions_at_login: StaffPermission[];
      }>`
        INSERT INTO ba_anh_em.staff_sessions (staff_user_id, venue_id, token_digest, permissions_at_login, idle_expires_at, expires_at)
        SELECT u.id, v.id, ${tokenDigest(token)}, grants.permissions,
          now() + ${staff.idleSeconds} * interval '1 second', now() + ${staff.ttlSeconds} * interval '1 second'
        FROM ba_anh_em.staff_users u CROSS JOIN ba_anh_em.venues v
        CROSS JOIN LATERAL (
          SELECT array_agg(permission) AS permissions FROM ba_anh_em.staff_venue_grants g
          WHERE g.staff_user_id = u.id AND g.venue_id = v.id
        ) grants
        WHERE u.active AND u.oidc_issuer = ${issuer} AND u.oidc_subject = ${subject} AND v.code = ${staff.venueCode}
          AND grants.permissions && ${destinations.map((destination) => destination.permission)}::text[]
        RETURNING staff_user_id, venue_id, permissions_at_login
      `.execute(trx);
      if (created && previous) {
        await sql`
          UPDATE ba_anh_em.staff_sessions SET revoked_at = now()
          WHERE token_digest = ${tokenDigest(previous)} AND revoked_at IS NULL
        `.execute(trx);
      }
      return created;
    });
    if (!account) {
      this.logger.warn({ event: 'staff.login.denied' });
      throw new ForbiddenException();
    }
    this.logger.log({
      event: 'staff.login.succeeded',
      staffUserId: account.staff_user_id,
      venueId: account.venue_id,
    });
    const destination = destinations.find(({ permission }) =>
      account.permissions_at_login.includes(permission),
    );
    if (!destination)
      throw new Error('Staff session created without an eligible destination');
    return { token, ttl: staff.ttlSeconds, location: destination.path };
  }

  private async authorize(
    headers: IncomingHttpHeaders,
    required?: {
      venueId: string;
      permissions: readonly StaffPermission[];
      write: boolean;
    },
  ) {
    const { db, origin, staff } = this.settings();
    if (required?.write) requireOrigin(headers, origin);
    const token = requireCookie(headers, STAFF_COOKIE);
    if (required?.write) requireCsrf(headers, STAFF_COOKIE, token);

    return db.transaction().execute(async (trx) => {
      const {
        rows: [session],
      } = await sql<StaffSessionRow>`
        SELECT s.id, s.staff_user_id, s.venue_id, u.display_name, u.display_role,
          ARRAY(SELECT permission FROM ba_anh_em.staff_venue_grants g
            WHERE g.staff_user_id = u.id AND g.venue_id = s.venue_id
              AND g.permission = ANY(s.permissions_at_login) ORDER BY permission) AS permissions
        FROM ba_anh_em.staff_sessions s
        JOIN ba_anh_em.staff_users u ON u.id = s.staff_user_id
        JOIN ba_anh_em.venues v ON v.id = s.venue_id
        WHERE s.token_digest = ${tokenDigest(token)} AND s.revoked_at IS NULL AND u.active
          AND s.idle_expires_at > now() AND s.expires_at > now() AND v.code = ${staff.venueCode}
        FOR UPDATE OF s
      `.execute(trx);
      if (!session) throw new UnauthorizedException();
      if (
        !session.permissions.length ||
        (required &&
          (session.venue_id !== required.venueId ||
            !required.permissions.every((permission) =>
              session.permissions.includes(permission),
            )))
      ) {
        this.logger.warn({
          event: 'staff.access.denied',
          staffUserId: session.staff_user_id,
          venueId: session.venue_id,
        });
        throw new ForbiddenException();
      }
      const {
        rows: [updated],
      } = await sql<{ expires_at: Date }>`
        UPDATE ba_anh_em.staff_sessions SET idle_expires_at = LEAST(expires_at, now() + ${staff.idleSeconds} * interval '1 second')
        WHERE id = ${session.id}
        RETURNING idle_expires_at AS expires_at
      `.execute(trx);
      if (!updated) throw new Error('Staff session refresh returned no row');
      return {
        session,
        csrf: csrfToken(STAFF_COOKIE, token),
        expiresAt: updated.expires_at.toISOString(),
      };
    });
  }

  async get(headers: IncomingHttpHeaders) {
    const { session, csrf, expiresAt } = await this.authorize(headers);
    return {
      displayName: session.display_name,
      displayRole: session.display_role,
      permissions: session.permissions,
      csrfToken: csrf,
      expiresAt,
    };
  }

  async requirePermission(
    headers: IncomingHttpHeaders,
    venueId: string,
    permission: StaffPermission | readonly StaffPermission[],
    write: boolean,
  ): Promise<string> {
    const { session } = await this.authorize(headers, {
      venueId,
      permissions: typeof permission === 'string' ? [permission] : permission,
      write,
    });
    return session.staff_user_id;
  }

  async end(headers: IncomingHttpHeaders) {
    const { db, origin } = this.settings();
    requireOrigin(headers, origin);
    const token = requireCookie(headers, STAFF_COOKIE);
    requireCsrf(headers, STAFF_COOKIE, token);
    const {
      rows: [ended],
    } = await sql<{ staff_user_id: string; venue_id: string }>`
      UPDATE ba_anh_em.staff_sessions SET revoked_at = now()
      WHERE token_digest = ${tokenDigest(token)} AND revoked_at IS NULL
        AND idle_expires_at > now() AND expires_at > now()
      RETURNING staff_user_id, venue_id
    `.execute(db);
    if (!ended) throw new UnauthorizedException();
    this.logger.log({
      event: 'staff.logout.succeeded',
      staffUserId: ended.staff_user_id,
      venueId: ended.venue_id,
    });
  }
}
