import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  CookingPot,
  CreditCard,
  Flame,
  Grid2X2,
  List,
  Menu,
  Search,
  ShieldCheck,
  Sofa,
  Star,
  UsersRound,
  Utensils,
  X,
} from 'lucide-react';
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';
import {
  canAccessOperations,
  OPS_PATHS,
  ROLE_LABELS,
  type Role,
} from '../../shared/access';
import { useRestaurant } from '../../app/restaurant-context';
import {
  DEMO_DATE,
  DEPOSIT_AMOUNT,
  TABLES,
  TIMES,
  displayDate,
  isTableOccupied,
  money,
  type Booking,
} from '../../shared/model';
import {
  Badge,
  Empty,
  Modal,
  Notice,
  PageHead,
  Panel,
  Status,
} from '../../shared/ui';
import './operations.css';

const {
  signIn: SIGN_IN,
  bookings: BOOKINGS,
  floor: FLOOR,
  kitchen: KITCHEN,
  deposits: DEPOSITS,
  reports: REPORTS,
} = OPS_PATHS;

const roles = {
  employee: {
    label: 'Nhân viên',
    description: 'Quản lý đặt chỗ, phân bàn, món đặt trước và tiền cọc',
    icon: UsersRound,
  },
  admin: {
    label: 'Quản trị viên',
    description: 'Quản lý thực đơn, bàn và báo cáo',
    icon: ShieldCheck,
  },
};

type OperationsRole = Exclude<Role, 'customer'>;
const roleOptions: readonly OperationsRole[] = ['employee', 'admin'];
const nav = [
  { to: BOOKINGS, label: 'Đặt chỗ', icon: ClipboardList },
  { to: FLOOR, label: 'Sơ đồ bàn', icon: Grid2X2 },
  { to: KITCHEN, label: 'Chuẩn bị bếp', icon: CookingPot },
  { to: DEPOSITS, label: 'Đối chiếu cọc', icon: CreditCard },
  { to: REPORTS, label: 'Báo cáo', icon: ChartNoAxesColumn },
];

const expandedNav = [
  {
    to: OPS_PATHS.menu,
    label: 'Quản lý thực đơn',
    icon: Utensils,
  },
  {
    to: OPS_PATHS.events,
    label: 'Yêu cầu đặt tiệc',
    icon: CalendarDays,
  },
  {
    to: OPS_PATHS.reviews,
    label: 'Quản lý đánh giá',
    icon: Star,
  },
];

const bookingLabels: Record<Booking['status'], string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  arrived: 'Đã đến',
  completed: 'Đã phục vụ',
  'no-show': 'Không đến',
  cancelled: 'Đã hủy',
};

function OpsBrand() {
  return (
    <Link className="ops-brand" to="/">
      <span className="ops-brand-icon">
        <Flame size={22} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span>
        <strong>Ba Anh Em</strong>
        <small>Vận hành nhà hàng</small>
      </span>
    </Link>
  );
}

export function OpsSignIn() {
  const { role, setRole, scenario, setScenario } = useRestaurant();
  const location = useLocation();
  const navigate = useNavigate();
  const [selection, setSelection] = useState<OperationsRole>(
    role === 'customer' ? 'employee' : role,
  );
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const state = location.state as {
    returnTo?: string;
    expired?: boolean;
  } | null;
  const returnTo = typeof state?.returnTo === 'string' ? state.returnTo : '';
  const expired = state?.expired || scenario === 'ops-expired';
  const canReturn = canAccessOperations(selection, returnTo);

  useEffect(() => {
    if (!submitting) return;
    const timer = window.setTimeout(() => {
      setSubmitting(false);
      if (scenario === 'ops-auth-error' && !failed) {
        setFailed(true);
        return;
      }
      if (scenario === 'ops-auth-error' || scenario === 'ops-expired')
        setScenario('normal');
      setRole(selection);
      navigate(canReturn ? returnTo : BOOKINGS, { replace: true });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [
    canReturn,
    failed,
    navigate,
    returnTo,
    scenario,
    selection,
    setRole,
    setScenario,
    submitting,
  ]);

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
  }

  return (
    <main className="ops-sign-in">
      <div className="ops-sign-in-inner">
        <OpsBrand />
        <Panel className="ops-sign-in-panel">
          <PageHead
            title="Đăng nhập vận hành"
            description="Chọn vai trò để đăng nhập."
          />
          {expired && (
            <Notice tone="warning">
              Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
            </Notice>
          )}
          {failed && !submitting && (
            <Notice tone="danger">
              Không thể đăng nhập. Vui lòng thử lại.
            </Notice>
          )}
          <form className="ops-stack" onSubmit={signIn}>
            <fieldset className="ops-role-options" disabled={submitting}>
              <legend>Vai trò</legend>
              {roleOptions.map((option) => {
                const { description } = roles[option];
                return (
                  <label className="ops-role-option" key={option}>
                    <input
                      type="radio"
                      name="prototype-role"
                      value={option}
                      checked={selection === option}
                      onChange={() => setSelection(option)}
                      aria-labelledby={`role-${option}-label`}
                      aria-describedby={`role-${option}-description`}
                    />
                    <span>
                      <strong id={`role-${option}-label`}>
                        {roles[option].label}
                      </strong>
                      <small id={`role-${option}-description`}>
                        {description}
                      </small>
                    </span>
                  </label>
                );
              })}
            </fieldset>
            {returnTo && !canReturn && (
              <Notice tone="info">
                Vai trò này không có quyền xem trang đó. Sau khi đăng nhập, bạn
                sẽ vào danh sách đặt chỗ.
              </Notice>
            )}
            <p className="ops-sign-in-status" role="status">
              {submitting && 'Đang mở khu vực vận hành…'}
            </p>
            <button
              className="button ops-wide"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Đang xử lý…' : 'Đăng nhập'}
            </button>
          </form>
        </Panel>
        <Link className="text-link ops-sign-in-return" to="/">
          <ArrowLeft size={16} aria-hidden="true" /> Về trang chủ
        </Link>
      </div>
    </main>
  );
}

export function OpsLayout() {
  const { role, setRole, scenario, setScenario } = useRestaurant();
  const { pathname, search, hash, key } = useLocation();
  const navigate = useNavigate();
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  const menuOpen = menuAt === key;
  const returnTo = pathname + search + hash;

  useEffect(() => {
    main.current?.focus({ preventScroll: true });
  }, [pathname, role]);

  if (role === 'customer') {
    return <Navigate to={SIGN_IN} replace state={{ returnTo }} />;
  }

  const denied = !canAccessOperations(role, pathname);
  const links = nav.filter(({ to }) => canAccessOperations(role, to));
  const more = expandedNav.filter(({ to }) => canAccessOperations(role, to));
  const RoleIcon = roles[role].icon;

  function changeRole() {
    setRole('customer');
    navigate(SIGN_IN, { replace: true, state: { returnTo } });
  }

  return (
    <div className="ops-shell">
      <a className="skip-link" href="#ops-main">
        Đến nội dung chính
      </a>
      <aside
        className="ops-sidebar"
        data-open={menuOpen}
        aria-label="Khu vực vận hành"
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || !menuOpen) return;
          setMenuAt(null);
          menuButton.current?.focus();
        }}
      >
        <div className="ops-sidebar-head">
          <OpsBrand />
          <button
            ref={menuButton}
            type="button"
            className="ops-menu-button"
            aria-label={
              menuOpen ? 'Đóng điều hướng vận hành' : 'Mở điều hướng vận hành'
            }
            aria-expanded={menuOpen}
            aria-controls="ops-sidebar-nav"
            onClick={() => setMenuAt(menuOpen ? null : key)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        <div className="ops-sidebar-body" id="ops-sidebar-nav">
          <nav className="ops-nav" aria-label="Điều hướng vận hành">
            {links.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} onClick={() => setMenuAt(null)}>
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
            {more.length > 0 && (
              <div className="ops-nav-extra">
                {more.map(({ to, icon: Icon, label }) => (
                  <NavLink key={to} to={to} onClick={() => setMenuAt(null)}>
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </nav>
          <div className="ops-sidebar-session">
            <span className="ops-session-icon">
              <RoleIcon size={18} aria-hidden="true" />
            </span>
            <span>
              <strong>{roles[role].label}</strong>
              <button type="button" onClick={changeRole}>
                Đổi vai trò
              </button>
            </span>
          </div>
        </div>
      </aside>
      <main ref={main} className="ops-main" id="ops-main" tabIndex={-1}>
        <div className="ops-content">
          {denied ? (
            <OpsDenied />
          ) : scenario === 'ops-error' &&
            (nav.some(({ to }) => to === pathname) ||
              /^\/van-hanh\/dat-cho\/[^/]+\/?$/.test(pathname)) ? (
            <OpsReadRecovery
              key={pathname}
              title={
                nav.find(({ to }) => to === pathname)?.label ??
                'Chi tiết lượt đặt'
              }
              onRetry={() => {
                setScenario('normal');
                main.current?.focus({ preventScroll: true });
              }}
            />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}

function OpsDenied() {
  return (
    <Panel className="ops-detail-panel">
      <PageHead
        title="Không có quyền truy cập"
        description="Vai trò hiện tại chưa có quyền mở trang này."
      />
      <Link className="button ops-retry" to={BOOKINGS}>
        Về danh sách đặt chỗ <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </Panel>
  );
}

function OpsReadRecovery({
  title,
  onRetry,
}: {
  title: string;
  onRetry: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const status = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => {
      if (retrying) onRetry();
      else setLoading(false);
    }, 480);
    return () => window.clearTimeout(timer);
  }, [loading, retrying, onRetry]);

  useEffect(() => {
    if (!loading) status.current?.focus({ preventScroll: true });
  }, [loading]);

  return (
    <div className="ops-stack">
      <PageHead title={title} />
      {loading ? (
        <section className="ops-table-panel ops-skeleton">
          <p role="status">Đang tải dữ liệu vận hành…</p>
          {Array.from({ length: 4 }, (_, index) => (
            <div className="ops-skeleton-row" key={index} aria-hidden="true" />
          ))}
        </section>
      ) : (
        <Panel className="ops-detail-panel">
          <div ref={status} tabIndex={-1}>
            <Notice tone="danger">
              Chưa tải được dữ liệu. Thử lại để tiếp tục với bộ lọc hiện tại.
            </Notice>
          </div>
          <button
            className="button secondary ops-retry"
            type="button"
            onClick={() => {
              setRetrying(true);
              setLoading(true);
            }}
          >
            Thử lại
          </button>
        </Panel>
      )}
    </div>
  );
}

function DateField({
  value,
  onChange,
  label = 'Ngày dùng bữa',
  error,
  errorId,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  errorId?: string;
}) {
  const labelId = useId();
  return (
    <label className="field ops-field">
      <span id={labelId}>{label}</span>
      <input
        className="input"
        type="date"
        value={value}
        aria-labelledby={labelId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <span className="ops-field-error" id={errorId}>
          {error}
        </span>
      )}
    </label>
  );
}

function TimeField({
  value,
  onChange,
  all,
}: {
  value: string;
  onChange: (value: string) => void;
  all?: boolean;
}) {
  return (
    <label className="field ops-field">
      <span>Khung giờ</span>
      <select
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {all && <option value="">Tất cả khung giờ</option>}
        {TIMES.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryFields({ fields }: { fields: [string, ReactNode][] }) {
  return (
    <dl className="ops-summary-fields">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function sectionDay(date: string) {
  return date ? displayDate(date) : 'Chưa chọn ngày';
}

function validDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith('0000'))
    return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(date)
  );
}

function reference(booking: Booking) {
  return booking.tables.length ? booking.tables.join(', ') : 'Chưa phân bàn';
}

function sourceName(source: Booking['source']) {
  return source === 'chat' ? 'Trợ lý AI' : 'Website';
}

function useOpsBookings() {
  const { bookings, scenario } = useRestaurant();
  return scenario === 'empty' ? [] : bookings;
}

function audit(text: string, role: Role) {
  const stamp = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date());
  return `${text} · ${ROLE_LABELS[role]} · ${stamp}`;
}

function isActive(booking: Booking) {
  return (
    booking.status === 'pending' ||
    booking.status === 'confirmed' ||
    booking.status === 'arrived'
  );
}

function isLateDeposit(booking: Booking) {
  return (
    booking.deposit === 'expired' ||
    booking.history.some((entry) =>
      /(?:tiền|cọc).*?(?:đến trễ|đến sau hạn|\(sau hạn\)|quá hạn giữ bàn)/i.test(
        entry,
      ),
    )
  );
}

export function OpsList() {
  const bookings = useOpsBookings();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const dateParam = params.get('date') ?? DEMO_DATE;
  const date = validDate(dateParam) ? dateParam : '';
  const rawTime = params.get('time') ?? '';
  const time = TIMES.includes(rawTime) ? rawTime : '';
  const query = params.get('q') ?? '';
  const rawStatus = params.get('status') ?? '';
  const status = Object.hasOwn(bookingLabels, rawStatus) ? rawStatus : '';
  const list = bookings
    .filter(
      (booking) =>
        (query.trim()
          ? booking.id.toLowerCase().includes(query.trim().toLowerCase())
          : booking.date === date) &&
        (!time || booking.time === time) &&
        (!status || booking.status === status),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.time.localeCompare(b.time) ||
        a.id.localeCompare(b.id),
    );
  const filtered = Boolean(query || time || status || date !== DEMO_DATE);

  function setFilter(filter: string, value: string) {
    const next = new URLSearchParams(params);
    if (value || filter === 'date') next.set(filter, value);
    else next.delete(filter);
    setParams(next, { replace: true });
  }

  function reset() {
    setParams({}, { replace: true });
  }

  return (
    <div className="ops-stack">
      <PageHead
        title="Đặt chỗ"
        description="Tìm theo mã hoặc lọc theo ngày, giờ và trạng thái."
        action={
          <Link
            className="button secondary"
            to={`${FLOOR}?date=${encodeURIComponent(date)}${time ? `&time=${time}` : ''}`}
          >
            <Grid2X2 size={17} aria-hidden="true" /> Sơ đồ bàn
          </Link>
        }
      />
      <div
        className="ops-filters ops-filters-bookings"
        role="group"
        aria-label="Bộ lọc đặt chỗ"
      >
        <DateField
          value={date}
          onChange={(value) => setFilter('date', value)}
        />
        <TimeField
          all
          value={time}
          onChange={(value) => setFilter('time', value)}
        />
        <label className="field ops-field">
          <span>Trạng thái</span>
          <select
            className="input"
            value={status}
            onChange={(event) => setFilter('status', event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(bookingLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field ops-field">
          <span>Tìm theo mã</span>
          <span className="ops-search">
            <Search size={17} aria-hidden="true" />
            <input
              className="input"
              type="search"
              placeholder="Nhập mã lượt đặt"
              value={query}
              onChange={(event) => setFilter('q', event.target.value)}
            />
          </span>
        </label>
        <button
          className="button tertiary ops-filter-reset"
          type="button"
          onClick={reset}
          disabled={!filtered}
        >
          Đặt lại
        </button>
      </div>
      <section className="ops-table-panel" aria-labelledby="ops-bookings-title">
        <div className="ops-results-head">
          <h2 id="ops-bookings-title">
            {query.trim() ? 'Kết quả tìm theo mã' : sectionDay(date)}
          </h2>
          <span role="status">{list.length} lượt đặt</span>
        </div>
        {list.length === 0 ? (
          <Empty
            title="Không tìm thấy lượt đặt"
            description="Đổi bộ lọc hoặc kiểm tra lại mã đặt chỗ."
            action={
              filtered && (
                <button
                  className="button secondary"
                  type="button"
                  onClick={reset}
                >
                  Đặt lại bộ lọc
                </button>
              )
            }
          />
        ) : (
          <table className="ops-table ops-responsive-table">
            <thead>
              <tr>
                <th scope="col">Mã lượt</th>
                <th scope="col">Dùng bữa</th>
                <th scope="col">Số khách</th>
                <th scope="col">Đặt chỗ</th>
                <th scope="col">Kênh</th>
                <th scope="col">Bố trí</th>
              </tr>
            </thead>
            <tbody>
              {list.map((booking) => (
                <tr key={booking.id}>
                  <th scope="row">
                    <Link
                      className="ops-table-link"
                      to={`${BOOKINGS}/${encodeURIComponent(booking.id)}`}
                      state={{ listSearch: location.search }}
                    >
                      {booking.id}
                      <ChevronRight size={15} aria-hidden="true" />
                    </Link>
                  </th>
                  <td data-label="Dùng bữa">
                    <span className="ops-time">{booking.time}</span>
                    {query.trim() && <small>{sectionDay(booking.date)}</small>}
                  </td>
                  <td data-label="Số khách">{booking.guests} khách</td>
                  <td data-label="Đặt chỗ">
                    <Status value={booking.status} kind="booking" />
                  </td>
                  <td data-label="Kênh">{sourceName(booking.source)}</td>
                  <td data-label="Bố trí">{reference(booking)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

type ServiceStatus = 'confirmed' | 'arrived' | 'completed' | 'no-show';

const serviceActions: Record<
  ServiceStatus,
  { title: string; description: string }
> = {
  confirmed: {
    title: 'Xác nhận lượt đặt',
    description: 'Xác nhận lượt đặt với bàn đã phân và cọc đã xác minh.',
  },
  arrived: {
    title: 'Ghi nhận khách đến',
    description: 'Đánh dấu khách đã đến.',
  },
  completed: {
    title: 'Ghi nhận đã phục vụ',
    description: 'Đánh dấu đã phục vụ và kết thúc lượt đặt.',
  },
  'no-show': {
    title: 'Ghi nhận khách không đến',
    description:
      'Ghi nhận khách không đến, mở lại bàn và tiếp tục đối chiếu tiền cọc.',
  },
};

function allowedServiceActions(booking: Booking) {
  const actions: ServiceStatus[] = [];
  if (
    booking.status === 'pending' &&
    booking.tables.length &&
    booking.deposit === 'verified'
  )
    actions.push('confirmed');
  if (booking.status === 'confirmed') actions.push('arrived', 'no-show');
  if (booking.status === 'arrived') actions.push('completed');
  return actions;
}

export function OpsDetail() {
  const { id } = useParams();
  const bookings = useOpsBookings();
  const { dishes, role, updateBooking } = useRestaurant();
  const location = useLocation();
  const navigationState = location.state as { listSearch?: string } | null;
  const listSearch = navigationState?.listSearch?.startsWith('?')
    ? navigationState.listSearch
    : '';
  const backLink = (
    <Link className="button tertiary ops-back" to={BOOKINGS + listSearch}>
      <ArrowLeft size={16} aria-hidden="true" /> Danh sách đặt chỗ
    </Link>
  );
  const [decision, setDecision] = useState<{
    id: string;
    status: ServiceStatus;
    version: number;
  } | null>(null);
  const [confirmedCondition, setConfirmedCondition] = useState(false);
  const [feedback, setFeedback] = useState<{
    id: string;
    text: string;
    warning?: boolean;
  } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const booking = bookings.find((item) => item.id === id);

  useEffect(() => {
    if (feedback?.id === id) resultRef.current?.focus();
  }, [feedback, id]);

  if (!booking)
    return (
      <div className="ops-stack">
        {backLink}
        <Panel>
          <Empty
            title="Không tìm thấy lượt đặt"
            description="Kiểm tra mã hoặc mở lượt đặt từ danh sách."
          />
        </Panel>
      </div>
    );

  const statusActions = allowedServiceActions(booking);
  const currentDecision = decision?.id === id ? decision : null;
  const currentFeedback = feedback?.id === id ? feedback : null;

  function begin(status: ServiceStatus) {
    if (!booking) return;
    setDecision({ id: booking.id, status, version: booking.history.length });
    setConfirmedCondition(false);
  }

  function save() {
    if (!booking || !currentDecision) return;
    const { status, version } = currentDecision;
    setDecision(null);
    if (
      version !== booking.history.length ||
      !allowedServiceActions(booking).includes(status)
    ) {
      setFeedback({
        id: booking.id,
        text: 'Lượt đặt vừa thay đổi. Kiểm tra lại trước khi lưu.',
        warning: true,
      });
      return;
    }
    if (status === 'no-show' && !confirmedCondition) return;
    updateBooking(
      booking.id,
      { status },
      audit(serviceActions[status].title, role),
    );
    setFeedback({
      id: booking.id,
      text: `Đã lưu kết quả: ${bookingLabels[status].toLowerCase()}.`,
    });
  }

  return (
    <div className="ops-stack">
      {backLink}
      <PageHead
        title={booking.id}
        description={`${sectionDay(booking.date)} · ${booking.time} · ${booking.guests} khách`}
        action={<Status value={booking.status} kind="booking" />}
      />
      {currentFeedback && (
        <div tabIndex={-1} ref={resultRef}>
          <Notice tone={currentFeedback.warning ? 'warning' : 'success'}>
            {currentFeedback.text}
          </Notice>
        </div>
      )}
      <div className="ops-detail-grid">
        <div className="ops-detail-aside ops-stack">
          <Panel className="ops-detail-panel ops-action-panel">
            <h2>Kết quả phục vụ</h2>
            {statusActions.length ? (
              statusActions.map((status, index) => (
                <button
                  className={`button ops-wide${index ? ' secondary' : ''}`}
                  key={status}
                  type="button"
                  onClick={() => begin(status)}
                >
                  {serviceActions[status].title}
                </button>
              ))
            ) : (
              <p className="ops-muted">
                {booking.status === 'pending'
                  ? 'Phân bàn và xác minh cọc trước khi xác nhận.'
                  : 'Đã ghi nhận kết quả phục vụ.'}
              </p>
            )}
            {role === 'admin' && (
              <Link
                className="ops-inline-link"
                to={`${BOOKINGS}/${encodeURIComponent(booking.id)}/doi-huy`}
              >
                Xử lý yêu cầu đổi/hủy{' '}
                <ChevronRight size={15} aria-hidden="true" />
              </Link>
            )}
          </Panel>
          <Panel className="ops-detail-panel">
            <div className="ops-panel-heading">
              <h2>Bố trí bàn</h2>
              <Sofa size={19} aria-hidden="true" />
            </div>
            <p className="ops-data-strong">{reference(booking)}</p>
            {isActive(booking) ? (
              <Link
                className="ops-inline-link"
                to={`${FLOOR}?${new URLSearchParams({ id: booking.id, date: booking.date, time: booking.time })}`}
              >
                Mở sơ đồ phân bàn <ChevronRight size={15} aria-hidden="true" />
              </Link>
            ) : (
              <p className="ops-muted">Lượt đã kết thúc.</p>
            )}
          </Panel>
          <Panel className="ops-detail-panel">
            <div className="ops-panel-heading">
              <h2>Tiền cọc</h2>
              <CreditCard size={19} aria-hidden="true" />
            </div>
            <p className="ops-data-strong">{money(DEPOSIT_AMOUNT)}</p>
            <Status value={booking.deposit} kind="deposit" />
            <Link
              className="ops-inline-link"
              to={`${DEPOSITS}?id=${encodeURIComponent(booking.id)}`}
            >
              Mở đối chiếu cọc <ChevronRight size={15} aria-hidden="true" />
            </Link>
          </Panel>
        </div>
        <div className="ops-detail-main ops-stack">
          <Panel className="ops-detail-panel">
            <h2>Thông tin lượt đặt</h2>
            <SummaryFields
              fields={[
                ['Khách đặt', booking.name],
                ['Liên hệ', booking.phone],
                ['Ngày dùng bữa', sectionDay(booking.date)],
                ['Khung giờ', booking.time],
                ['Số khách', `${booking.guests} khách`],
                ['Kênh đặt', sourceName(booking.source)],
              ]}
            />
            {booking.note && (
              <p className="ops-booking-note">
                <strong>Ghi chú</strong>
                <span>{booking.note}</span>
              </p>
            )}
          </Panel>
          <Panel className="ops-detail-panel">
            <div className="ops-panel-heading">
              <h2>Món đặt trước</h2>
              <Link
                className="ops-inline-link"
                to={`${KITCHEN}?date=${booking.date}&time=${booking.time}`}
              >
                Mở chuẩn bị bếp <ChevronRight size={15} aria-hidden="true" />
              </Link>
            </div>
            {booking.kitchenChanged && (
              <Notice tone="warning">
                Món đặt trước đã thay đổi sau khi chốt.
              </Notice>
            )}
            {booking.items.length ? (
              <ul className="ops-line-list">
                {booking.items.map(({ dishId, quantity }) => (
                  <li key={dishId}>
                    <span>
                      {dishes.find((dish) => dish.id === dishId)?.name ??
                        dishId}
                    </span>
                    <strong>× {quantity}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ops-muted">Chưa có món đặt trước.</p>
            )}
          </Panel>
          {role === 'admin' && (
            <Panel className="ops-detail-panel">
              <h2>Lịch sử cập nhật</h2>
              {booking.history.length ? (
                <ol className="ops-history">
                  {booking.history.map((entry, index) => (
                    <li key={`${index}-${entry}`}>{entry}</li>
                  ))}
                </ol>
              ) : (
                <p className="ops-muted">Chưa có cập nhật.</p>
              )}
            </Panel>
          )}
        </div>
      </div>
      {currentDecision && (
        <Modal
          title={serviceActions[currentDecision.status].title}
          onClose={() => setDecision(null)}
        >
          <div className="ops-stack">
            <p>
              {booking.id} · {booking.time} · {booking.guests} khách
            </p>
            <p>{serviceActions[currentDecision.status].description}</p>
            {currentDecision.status === 'no-show' && (
              <label className="ops-check">
                <input
                  type="checkbox"
                  checked={confirmedCondition}
                  onChange={(event) =>
                    setConfirmedCondition(event.target.checked)
                  }
                />
                <span>Đã hết giờ giữ bàn và khách vẫn chưa đến.</span>
              </label>
            )}
            <div className="ops-dialog-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setDecision(null)}
              >
                Quay lại
              </button>
              <button
                className="button"
                type="button"
                disabled={
                  currentDecision.status === 'no-show' && !confirmedCondition
                }
                onClick={save}
              >
                Xác nhận kết quả
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function OpsFloor() {
  const bookings = useOpsBookings();
  const [params, setParams] = useSearchParams();
  const requested = bookings.find((booking) => booking.id === params.get('id'));
  const defaultTime =
    TIMES.find((time) => time === '18:00') ?? TIMES[0] ?? '18:00';
  const dateParam = params.get('date') ?? requested?.date ?? DEMO_DATE;
  const date = validDate(dateParam) ? dateParam : '';
  const timeParam = params.get('time') ?? requested?.time ?? '';
  const time = TIMES.includes(timeParam) ? timeParam : defaultTime;
  const areas = [...new Set(TABLES.map(({ area }) => area))];
  const [area, setArea] = useState('');
  const [view, setView] = useState<'map' | 'list' | null>(null);
  const [wide, setWide] = useState(
    () => window.matchMedia('(min-width: 1280px)').matches,
  );
  const shownView = view ?? (wide ? 'map' : 'list');
  const candidates = bookings.filter(
    (booking) =>
      booking.date === date && booking.time === time && isActive(booking),
  );
  const selected = params.has('id')
    ? candidates.find((booking) => booking.id === params.get('id'))
    : candidates[0];

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1280px)');
    const update = () => setWide(desktop.matches);
    desktop.addEventListener('change', update);
    return () => desktop.removeEventListener('change', update);
  }, []);

  function shift(nextDate: string, nextTime: string) {
    setParams({ date: nextDate, time: nextTime }, { replace: true });
  }

  function selectBooking(id: string) {
    setParams({ date, time, id }, { replace: true });
  }

  return (
    <div className="ops-stack">
      <PageHead
        title="Sơ đồ bàn"
        description="Chọn ngày và giờ để xem bàn trống hoặc phân bàn."
      />
      <div className="ops-filters" role="group" aria-label="Bộ lọc sơ đồ bàn">
        <DateField value={date} onChange={(value) => shift(value, time)} />
        <TimeField value={time} onChange={(value) => shift(date, value)} />
        <label className="field ops-field">
          <span>Khu vực</span>
          <select
            className="input"
            value={area}
            onChange={(event) => setArea(event.target.value)}
          >
            <option value="">Tất cả khu vực</option>
            {areas.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        {candidates.length > 0 && (
          <label className="field ops-field">
            <span>Lượt đặt</span>
            <select
              className="input"
              value={selected?.id ?? ''}
              onChange={(event) => selectBooking(event.target.value)}
            >
              <option value="">Chọn lượt đặt</option>
              {candidates.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.id} · {item.guests} khách
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {requested && !isActive(requested) && (
        <Notice tone="warning">
          Lượt {requested.id} đã kết thúc. Chọn lượt còn hiệu lực để phân bàn.
        </Notice>
      )}
      {!date ? (
        <Panel>
          <Empty
            title="Chọn ngày để xem bàn"
            description="Chọn thêm khung giờ nếu cần."
          />
        </Panel>
      ) : (
        <FloorWorkspace
          key={`${date}-${time}-${selected?.id ?? ''}`}
          booking={selected}
          date={date}
          time={time}
          area={area}
          view={shownView}
          setView={setView}
          hasCandidates={candidates.length > 0}
        />
      )}
    </div>
  );
}

function FloorWorkspace({
  booking,
  date,
  time,
  area,
  view,
  setView,
  hasCandidates,
}: {
  booking?: Booking;
  date: string;
  time: string;
  area: string;
  view: 'map' | 'list';
  setView: (value: 'map' | 'list') => void;
  hasCandidates: boolean;
}) {
  const bookings = useOpsBookings();
  const { updateBooking, role } = useRestaurant();
  const [draft, setDraft] = useState<string[] | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [inspected, setInspected] = useState('');
  const [feedback, setFeedback] = useState<{
    text: string;
    warning?: boolean;
  } | null>(null);
  const proposal = draft ?? booking?.tables ?? [];
  const changed =
    proposal.length !== (booking?.tables.length ?? 0) ||
    proposal.some((id) => !booking?.tables.includes(id));
  const capacity = TABLES.filter((table) => proposal.includes(table.id)).reduce(
    (total, { seats }) => total + seats,
    0,
  );
  const areas = [
    ...new Set(
      TABLES.filter((table) => !area || table.area === area).map(
        (table) => table.area,
      ),
    ),
  ];
  const inspectedTable = TABLES.find((table) => table.id === inspected);

  function occupying(id: string) {
    return bookings.find((item) =>
      isTableOccupied([item], id, date, time, booking?.id),
    );
  }

  function selectTable(id: string) {
    if (!booking) {
      setInspected(id);
      return;
    }
    if (!draft) setVersion(booking.history.length);
    setDraft(
      proposal.includes(id)
        ? proposal.filter((item) => item !== id)
        : [...proposal, id],
    );
    setFeedback(null);
  }

  function resetDraft() {
    setDraft(null);
    setVersion(null);
    setFeedback(null);
  }

  function save() {
    if (!booking || !changed) return;
    const conflict = proposal.filter((id) =>
      isTableOccupied(bookings, id, date, time, booking.id),
    );
    if (!isActive(booking) || version !== booking.history.length) {
      setDraft(null);
      setVersion(null);
      setFeedback({
        text: 'Lượt đặt vừa thay đổi. Kiểm tra bàn đã phân rồi chọn lại.',
        warning: true,
      });
    } else if (conflict.length) {
      setFeedback({
        text: `Bàn ${conflict.join(', ')} đã có lượt khác trong khung này. Chọn bàn khác.`,
        warning: true,
      });
    } else if (capacity < booking.guests) {
      setFeedback({
        text: `Phương án có ${capacity} chỗ cho ${booking.guests} khách. Chọn thêm bàn.`,
        warning: true,
      });
    } else {
      const tables = TABLES.filter((table) => proposal.includes(table.id)).map(
        (table) => table.id,
      );
      updateBooking(
        booking.id,
        { tables },
        audit(`Phân bàn ${tables.join(', ')}`, role),
      );
      setDraft(null);
      setVersion(null);
      setFeedback({ text: `Đã lưu ${tables.join(', ')} cho ${booking.id}.` });
    }
  }

  return (
    <div className="ops-floor-grid">
      <Panel className="ops-floor-board">
        <div className="ops-panel-heading ops-floor-title">
          <div>
            <h2>Bàn trong khung {time}</h2>
            <p className="ops-muted">{sectionDay(date)}</p>
          </div>
          <div
            className="ops-view-switch"
            role="group"
            aria-label="Cách xem bàn"
          >
            <button
              type="button"
              aria-pressed={view === 'map'}
              onClick={() => setView('map')}
            >
              <Grid2X2 size={17} aria-hidden="true" /> Sơ đồ
            </button>
            <button
              type="button"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              <List size={17} aria-hidden="true" /> Danh sách
            </button>
          </div>
        </div>
        <ul className="ops-floor-legend" aria-label="Trạng thái bàn">
          <li data-tone="free">Còn trống</li>
          <li data-tone="held">Đã giữ</li>
          <li data-tone="busy">Đã đặt</li>
          <li data-tone="current">Bàn đã phân</li>
        </ul>
        {booking && (
          <div className="ops-floor-jump">
            <span role="status">
              {proposal.length} bàn · {capacity} chỗ / {booking.guests} khách
            </span>
            <a className="ops-inline-link" href="#ops-floor-editor">
              Xem phương án <ChevronRight size={15} aria-hidden="true" />
            </a>
          </div>
        )}
        {!areas.length && (
          <Empty
            title="Chưa có dữ liệu bàn"
            description="Thử chọn khu vực khác."
          />
        )}
        {areas.map((zone) => (
          <section className="ops-floor-zone" key={zone}>
            <h3>{zone}</h3>
            <div className={`ops-floor-tables ops-floor-${view}`}>
              {TABLES.filter((table) => table.area === zone).map((table) => {
                const assigned = booking?.tables.includes(table.id);
                const occupied = occupying(table.id);
                const tone = occupied
                  ? occupied.status === 'pending'
                    ? 'held'
                    : 'busy'
                  : assigned
                    ? 'current'
                    : 'free';
                const label = {
                  free: 'Còn trống',
                  held: 'Đã giữ',
                  busy: 'Đã đặt',
                  current: 'Bàn đã phân',
                }[tone];
                const pressed = booking
                  ? proposal.includes(table.id)
                  : inspected === table.id;
                return (
                  <button
                    type="button"
                    className="ops-floor-table"
                    key={table.id}
                    data-tone={tone}
                    aria-pressed={pressed}
                    onClick={() => selectTable(table.id)}
                  >
                    <span className="ops-floor-table-code">
                      <Sofa size={18} aria-hidden="true" />
                      <strong>{table.id}</strong>
                    </span>
                    <span>{table.seats} chỗ</span>
                    <span className="ops-floor-table-state">
                      {label}
                      {occupied && <small>{occupied.id}</small>}
                    </span>
                    {pressed && (
                      <Check
                        className="ops-table-tick"
                        size={16}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </Panel>
      <Panel className="ops-detail-panel ops-floor-editor">
        <h2 id="ops-floor-editor" tabIndex={-1}>
          Phân bàn
        </h2>
        {!hasCandidates && (
          <p className="ops-muted">Khung này chưa có lượt cần phân bàn.</p>
        )}
        {booking ? (
          <>
            <SummaryFields
              fields={[
                [
                  'Mã lượt',
                  <Link
                    className="ops-inline-link"
                    to={`${BOOKINGS}/${encodeURIComponent(booking.id)}`}
                  >
                    {booking.id} <ChevronRight size={14} aria-hidden="true" />
                  </Link>,
                ],
                ['Đặt chỗ', <Status value={booking.status} kind="booking" />],
                ['Bàn đã phân', reference(booking)],
                [
                  'Bàn đang chọn',
                  proposal.length ? proposal.join(', ') : 'Chưa chọn bàn',
                ],
                ['Sức chứa', `${capacity} chỗ / ${booking.guests} khách`],
              ]}
            />
            {feedback && (
              <Notice tone={feedback.warning ? 'warning' : 'success'}>
                {feedback.text}
              </Notice>
            )}
            <div className="ops-dialog-actions">
              {changed && (
                <button
                  type="button"
                  className="button tertiary"
                  onClick={resetDraft}
                >
                  Bỏ thay đổi
                </button>
              )}
              <button
                type="button"
                className="button"
                disabled={!changed}
                onClick={save}
              >
                Lưu phương án
              </button>
            </div>
          </>
        ) : inspectedTable ? (
          <SummaryFields
            fields={[
              ['Bàn đang xem', inspectedTable.id],
              ['Sức chứa', `${inspectedTable.seats} chỗ`],
              [
                'Lượt đang dùng bàn',
                occupying(inspectedTable.id)?.id ?? 'Còn trống',
              ],
            ]}
          />
        ) : (
          <p className="ops-muted">Chọn bàn để xem số chỗ và lượt đặt.</p>
        )}
      </Panel>
    </div>
  );
}

export function OpsKitchen() {
  const bookings = useOpsBookings();
  const { dishes } = useRestaurant();
  const [params, setParams] = useSearchParams();
  const dateParam = params.get('date') ?? DEMO_DATE;
  const date = validDate(dateParam) ? dateParam : '';
  const timeParam = params.get('time') ?? '';
  const time = TIMES.includes(timeParam) ? timeParam : '';
  const changesOnly = params.get('changes') === 'yes';
  const prepare = bookings.filter(
    (booking) =>
      booking.date === date &&
      (!time || booking.time === time) &&
      booking.items.length > 0 &&
      (booking.status === 'confirmed' || booking.status === 'arrived'),
  );
  const listed = changesOnly
    ? prepare.filter((booking) => booking.kitchenChanged)
    : prepare;
  const hours = [...new Set(listed.map((booking) => booking.time))].sort();

  function setFilter(nextDate: string, nextTime: string, changed: boolean) {
    const next: Record<string, string> = { date: nextDate };
    if (nextTime) next.time = nextTime;
    if (changed) next.changes = 'yes';
    setParams(next, { replace: true });
  }

  return (
    <div className="ops-stack">
      <PageHead
        title="Chuẩn bị bếp"
        description="Xem số lượng món đặt trước theo giờ phục vụ."
      />
      <div
        className="ops-filters"
        role="group"
        aria-label="Bộ lọc chuẩn bị bếp"
      >
        <DateField
          value={date}
          onChange={(value) => setFilter(value, time, changesOnly)}
        />
        <TimeField
          all
          value={time}
          onChange={(value) => setFilter(date, value, changesOnly)}
        />
        <label className="ops-check ops-filter-check">
          <input
            type="checkbox"
            checked={changesOnly}
            onChange={(event) => setFilter(date, time, event.target.checked)}
          />{' '}
          <span>Chỉ xem món đổi sau khi chốt</span>
        </label>
      </div>
      <section
        className="ops-kitchen-section"
        aria-labelledby="ops-kitchen-title"
      >
        <div className="ops-results-head ops-kitchen-head">
          <h2 id="ops-kitchen-title">Cần chuẩn bị</h2>
          <span role="status">{listed.length} lượt có món</span>
        </div>
        {!hours.length && (
          <Panel>
            <Empty
              title={
                changesOnly
                  ? 'Chưa có thay đổi sau chốt'
                  : 'Chưa có món cần chuẩn bị'
              }
              description="Thử chọn ngày hoặc giờ khác."
            />
          </Panel>
        )}
        {hours.map((hour) => (
          <section className="ops-kitchen-shift" key={hour}>
            <h3>
              <Clock3 size={18} aria-hidden="true" /> {hour}
            </h3>
            <div className="ops-kitchen-tickets">
              {listed
                .filter((booking) => booking.time === hour)
                .map((booking) => (
                  <Panel className="ops-kitchen-ticket" key={booking.id}>
                    <div className="ops-panel-heading">
                      <h4>{booking.id}</h4>
                      {booking.kitchenChanged && booking.items.length > 1 && (
                        <Badge tone="warning">Thay đổi sau chốt</Badge>
                      )}
                    </div>
                    <ul className="ops-line-list">
                      {booking.items.map(({ dishId, quantity }) => (
                        <li key={dishId}>
                          <span className="ops-kitchen-item">
                            {dishes.find((dish) => dish.id === dishId)?.name ??
                              dishId}
                            {booking.kitchenChanged &&
                              booking.items.length === 1 && (
                                <Badge tone="warning">Thay đổi sau chốt</Badge>
                              )}
                          </span>
                          <strong>× {quantity}</strong>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                ))}
            </div>
          </section>
        ))}
      </section>
    </div>
  );
}

type DepositFilter = 'open' | 'all' | Booking['deposit'];

const depositFilters: [DepositFilter, string][] = [
  ['open', 'Cần xử lý'],
  ['all', 'Tất cả giao dịch'],
  ['pending', 'Chờ chuyển cọc'],
  ['review', 'Chờ xác minh'],
  ['exception', 'Cần đối chiếu'],
  ['verified', 'Đã xác minh'],
  ['expired', 'Hết hiệu lực'],
];

export function OpsDeposits() {
  const bookings = useOpsBookings();
  const [params, setParams] = useSearchParams();
  const [feedback, setFeedback] = useState('');
  const depositHeading = useRef<HTMLHeadingElement>(null);
  const openingButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const rawFilter = params.get('status') ?? 'open';
  const filter =
    depositFilters.find(([value]) => value === rawFilter)?.[0] ?? 'open';
  const selectedId = params.get('id');
  const selected = bookings.find((booking) => booking.id === selectedId);
  const rows = bookings
    .filter(
      (booking) =>
        filter === 'all' ||
        (filter === 'open'
          ? booking.deposit !== 'verified'
          : booking.deposit === filter),
    )
    .sort(
      (a, b) =>
        Number(isLateDeposit(b)) - Number(isLateDeposit(a)) ||
        a.date.localeCompare(b.date) ||
        a.time.localeCompare(b.time),
    );

  function select(id: string | null) {
    const next = new URLSearchParams(params);
    if (id) next.set('id', id);
    else next.delete('id');
    setParams(next, { replace: true });
  }

  useEffect(() => {
    if (selectedId || !returnFocus.current) return;
    returnFocus.current = false;
    if (openingButton.current?.isConnected) openingButton.current.focus();
    else depositHeading.current?.focus();
  }, [selectedId]);

  return (
    <div className="ops-stack">
      <PageHead
        title="Đối chiếu cọc"
        description="So khớp số tiền và nội dung chuyển khoản."
      />
      <div className="ops-filters" role="group" aria-label="Bộ lọc tiền cọc">
        <label className="field ops-field">
          <span>Tình trạng cọc</span>
          <select
            className="input"
            value={filter}
            onChange={(event) => {
              setFeedback('');
              setParams({ status: event.target.value }, { replace: true });
            }}
          >
            {depositFilters.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {feedback && <Notice tone="success">{feedback}</Notice>}
      {selectedId && !selected && (
        <Notice tone="warning">
          Không tìm thấy giao dịch cho mã {selectedId}.
        </Notice>
      )}
      <section className="ops-table-panel" aria-labelledby="ops-deposits-title">
        <div className="ops-results-head">
          <h2 id="ops-deposits-title" ref={depositHeading} tabIndex={-1}>
            Giao dịch đặt cọc
          </h2>
          <span role="status">{rows.length} lượt</span>
        </div>
        {rows.length ? (
          <table className="ops-table ops-responsive-table ops-money-table">
            <thead>
              <tr>
                <th scope="col">Mã lượt</th>
                <th scope="col">Khung dùng bữa</th>
                <th scope="col">Dự kiến</th>
                <th scope="col">Thực nhận</th>
                <th scope="col">Tiền cọc</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((booking) => (
                <tr key={booking.id}>
                  <th scope="row">
                    <button
                      className="ops-table-link"
                      type="button"
                      onClick={(event) => {
                        openingButton.current = event.currentTarget;
                        setFeedback('');
                        select(booking.id);
                      }}
                    >
                      {booking.id} <ChevronRight size={15} aria-hidden="true" />
                    </button>
                  </th>
                  <td data-label="Khung dùng bữa">
                    {booking.time} <small>{sectionDay(booking.date)}</small>
                  </td>
                  <td data-label="Dự kiến">{money(DEPOSIT_AMOUNT)}</td>
                  <td data-label="Thực nhận">
                    {booking.received === undefined
                      ? 'Chưa ghi nhận'
                      : money(booking.received)}
                  </td>
                  <td data-label="Tiền cọc">
                    <Status value={booking.deposit} kind="deposit" />
                    {isLateDeposit(booking) && (
                      <small className="ops-warn-text">
                        {booking.received === undefined
                          ? 'Quá thời hạn'
                          : 'Tiền đến sau hạn'}
                      </small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty
            title="Chưa có khoản cọc khớp bộ lọc"
            description="Chọn trạng thái cọc khác để xem thêm."
          />
        )}
      </section>
      {selected && (
        <DepositEditor
          key={selected.id}
          booking={selected}
          onClose={() => {
            returnFocus.current = true;
            select(null);
          }}
          onSave={setFeedback}
        />
      )}
    </div>
  );
}

type DepositField = 'transaction' | 'content' | 'amount' | 'reason';
type DepositErrors = Partial<Record<DepositField, string>>;

function depositReference(booking: Booking) {
  return (
    booking.depositEvidence?.transactionId ??
    (booking.received === undefined ? '' : `GD-${booking.id}`)
  );
}

function DepositEditor({
  booking,
  onClose,
  onSave,
}: {
  booking: Booking;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const bookings = useOpsBookings();
  const { scenario, role, updateBooking } = useRestaurant();
  const hasReceipt = booking.received !== undefined;
  const late = isLateDeposit(booking);
  const tableChange = booking.history
    .find((entry) => /bàn.*(đã chuyển|đã cấp)/i.test(entry))
    ?.match(/Bàn .*?(?:\.(?=\s|$)|$)/i)?.[0];
  const savedTransaction = depositReference(booking);
  const savedContent =
    booking.depositEvidence?.content ?? (hasReceipt ? booking.id : '');
  const [amount, setAmount] = useState(
    hasReceipt ? String(booking.received) : '',
  );
  const [transaction, setTransaction] = useState(savedTransaction);
  const [content, setContent] = useState(savedContent);
  const [reason, setReason] = useState('');
  const [decision, setDecision] = useState<{
    status: 'verified' | 'exception';
    version: number;
  } | null>(null);
  const [pendingCheck, setPendingCheck] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<DepositErrors>({});
  const [saved, setSaved] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const firstInvalidField = useRef<DepositField | null>(null);
  const returnToForm = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLElement>(null);
  const mayEdit = booking.deposit !== 'verified';
  const transactionId = transaction.trim().toUpperCase();
  const recorded = Number(amount);
  const transactionNote = `Giao dịch ${transactionId} ·`;
  const duplicate =
    transactionId &&
    bookings.some(
      (other) =>
        other.id !== booking.id &&
        other.deposit === 'verified' &&
        transactionId === depositReference(other),
    );

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (decision || pendingCheck || saved) stepRef.current?.focus();
  }, [decision, pendingCheck, saved]);

  useEffect(() => {
    if (!firstInvalidField.current) return;
    const field = formRef.current?.elements.namedItem(
      firstInvalidField.current,
    );
    firstInvalidField.current = null;
    if (field instanceof HTMLElement) field.focus();
  }, [fieldErrors]);

  useEffect(() => {
    if (decision || !returnToForm.current) return;
    returnToForm.current = false;
    formRef.current
      ?.querySelector<HTMLButtonElement>('button[type="submit"]')
      ?.focus();
  }, [decision]);

  function changeField(
    field: DepositField,
    value: string,
    setValue: (next: string) => void,
  ) {
    setValue(value);
    setError('');
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }

  function fieldAttributes(field: DepositField) {
    const invalid = Boolean(fieldErrors[field]);
    return {
      name: field,
      'aria-labelledby': `ops-deposit-label-${field}`,
      'aria-invalid': invalid || undefined,
      'aria-describedby': invalid ? `ops-deposit-error-${field}` : undefined,
    };
  }

  function fieldError(field: DepositField) {
    return (
      fieldErrors[field] && (
        <span className="ops-field-error" id={`ops-deposit-error-${field}`}>
          {fieldErrors[field]}
        </span>
      )
    );
  }

  function stage(result: 'verified' | 'exception') {
    const nextErrors: DepositErrors = {};
    setError('');
    setSaved('');
    if (result === 'exception' && !reason.trim()) {
      nextErrors.reason = 'Nhập lý do để ghi sai lệch.';
    }
    if (result === 'verified') {
      if (!transactionId)
        nextErrors.transaction = 'Nhập mã giao dịch từ sao kê.';
      else if (duplicate)
        nextErrors.transaction =
          'Mã này đã dùng cho lượt khác. Kiểm tra lại sao kê.';
      if (content.trim().toUpperCase() !== booking.id)
        nextErrors.content = `Nhập đúng mã lượt ${booking.id}.`;
      if (recorded !== DEPOSIT_AMOUNT)
        nextErrors.amount = `Số tiền xác minh phải bằng ${money(DEPOSIT_AMOUNT)}.`;
    }
    if (amount && (!Number.isSafeInteger(recorded) || recorded < 0)) {
      nextErrors.amount = 'Nhập số tiền thực nhận bằng số nguyên từ 0 trở lên.';
    }
    const first = (
      ['transaction', 'content', 'amount', 'reason'] as const
    ).find((field) => nextErrors[field]);
    firstInvalidField.current = first ?? null;
    setFieldErrors(nextErrors);
    if (first) {
      return;
    }
    setDecision({ status: result, version: booking.history.length });
  }

  function save() {
    if (!decision || !mayEdit) return;
    if (decision.version !== booking.history.length) {
      setDecision(null);
      setError('Tiền cọc vừa thay đổi. Kiểm tra lại trước khi lưu.');
      return;
    }
    if (decision.status === 'verified' && duplicate) {
      setDecision(null);
      setError(
        'Mã giao dịch đã được ghi cho lượt khác. Kiểm tra lại bằng chứng.',
      );
      return;
    }
    const confirmed = decision.status === 'verified';
    const auditText = confirmed
      ? `${transactionNote} Xác minh cọc ${money(recorded)} từ sao kê mẫu${late ? ' (sau hạn)' : ''}`
      : `Ghi sai lệch cọc${transactionId ? ` (${transactionId})` : ''}: ${reason.trim()}`;
    const entry = audit(auditText, role);
    updateBooking(
      booking.id,
      {
        deposit: decision.status,
        received: amount ? recorded : booking.received,
        depositEvidence: { transactionId, content: content.trim() },
      },
      entry,
    );
    setDecision(null);
    setReason('');
    if (scenario === 'lost-response') setPendingCheck(entry);
    else
      showResult(
        confirmed
          ? `Đã xác minh cọc cho ${booking.id}.`
          : `Đã lưu sai lệch cọc cho ${booking.id}.`,
      );
  }

  function showResult(text: string) {
    setSaved(text);
    onSave(text);
  }

  function checkResult() {
    if (!pendingCheck || !booking.history.includes(pendingCheck)) {
      setError('Chưa tìm thấy kết quả của giao dịch này. Thử kiểm tra lại.');
      return;
    }
    setPendingCheck(null);
    setError('');
    showResult(`Kết quả đối chiếu của ${booking.id} đã được lưu.`);
  }

  return (
    <Modal title={`Đối chiếu ${booking.id}`} onClose={onClose}>
      <div className="ops-deposit-detail ops-stack">
        <SummaryFields
          fields={[
            [
              'Ngày và khung dùng bữa',
              `${sectionDay(booking.date)} · ${booking.time}`,
            ],
            ['Tiền cọc', <Status value={booking.deposit} kind="deposit" />],
            ['Dự kiến', money(DEPOSIT_AMOUNT)],
            [
              'Thực nhận',
              hasReceipt ? money(booking.received ?? 0) : 'Chưa ghi nhận',
            ],
            ['Đặt chỗ', <Status value={booking.status} kind="booking" />],
            ['Bố trí bàn', reference(booking)],
            [
              'Nguồn đối chiếu',
              hasReceipt || savedTransaction
                ? 'Sao kê ngân hàng mẫu'
                : 'Chưa có bằng chứng giao dịch',
            ],
            ['Mã giao dịch sao kê', savedTransaction || 'Chưa ghi nhận'],
            ['Nội dung chuyển khoản', savedContent || 'Chưa ghi nhận'],
          ]}
        />
        {late && (
          <Notice tone="warning">
            <p>
              {hasReceipt
                ? 'Tiền đến sau thời hạn giữ bàn.'
                : 'Đã hết thời hạn giữ bàn.'}
            </p>
            <p>
              {tableChange ?? 'Kiểm tra bàn trống trước khi liên hệ khách.'}
            </p>
          </Notice>
        )}
        {saved && (
          <section ref={stepRef} tabIndex={-1}>
            <Notice tone="success">{saved}</Notice>
          </section>
        )}
        {pendingCheck ? (
          <section className="ops-stack" ref={stepRef} tabIndex={-1}>
            <Notice tone="warning">
              Chưa nhận được kết quả sau khi lưu. Kiểm tra kết quả trước khi thử
              lại.
            </Notice>
            {error && (
              <div ref={errorRef} tabIndex={-1}>
                <Notice tone="danger">{error}</Notice>
              </div>
            )}
            <button className="button" type="button" onClick={checkResult}>
              Kiểm tra kết quả
            </button>
          </section>
        ) : decision ? (
          <section
            className="ops-deposit-confirm ops-stack"
            aria-label="Xác nhận đối chiếu"
            tabIndex={-1}
            ref={stepRef}
          >
            <h3>
              {decision.status === 'verified'
                ? 'Xác minh đã nhận cọc'
                : 'Lưu sai lệch cọc'}
            </h3>
            <p>
              {decision.status === 'verified'
                ? `Ghi nhận ${money(recorded)} cho ${booking.id}.`
                : `Lý do: ${reason.trim()}`}
            </p>
            {late && <p>Kiểm tra bàn còn trống trước khi hẹn khách.</p>}
            <div className="ops-dialog-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  returnToForm.current = true;
                  setDecision(null);
                }}
              >
                Quay lại
              </button>
              <button className="button" type="button" onClick={save}>
                Xác nhận kết quả
              </button>
            </div>
          </section>
        ) : (
          mayEdit && (
            <form
              className="ops-stack"
              ref={formRef}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                stage('verified');
              }}
            >
              <h3>Thông tin giao dịch</h3>
              <label className="field ops-field">
                <span id="ops-deposit-label-transaction">
                  Mã giao dịch sao kê
                </span>
                <input
                  {...fieldAttributes('transaction')}
                  className="input"
                  value={transaction}
                  maxLength={40}
                  onChange={(event) =>
                    changeField(
                      'transaction',
                      event.target.value,
                      setTransaction,
                    )
                  }
                  placeholder="Nhập mã giao dịch"
                />
                {fieldError('transaction')}
              </label>
              <label className="field ops-field">
                <span id="ops-deposit-label-content">
                  Nội dung chuyển khoản
                </span>
                <input
                  {...fieldAttributes('content')}
                  className="input"
                  value={content}
                  maxLength={40}
                  onChange={(event) =>
                    changeField('content', event.target.value, setContent)
                  }
                  placeholder={booking.id}
                />
                {fieldError('content')}
              </label>
              <label className="field ops-field">
                <span id="ops-deposit-label-amount">
                  Số tiền thực nhận (đồng)
                </span>
                <input
                  {...fieldAttributes('amount')}
                  className="input"
                  type="number"
                  step="1"
                  min="0"
                  value={amount}
                  onChange={(event) =>
                    changeField('amount', event.target.value, setAmount)
                  }
                />
                {fieldError('amount')}
              </label>
              <label className="field ops-field">
                <span id="ops-deposit-label-reason">Lý do nếu có sai lệch</span>
                <textarea
                  {...fieldAttributes('reason')}
                  className="input"
                  rows={2}
                  maxLength={200}
                  value={reason}
                  onChange={(event) =>
                    changeField('reason', event.target.value, setReason)
                  }
                />
                {fieldError('reason')}
              </label>
              {error && (
                <div ref={errorRef} tabIndex={-1}>
                  <Notice tone="danger">{error}</Notice>
                </div>
              )}
              <div className="ops-dialog-actions">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => stage('exception')}
                >
                  Ghi sai lệch
                </button>
                <button className="button" type="submit">
                  Xác minh cọc
                </button>
              </div>
            </form>
          )
        )}
        <DepositAudit booking={booking} />
      </div>
    </Modal>
  );
}

function DepositAudit({ booking }: { booking: Booking }) {
  const entries = booking.history.filter((entry) =>
    /^(giao dịch|ghi sai lệch cọc|tiền đến|xác minh cọc|cọc |đã đối chiếu|khách báo)/i.test(
      entry,
    ),
  );
  return (
    <section className="ops-detail-panel ops-deposit-audit">
      <h3>Lịch sử đối chiếu</h3>
      {entries.length ? (
        <ol className="ops-history">
          {entries.map((entry, index) => (
            <li key={`${index}-${entry}`}>{entry}</li>
          ))}
        </ol>
      ) : (
        <p className="ops-muted">
          {booking.deposit === 'verified'
            ? 'Đã xác minh bằng dữ liệu mẫu.'
            : 'Chưa có cập nhật đối chiếu.'}
        </p>
      )}
    </section>
  );
}

export function OpsReports() {
  const bookings = useOpsBookings();
  const [params, setParams] = useSearchParams();
  const start = params.get('from') ?? DEMO_DATE;
  const end = params.get('to') ?? DEMO_DATE;
  const startError = validDate(start) ? undefined : 'Chọn ngày bắt đầu.';
  const endError = !validDate(end)
    ? 'Chọn ngày kết thúc.'
    : !startError && end < start
      ? 'Ngày kết thúc phải từ ngày bắt đầu trở đi.'
      : undefined;
  const valid = !startError && !endError;
  const inPeriod = valid
    ? bookings.filter((booking) => booking.date >= start && booking.date <= end)
    : [];
  const count = (status: Booking['status']) =>
    inPeriod.filter((booking) => booking.status === status).length;
  const guests = inPeriod
    .filter((booking) => booking.status !== 'cancelled')
    .reduce((sum, booking) => sum + booking.guests, 0);
  const noShow = count('no-show');
  const evaluable = count('completed') + noShow;
  const ratio = evaluable
    ? new Intl.NumberFormat('vi-VN', {
        style: 'percent',
        maximumFractionDigits: 1,
      }).format(noShow / evaluable)
    : '—';
  const verified = inPeriod.filter((booking) => booking.deposit === 'verified');
  const totalDeposit = verified.reduce(
    (sum, booking) => sum + (booking.received ?? 0),
    0,
  );
  const periodLabel =
    start === end
      ? sectionDay(start)
      : `${sectionDay(start)} – ${sectionDay(end)}`;

  const summary = [
    {
      label: 'Lượt đặt',
      value: inPeriod.length,
      unit: 'lượt',
      detail: 'Website và trợ lý AI',
      icon: ClipboardList,
    },
    {
      label: 'Khách dự kiến',
      value: guests,
      unit: 'khách',
      detail: 'Gồm lượt còn hiệu lực và lượt đã ghi kết quả',
      icon: UsersRound,
    },
    {
      label: 'Khách không đến',
      value: noShow,
      unit: 'lượt',
      detail: evaluable
        ? `Tỷ lệ ${ratio} trên ${evaluable} lượt có kết quả`
        : 'Chưa có lượt nào có kết quả',
      icon: Clock3,
    },
    {
      label: 'Cọc đã xác minh',
      value: money(totalDeposit),
      detail: `${verified.length} khoản trong kỳ`,
      icon: CreditCard,
    },
  ];

  return (
    <div className="ops-stack">
      <PageHead
        title="Báo cáo"
        description="Tổng hợp lượt đặt, kết quả phục vụ và tiền cọc theo ngày dùng bữa."
      />
      <div className="ops-filters" role="group" aria-label="Kỳ báo cáo">
        <DateField
          label="Từ ngày"
          value={validDate(start) ? start : ''}
          error={startError}
          errorId="ops-report-start-error"
          onChange={(from) => setParams({ from, to: end }, { replace: true })}
        />
        <DateField
          label="Đến ngày"
          value={validDate(end) ? end : ''}
          error={endError}
          errorId="ops-report-end-error"
          onChange={(to) => setParams({ from: start, to }, { replace: true })}
        />
        <button
          type="button"
          className="button tertiary ops-filter-reset"
          onClick={() => setParams({}, { replace: true })}
          disabled={start === DEMO_DATE && end === DEMO_DATE}
        >
          Về kỳ mẫu
        </button>
      </div>
      {valid && (
        <section className="ops-stack" aria-labelledby="ops-report-title">
          <div className="ops-results-head ops-report-head">
            <h2 id="ops-report-title">Kỳ {periodLabel}</h2>
            <span>Tính theo ngày dùng bữa</span>
          </div>
          {inPeriod.length === 0 ? (
            <Panel>
              <Empty
                title="Kỳ này chưa có dữ liệu"
                description="Chọn khoảng ngày khác."
              />
            </Panel>
          ) : (
            <>
              <div className="ops-metrics">
                {summary.map(({ label, value, unit, detail, icon: Icon }) => (
                  <Panel key={label} className="ops-metric">
                    <span className="ops-metric-icon">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <h3>{label}</h3>
                    <p className="ops-metric-value">
                      {value} {unit && <small>{unit}</small>}
                    </p>
                    <p className="ops-muted">{detail}</p>
                  </Panel>
                ))}
              </div>
              <section
                className="ops-table-panel"
                aria-labelledby="ops-report-breakdown"
              >
                <div className="ops-results-head">
                  <h2 id="ops-report-breakdown">Chi tiết theo trạng thái</h2>
                  <span>Số lượt đặt</span>
                </div>
                <table className="ops-table ops-report-table">
                  <thead>
                    <tr>
                      <th scope="col">Tình trạng</th>
                      <th scope="col">Website</th>
                      <th scope="col">Trợ lý AI</th>
                      <th scope="col">Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(bookingLabels).map(([value, label]) => {
                      const related = inPeriod.filter(
                        (booking) => booking.status === value,
                      );
                      return (
                        <tr key={value}>
                          <th scope="row">{label}</th>
                          <td>
                            {
                              related.filter(
                                (booking) => booking.source === 'web',
                              ).length
                            }
                          </td>
                          <td>
                            {
                              related.filter(
                                (booking) => booking.source === 'chat',
                              ).length
                            }
                          </td>
                          <td>{related.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            </>
          )}
        </section>
      )}
    </div>
  );
}
