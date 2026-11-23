import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { useRestaurant } from '../../app/restaurant-context';
import { MAX_DISH_QUANTITY, money, type Dish } from '../../shared/model';
import { TemporaryBill } from '../preorder/temporary-bill';
import { Badge, DishImage, Empty, Modal } from '../../shared/ui';
import './catalog.css';

function fold(value: string) {
  return value
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd');
}

export function DishCard({
  dish,
  link,
  showCategory = true,
}: {
  dish: Dish;
  link: string;
  showCategory?: boolean;
}) {
  const { draftQuantities, changeDraftQuantity } = useRestaurant();
  const addDisabled = (draftQuantities[dish.id] ?? 0) >= MAX_DISH_QUANTITY;

  return (
    <article className="dish-card">
      <Link
        to={link}
        className="dish-card-link"
        aria-label={`Xem ${dish.name}`}
      >
        <DishImage dish={dish} />
        <div className="dish-body">
          {showCategory && <div className="dish-caption">{dish.category}</div>}
          <h3>{dish.name}</h3>
          <div className="dish-meta">
            <strong>{money(dish.price)}</strong>
            {!dish.available && <Badge tone="warning">Hết món</Badge>}
          </div>
        </div>
      </Link>
      {dish.available && (
        <button
          type="button"
          className="icon-button dish-add"
          aria-label={`Thêm ${dish.name}`}
          title={
            addDisabled ? `Tối đa ${MAX_DISH_QUANTITY} phần mỗi món` : undefined
          }
          disabled={addDisabled}
          onClick={() => changeDraftQuantity(dish.id, 1)}
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      )}
    </article>
  );
}

export function DishDetails({
  dish,
  close,
  action,
}: {
  dish: Dish;
  close: () => void;
  action?: React.ReactNode;
}) {
  return (
    <Modal className="dish-detail-dialog" title={dish.name} onClose={close}>
      <DishImage dish={dish} className="dish-detail-image" />
      <div className="dish-detail-meta row">
        <strong>{money(dish.price)}</strong>
        <Badge tone={dish.available ? 'success' : 'warning'}>
          {dish.available ? 'Có thể đặt trước' : 'Tạm hết'}
        </Badge>
      </div>
      {dish.description && <p>{dish.description}</p>}
      {action}
    </Modal>
  );
}

function CatalogCategories({
  categories,
  selected,
  onSelect,
}: {
  categories: string[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({
    overflow: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const rail = railRef.current;
    const strip = stripRef.current;
    const list = listRef.current;
    if (!rail || !strip || !list) return;

    const sync = () => {
      const overflow = list.scrollWidth > rail.clientWidth + 1;
      const left = overflow && strip.scrollLeft > 1;
      const right =
        overflow &&
        strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1;
      setEdges((current) =>
        current.overflow === overflow &&
        current.left === left &&
        current.right === right
          ? current
          : { overflow, left, right },
      );
    };

    sync();
    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(rail);
    resizeObserver.observe(strip);
    resizeObserver.observe(list);
    strip.addEventListener('scroll', sync, { passive: true });
    return () => {
      resizeObserver.disconnect();
      strip.removeEventListener('scroll', sync);
    };
  }, []);

  function scrollCategories(direction: -1 | 1) {
    const strip = stripRef.current;
    if (strip) strip.scrollBy({ left: direction * strip.clientWidth * 0.75 });
  }

  return (
    <div className="container catalog-category-rail" ref={railRef}>
      {edges.overflow && (
        <button
          type="button"
          className="icon-button catalog-category-arrow"
          aria-label="Xem nhóm món trước"
          disabled={!edges.left}
          onClick={() => scrollCategories(-1)}
        >
          <ChevronLeft size={19} aria-hidden="true" />
        </button>
      )}
      <div className="catalog-category-strip" ref={stripRef}>
        <div
          className="catalog-category-list"
          role="group"
          aria-label="Nhóm món"
          ref={listRef}
        >
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              className="catalog-category"
              aria-pressed={name === selected}
              onClick={() => onSelect(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      {edges.overflow && (
        <button
          type="button"
          className="icon-button catalog-category-arrow"
          aria-label="Xem nhóm món tiếp theo"
          disabled={!edges.right}
          onClick={() => scrollCategories(1)}
        >
          <ChevronRight size={19} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function Catalog() {
  const { dishes, scenario, setScenario } = useRestaurant();
  const [params, setParams] = useSearchParams();
  const [menuStatus, setMenuStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const categoryBar = useRef<HTMLDivElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const visibleDishes =
    scenario === 'empty' ? [] : dishes.filter((dish) => dish.published);
  const categories = [
    'Tất cả',
    ...new Set(visibleDishes.map((dish) => dish.category)),
  ];
  const searchText = fold(query.trim());
  const groups = new Map<string, Dish[]>();
  for (const dish of visibleDishes) {
    if (category !== 'Tất cả' && dish.category !== category) continue;
    if (!fold(dish.name).includes(searchText)) continue;
    const group = groups.get(dish.category);
    if (group) group.push(dish);
    else groups.set(dish.category, [dish]);
  }
  const selected =
    menuStatus === 'ready'
      ? visibleDishes.find((dish) => dish.id === params.get('mon'))
      : undefined;

  useEffect(() => {
    if (menuStatus !== 'loading') return;
    const timer = window.setTimeout(
      () => {
        setMenuStatus(scenario === 'menu-error' ? 'error' : 'ready');
      },
      scenario === 'menu-error' ? 360 : 160,
    );
    return () => window.clearTimeout(timer);
  }, [menuStatus, scenario]);

  function selectCategory(name: string) {
    setCategory(name);
    const bar = categoryBar.current;
    const resultList = results.current;
    if (
      bar &&
      resultList &&
      resultList.getBoundingClientRect().top <
        bar.getBoundingClientRect().bottom
    ) {
      resultList.scrollIntoView({ block: 'start' });
    }
  }

  return (
    <div className="catalog-page">
      <header className="catalog-intro">
        <div className="container catalog-intro-inner">
          <div>
            <h1>Thực đơn</h1>
            <p>Giá và tình trạng món dùng để thử đặt trước.</p>
          </div>
          <label className="catalog-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label="Tìm món"
              placeholder="Tìm món"
              value={query}
              disabled={menuStatus !== 'ready'}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
      </header>
      <div
        className="catalog-category-bar"
        ref={categoryBar}
        inert={menuStatus !== 'ready'}
      >
        <CatalogCategories
          categories={categories}
          selected={category}
          onSelect={selectCategory}
        />
      </div>
      <div
        className="container catalog-results"
        aria-busy={menuStatus === 'loading'}
        tabIndex={-1}
        ref={results}
      >
        {menuStatus === 'loading' ? (
          <section className="catalog-group" role="status">
            <h2>Đang tải thực đơn…</h2>
            <div className="dish-grid catalog-dishes" aria-hidden="true">
              {[0, 1, 2, 3].map((item) => (
                <div className="catalog-skeleton-card" key={item}>
                  <div className="dish-photo" />
                  <div className="dish-body catalog-skeleton-copy">
                    <span />
                    <span />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : menuStatus === 'error' ? (
          <Empty
            title="Chưa tải được thực đơn"
            description="Thử tải thực đơn lại."
            action={
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setScenario('normal');
                  setMenuStatus('loading');
                  results.current?.focus({ preventScroll: true });
                }}
              >
                Thử lại
              </button>
            }
          />
        ) : groups.size > 0 ? (
          [...groups].map(([name, group]) => (
            <section key={name} className="catalog-group" aria-label={name}>
              <h2>{name}</h2>
              <div className="dish-grid catalog-dishes">
                {group.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    link={`?mon=${dish.id}`}
                    showCategory={false}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <Empty
            title={
              visibleDishes.length
                ? 'Chưa có món phù hợp'
                : 'Thực đơn đang trống'
            }
            description={
              visibleDishes.length
                ? 'Thử tên món khác hoặc đổi nhóm món.'
                : 'Chọn «Xem tất cả món» để mở lại thực đơn mẫu.'
            }
            action={
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setQuery('');
                  selectCategory('Tất cả');
                  if (scenario === 'empty') setScenario('normal');
                }}
              >
                Xem tất cả món
              </button>
            }
          />
        )}
      </div>
      {selected && (
        <DishDetails
          dish={selected}
          close={() =>
            setParams(
              (current) => {
                const next = new URLSearchParams(current);
                next.delete('mon');
                return next;
              },
              { replace: true },
            )
          }
          action={
            selected.available && (
              <Link className="button" to="/dat-ban">
                Đặt bàn để chọn món
              </Link>
            )
          }
        />
      )}
      <TemporaryBill />
    </div>
  );
}
