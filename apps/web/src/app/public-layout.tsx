import { useRef, useState } from 'react';
import { CalendarDays, ChevronDown, Flame, Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { ChatWidget } from '../features/chat/chat';
import { useRestaurant } from './restaurant-context';

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Nhà hàng Ba Anh Em, trang chủ">
      <span className="brand-icon">
        <Flame size={22} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="brand-copy">
        <span className="brand-name">Ba Anh Em</span>
        <span className="brand-caption">Nhà hàng món Việt</span>
      </span>
    </Link>
  );
}

const primaryLinks = [
  ['/', 'Trang chủ'],
  ['/thuc-don', 'Thực đơn'],
];
const extraLinks = [
  ['/tra-cuu-dat-cho', 'Tra cứu đặt chỗ'],
  ['/dat-tiec', 'Đặt tiệc'],
  ['/danh-gia', 'Đánh giá'],
];

function ExtraNavigation() {
  const { setExpanded } = useRestaurant();

  return (
    <details
      className="extra-nav"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          event.currentTarget.open = false;
      }}
      onKeyDown={(event) => {
        const details = event.currentTarget;
        if (event.key !== 'Escape' || !details.open) return;
        event.preventDefault();
        event.stopPropagation();
        details.open = false;
        details.querySelector('summary')?.focus();
      }}
    >
      <summary onClick={() => setExpanded(true)}>
        Mở rộng <ChevronDown size={14} aria-hidden="true" />
      </summary>
      <div>
        {extraLinks.map(([to, label]) => (
          <NavLink
            key={to}
            to={to ?? '/'}
            onClick={(event) =>
              event.currentTarget.closest('details')?.removeAttribute('open')
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </details>
  );
}

export function PublicLayout() {
  const { key } = useLocation();
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const open = menuAt === key;

  return (
    <div className="public-shell">
      <a href="#prototype-content" className="skip-link">
        Đến nội dung chính
      </a>
      <header className="public-header">
        <div className="container header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Điều hướng chính">
            {primaryLinks.map(([to, label]) => (
              <NavLink key={to} to={to ?? '/'} end>
                {label}
              </NavLink>
            ))}
            <ExtraNavigation />
          </nav>
          <div className="header-actions">
            <Link to="/dat-ban" className="button header-book">
              <CalendarDays size={17} /> Đặt bàn
            </Link>
            <button
              ref={menuButton}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Đóng điều hướng' : 'Mở điều hướng'}
              className="icon-button menu-toggle"
              onClick={() => setMenuAt(open ? null : key)}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {open && (
            <nav
              id="mobile-nav"
              className="mobile-nav"
              aria-label="Điều hướng di động"
              onKeyDown={(event) => {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                setMenuAt(null);
                menuButton.current?.focus();
              }}
            >
              {primaryLinks.map(([to, label]) => (
                <NavLink key={to} to={to ?? '/'} end>
                  {label}
                </NavLink>
              ))}
              <ExtraNavigation />
            </nav>
          )}
        </div>
      </header>
      <main id="prototype-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <Brand />
          <nav aria-label="Liên kết cuối trang">
            <Link to="/thuc-don">Thực đơn</Link>
            <Link to="/dat-ban">Đặt bàn</Link>
            <Link to="/van-hanh">Khu vực nhân viên</Link>
          </nav>
        </div>
      </footer>
      <ChatWidget />
    </div>
  );
}
