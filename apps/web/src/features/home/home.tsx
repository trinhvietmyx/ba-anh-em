import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router';
import { DishCard } from '../menu/catalog';
import { useRestaurant } from '../../app/restaurant-context';
import type { Dish } from '../../shared/model';
import { TemporaryBill } from '../preorder/temporary-bill';
import './home.css';

const featuredIds = [
  'ga-nuong-la-chanh',
  'lau-bo-sa-te',
  'goi-buoi-tom',
  'suon-nuong',
  'tom-nuong-muoi-ot',
  'ca-kho-to',
];

export function Home() {
  const { dishes, scenario } = useRestaurant();
  const featured =
    scenario === 'empty'
      ? []
      : featuredIds.flatMap((id) =>
          dishes.filter((dish) => dish.id === id && dish.published),
        );

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <img
          className="home-hero-photo"
          src="/images/hero-ban-mon-viet.webp"
          width={1536}
          height={1024}
          alt=""
          fetchPriority="high"
        />
        <div className="container home-hero-inner">
          <div className="home-hero-copy">
            <p>Nhà hàng món Việt</p>
            <h1 id="home-title">Ba Anh Em</h1>
            <div className="home-hero-actions">
              <Link className="button" to="/dat-ban">
                <CalendarDays size={18} aria-hidden="true" /> Đặt bàn
              </Link>
              <Link className="button secondary" to="/thuc-don">
                Xem thực đơn <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && <FeaturedDishes dishes={featured} />}

      <section className="home-booking" aria-labelledby="home-booking-heading">
        <div className="home-booking-copy">
          <h2 id="home-booking-heading">Đặt bàn trước khi đến</h2>
          <p>Chọn ngày, giờ và số khách. Bạn có thể chọn món trước.</p>
          <Link className="button" to="/dat-ban">
            <CalendarDays size={18} aria-hidden="true" /> Đặt bàn
          </Link>
        </div>
        <img
          className="home-booking-photo"
          src="/images/table.jpg"
          width={1448}
          height={1086}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </section>
      <TemporaryBill />
    </div>
  );
}

function FeaturedDishes({ dishes }: { dishes: Dish[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });
  const dishCount = dishes.length;

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const sync = () => {
      const previous = rail.scrollLeft > 1;
      const next = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1;
      setEdges((current) =>
        current.previous === previous && current.next === next
          ? current
          : { previous, next },
      );
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(rail);
    rail.addEventListener('scroll', sync, { passive: true });
    return () => {
      observer.disconnect();
      rail.removeEventListener('scroll', sync);
    };
  }, [dishCount]);

  function move(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail || !(direction === -1 ? edges.previous : edges.next)) return;
    rail.scrollBy({ left: direction * rail.clientWidth });
  }

  return (
    <section
      className="container home-featured"
      aria-labelledby="home-featured-heading"
    >
      <div className="home-featured-head">
        <h2 id="home-featured-heading">Món nổi bật</h2>
        <div
          className="home-featured-controls"
          role="group"
          aria-label="Điều hướng món nổi bật"
        >
          <button
            type="button"
            className="icon-button"
            aria-label="Xem món trước"
            aria-controls="home-featured-dishes"
            aria-disabled={!edges.previous}
            onClick={() => move(-1)}
          >
            <ChevronLeft size={21} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Xem món tiếp theo"
            aria-controls="home-featured-dishes"
            aria-disabled={!edges.next}
            onClick={() => move(1)}
          >
            <ChevronRight size={21} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="home-dish-rail" id="home-featured-dishes" ref={railRef}>
        {dishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            link={`/thuc-don?mon=${dish.id}`}
            showCategory={false}
          />
        ))}
      </div>
    </section>
  );
}
