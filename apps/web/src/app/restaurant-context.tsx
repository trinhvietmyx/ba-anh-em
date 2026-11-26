import {
  createContext,
  useCallback,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Role } from '../shared/access.ts';
import {
  BOOKINGS,
  DISHES,
  MAX_DISH_QUANTITY,
  SCENARIOS,
  type Booking,
  type BookingDraft,
  type Dish,
  type Scenario,
} from '../shared/model.ts';
import { createMockRestaurantApi } from '../services/mock-restaurant-api.ts';
import { menuApi, publishedMenuKey, menuUsesApi } from '../services/menu-api';

const menuQueryKey = ['restaurant', 'menu'] as const;
const reservationsQueryKey = ['restaurant', 'reservations'] as const;

interface RestaurantContextValue {
  bookings: Booking[];
  dishes: Dish[];
  menuStatus: 'loading' | 'ready' | 'error';
  retryMenu(): void;
  setDishes: Dispatch<SetStateAction<Dish[]>>;
  draftQuantities: Record<string, number>;
  setDraftQuantities: Dispatch<SetStateAction<Record<string, number>>>;
  changeDraftQuantity(dishId: string, delta: 1 | -1): void;
  role: Role;
  setRole: Dispatch<SetStateAction<Role>>;
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  scenario: Scenario;
  setScenario: Dispatch<SetStateAction<Scenario>>;
  activeBooking: Booking | undefined;
  setActiveId: Dispatch<SetStateAction<string | null>>;
  createBooking(draft: BookingDraft): Promise<Booking | null>;
  updateBooking(
    id: string,
    patch: Partial<Booking>,
    note?: string,
  ): Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [api] = useState(() => createMockRestaurantApi());
  const [draftQuantities, setDraftQuantities] = useState<
    Record<string, number>
  >({});
  const [role, setRole] = useState<Role>('customer');
  const [expanded, setExpanded] = useState(false);
  const [scenario, setScenario] = useState<Scenario>(() => {
    if (!import.meta.env.DEV) return 'normal';
    const requested = new URLSearchParams(window.location.search).get(
      'kich-ban',
    );
    return SCENARIOS.find((option) => option === requested) ?? 'normal';
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const menu = useQuery({
    queryKey: menuUsesApi ? publishedMenuKey : menuQueryKey,
    queryFn: ({ signal }) =>
      menuUsesApi ? menuApi.listPublished(signal) : api.getMenu(),
    initialData: menuUsesApi ? undefined : DISHES,
    staleTime: menuUsesApi ? 0 : Infinity,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: menuUsesApi,
  });
  const { refetch: refetchMenu } = menu;
  const retryMenu = useCallback(() => {
    void refetchMenu({ cancelRefetch: false });
  }, [refetchMenu]);
  const reservations = useQuery({
    queryKey: reservationsQueryKey,
    queryFn: () => api.getReservations(),
    initialData: BOOKINGS,
    staleTime: Infinity,
    refetchOnMount: 'always',
  });

  function setDishes(action: SetStateAction<Dish[]>) {
    if (menuUsesApi) return;
    const current = queryClient.getQueryData<Dish[]>(menuQueryKey) ?? DISHES;
    const next = typeof action === 'function' ? action(current) : action;
    queryClient.setQueryData(menuQueryKey, next);
    void api.replaceMenu(next).then((saved) => {
      queryClient.setQueryData(menuQueryKey, saved);
    });
  }

  function changeDraftQuantity(dishId: string, delta: 1 | -1) {
    if (
      delta > 0 &&
      ((!menuUsesApi && scenario === 'empty') ||
        !dishes.some(
          (dish) => dish.id === dishId && dish.published && dish.available,
        ))
    )
      return;

    setDraftQuantities((current) => {
      const quantity = Math.max(
        0,
        Math.min(MAX_DISH_QUANTITY, (current[dishId] ?? 0) + delta),
      );
      if (!quantity) {
        const next = { ...current };
        delete next[dishId];
        return next;
      }
      return { ...current, [dishId]: quantity };
    });
  }

  async function createBooking(draft: BookingDraft) {
    const booking = await api.createReservation(draft);
    if (booking) {
      await queryClient.invalidateQueries({ queryKey: reservationsQueryKey });
      setActiveId(booking.id);
    }
    return booking;
  }

  async function updateBooking(
    id: string,
    patch: Partial<Booking>,
    note?: string,
  ) {
    await api.updateReservation(id, patch, note);
    await queryClient.invalidateQueries({ queryKey: reservationsQueryKey });
  }

  const bookings = reservations.data ?? [];
  const menuLoading = menu.isPending || (menuUsesApi && menu.isFetching);
  const dishes = menu.isSuccess && !menuLoading ? menu.data : [];

  return (
    <RestaurantContext.Provider
      value={{
        bookings,
        dishes,
        menuStatus: menuLoading ? 'loading' : menu.isError ? 'error' : 'ready',
        retryMenu,
        setDishes,
        draftQuantities,
        setDraftQuantities,
        changeDraftQuantity,
        role,
        setRole,
        expanded,
        setExpanded,
        scenario,
        setScenario,
        activeBooking: bookings.find((booking) => booking.id === activeId),
        setActiveId,
        createBooking,
        updateBooking,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error('RestaurantProvider is required');
  return context;
}
