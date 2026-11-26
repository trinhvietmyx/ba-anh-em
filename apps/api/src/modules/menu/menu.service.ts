import { createHash, randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { sql, type Kysely } from 'kysely';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../platform/config/runtime-config';
import { DatabaseService } from '../../platform/db/database.service';
import { ApiException } from '../../platform/http/api-error.filter';
import { requireRequestKey } from '../../platform/http/idempotency-key';
import { StaffSessionService } from '../auth/staff-session.service';
import { DISH_KEY_PATTERN, MAX_VERSION, type MenuItemDto } from './menu.dto';

const dishKeyPattern = new RegExp(DISH_KEY_PATTERN);

const fields = sql`public_key, name, category, description, price_vnd, image_url, available, published`;

interface MenuRow {
  public_key: string;
  name: string;
  category: string;
  description: string;
  price_vnd: string;
  image_url: string | null;
  available: boolean;
  published: boolean;
}

interface OpsMenuRow extends MenuRow {
  version: number;
}

interface MenuMutationRow extends OpsMenuRow {
  id: string;
}

function publicDish(row: MenuRow) {
  return {
    id: row.public_key,
    name: row.name,
    category: row.category,
    description: row.description,
    price: Number(row.price_vnd),
    image: row.image_url,
    available: row.available,
    published: row.published,
  };
}

function opsDish(row: OpsMenuRow) {
  return { dish: publicDish(row), version: row.version };
}

interface MenuTarget {
  dishId: string;
  expectedVersion: number;
}

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    private readonly database: DatabaseService,
    private readonly staff: StaffSessionService,
  ) {}

  private async scope() {
    const db = this.database.connection;
    const code = this.config.menuVenueCode;
    if (!db || !code) throw new ServiceUnavailableException();
    const {
      rows: [venue],
    } = await sql<{ id: string }>`
      SELECT id FROM ba_anh_em.venues WHERE code = ${code}
    `.execute(db);
    if (!venue) throw new ServiceUnavailableException();
    return { db, venueId: venue.id };
  }

  async listPublished() {
    const { db, venueId } = await this.scope();
    const { rows } = await sql<MenuRow>`
      SELECT ${fields} FROM ba_anh_em.menu_items
      WHERE venue_id = ${venueId} AND published ORDER BY display_order, public_key
    `.execute(db);
    return { items: rows.map(publicDish) };
  }

  async listForStaff(headers: IncomingHttpHeaders) {
    const { db, venueId } = await this.scope();
    await this.staff.requirePermission(headers, venueId, 'menu.read', false);
    const { rows } = await sql<OpsMenuRow>`
      SELECT ${fields}, version FROM ba_anh_em.menu_items
      WHERE venue_id = ${venueId} ORDER BY display_order, public_key
    `.execute(db);
    return { items: rows.map(opsDish) };
  }

  async save(
    headers: IncomingHttpHeaders,
    input: MenuItemDto,
    target?: MenuTarget,
  ) {
    const { db, venueId } = await this.scope();
    const staffId = await this.staff.requirePermission(
      headers,
      venueId,
      ['menu.read', 'menu.write'],
      true,
    );
    const requestKey = requireRequestKey(headers);
    if (
      target &&
      (target.dishId.length > 120 || !dishKeyPattern.test(target.dishId))
    )
      throw new BadRequestException();

    const item = {
      name: input.name.trim(),
      category: input.category.trim(),
      price: input.price,
      description: input.description.trim(),
      available: input.available,
      published: input.published,
    };
    const operation = target ? 'update' : 'create';
    const digest = createHash('sha256')
      .update(JSON.stringify([target?.dishId, target?.expectedVersion, item]))
      .digest();
    const lock = JSON.stringify([
      'menu',
      venueId,
      staffId,
      operation,
      requestKey,
    ]);
    const result = await db.transaction().execute(async (transaction) => {
      await sql`SELECT pg_advisory_xact_lock(hashtextextended(${lock}, 0))`.execute(
        transaction,
      );
      const {
        rows: [existing],
      } = await sql<{ request_digest: Buffer; menu_item_id: string }>`
        SELECT request_digest, menu_item_id FROM ba_anh_em.menu_write_keys
        WHERE venue_id = ${venueId} AND staff_user_id = ${staffId} AND operation = ${operation} AND request_key = ${requestKey}
      `.execute(transaction);
      if (existing) {
        if (!existing.request_digest.equals(digest))
          throw new ConflictException();
        const {
          rows: [row],
        } = await sql<OpsMenuRow>`
          SELECT ${fields}, version FROM ba_anh_em.menu_items
          WHERE venue_id = ${venueId} AND id = ${existing.menu_item_id}
        `.execute(transaction);
        if (!row) throw new NotFoundException();
        return { row, applied: false };
      }

      const row = target
        ? await this.update(transaction, venueId, item, target)
        : await this.create(transaction, venueId, item);
      await sql`
        INSERT INTO ba_anh_em.menu_write_keys (venue_id, staff_user_id, operation, request_key, request_digest, menu_item_id)
        VALUES (${venueId}, ${staffId}, ${operation}, ${requestKey}, ${digest}, ${row.id})
      `.execute(transaction);
      return { row, applied: true };
    });
    if (result.applied)
      this.logger.log({
        event: `menu.${operation}`,
        venueId,
        staffUserId: staffId,
        dishId: result.row.public_key,
        version: result.row.version,
      });
    return opsDish(result.row);
  }

  private async create(db: Kysely<object>, venueId: string, item: MenuItemDto) {
    if (!item.description) throw new UnprocessableEntityException();
    const {
      rows: [row],
    } = await sql<MenuMutationRow>`
      INSERT INTO ba_anh_em.menu_items (venue_id, public_key, name, category, price_vnd, description, available, published, display_order)
      VALUES (${venueId}, ${`mon-${randomUUID()}`}, ${item.name}, ${item.category}, ${item.price}, ${item.description}, ${item.available}, ${item.published}, 2147483647)
      RETURNING id, ${fields}, version
    `.execute(db);
    if (!row) throw new Error('Menu insert returned no row');
    return row;
  }

  private async update(
    db: Kysely<object>,
    venueId: string,
    item: MenuItemDto,
    target: MenuTarget,
  ) {
    const {
      rows: [row],
    } = await sql<MenuMutationRow>`
      UPDATE ba_anh_em.menu_items
      SET name = ${item.name}, category = ${item.category}, price_vnd = ${item.price},
          description = ${item.description}, available = ${item.available}, published = ${item.published},
          version = version + 1, updated_at = now()
      WHERE venue_id = ${venueId} AND public_key = ${target.dishId} AND version = ${target.expectedVersion}
        AND version < ${MAX_VERSION} AND (description = '' OR ${item.description} <> '')
      RETURNING id, ${fields}, version
    `.execute(db);
    if (row) return row;
    const {
      rows: [current],
    } = await sql<{ version: number }>`
      SELECT version FROM ba_anh_em.menu_items WHERE venue_id = ${venueId} AND public_key = ${target.dishId}
    `.execute(db);
    if (!current) throw new NotFoundException();
    if (
      current.version !== target.expectedVersion ||
      current.version === MAX_VERSION
    ) {
      throw new ApiException(
        {
          code: 'MENU_VERSION_CONFLICT',
          message: 'Món đã thay đổi. Kiểm tra phiên bản mới trước khi lưu.',
        },
        409,
      );
    }
    throw new ApiException(
      {
        code: 'VALIDATION_FAILED',
        message: 'Vui lòng giữ mô tả của món.',
        fields: { 'item.description': ['Cần nhập mô tả.'] },
      },
      422,
    );
  }
}
