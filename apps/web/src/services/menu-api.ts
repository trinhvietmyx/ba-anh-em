import type { operations } from '@ba-anh-em/api-contract';
import type { Dish } from '../shared/model';
import { createHttpClient } from './http-client';

type PublicMenu =
  operations['listPublishedMenu']['responses'][200]['content']['application/json'];
type AdminMenu =
  operations['listOpsMenu']['responses'][200]['content']['application/json'];
type SavedMenuItem =
  operations['createOpsMenuItem']['responses'][201]['content']['application/json'];
type StaffSession =
  operations['getStaffSession']['responses'][200]['content']['application/json'];
export type MenuDraft =
  operations['createOpsMenuItem']['requestBody']['content']['application/json'];

export interface EditableMenuItem {
  dish: Dish;
  version: number;
}

const api = createHttpClient();
export const menuUsesApi = import.meta.env.VITE_MENU_SOURCE === 'api';
export const publishedMenuKey = ['restaurant', 'published-menu'] as const;
export const opsMenuKey = ['restaurant', 'ops-menu'] as const;
export const menuStaffKey = ['restaurant', 'menu-staff-session'] as const;

function toDish(dish: SavedMenuItem['dish']): Dish {
  return { ...dish, image: dish.image ?? undefined };
}

export const menuApi = {
  async listPublished(signal?: AbortSignal) {
    const result = await api.request<PublicMenu>('/menu', { signal });
    return result.items.map(toDish);
  },
  async listForStaff(signal?: AbortSignal): Promise<EditableMenuItem[]> {
    const result = await api.request<AdminMenu>('/ops/menu', { signal });
    return result.items.map(({ dish, version }) => ({
      dish: toDish(dish),
      version,
    }));
  },
  session(signal?: AbortSignal) {
    return api.request<StaffSession>('/ops/session', { signal });
  },
  async save(
    item: MenuDraft,
    requestKey: string,
    csrfToken: string,
    target?: { id: string; version: number },
  ) {
    const response = await api.request<SavedMenuItem>(
      target ? `/ops/menu/${encodeURIComponent(target.id)}` : '/ops/menu',
      {
        method: target ? 'PUT' : 'POST',
        headers: { 'Idempotency-Key': requestKey, 'X-CSRF-Token': csrfToken },
        body: target ? { item, expectedVersion: target.version } : item,
      },
    );
    return toDish(response.dish);
  },
  logout(csrfToken: string) {
    return api.request<void>('/ops/session', {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    });
  },
};
