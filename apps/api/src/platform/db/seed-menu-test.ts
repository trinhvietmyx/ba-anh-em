import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sql, type Kysely } from 'kysely';

interface DemoDish {
  id: string;
  name: string;
  category: string;
  description: string;
  image?: string | number;
  price: number;
  available: boolean;
  published: boolean;
}

export async function seedMenuTest(db: Kysely<object>): Promise<number> {
  const fixture = pathToFileURL(
    resolve(__dirname, '../../../../web/src/mocks/fixtures.ts'),
  );
  const { DISHES: dishes } = (await import(fixture.href)) as {
    DISHES: DemoDish[];
  };

  return db.transaction().execute(async (transaction) => {
    const {
      rows: [venue],
    } = await sql<{ id: string }>`
      SELECT id FROM ba_anh_em.venues WHERE code = 'BAE-TEST-FIXTURE'
    `.execute(transaction);
    if (!venue) throw new Error('Missing foundation test venue');
    const values = dishes.map(
      (dish, index) => sql`(
      ${venue.id}, ${dish.id}, ${dish.name}, ${dish.category}, ${dish.description},
      ${typeof dish.image === 'string' ? dish.image : null}, ${dish.price},
      ${dish.available}, ${dish.published}, ${index}
    )`,
    );
    await sql`
      INSERT INTO ba_anh_em.menu_items (venue_id, public_key, name, category, description, image_url, price_vnd, available, published, display_order)
      VALUES ${sql.join(values)} ON CONFLICT (venue_id, public_key) DO NOTHING
    `.execute(transaction);
    return dishes.length;
  });
}
