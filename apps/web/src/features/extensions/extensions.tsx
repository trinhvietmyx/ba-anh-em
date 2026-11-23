import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type MouseEventHandler,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { Link, useParams } from 'react-router';
import { useRestaurant } from '../../app/restaurant-context';
import { MOCK_EVENTS, MOCK_REVIEWS } from '../../mocks/extension-fixtures';
import type {
  ChangeRequest,
  Decision,
  EventRequestData,
  Review,
} from '../../shared/extensions';
import {
  DEMO_DATE,
  TABLES,
  TIMES,
  displayDate,
  isTableOccupied,
  money,
  type Booking,
  type Dish,
} from '../../shared/model';
import {
  Badge,
  Empty,
  Modal,
  Notice,
  PageHead,
  Panel,
  PublicPageIntro,
  Status,
} from '../../shared/ui';
import './extensions.css';

type ExtensionState = {
  changes: ChangeRequest[];
  setChanges: Dispatch<SetStateAction<ChangeRequest[]>>;
  events: EventRequestData[];
  setEvents: Dispatch<SetStateAction<EventRequestData[]>>;
  eventReceiptId: string;
  setEventReceiptId: Dispatch<SetStateAction<string>>;
  reviews: Review[];
  setReviews: Dispatch<SetStateAction<Review[]>>;
};

const ExtensionsContext = createContext<ExtensionState | null>(null);

export function ExtensionsProvider({ children }: { children: ReactNode }) {
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [eventReceiptId, setEventReceiptId] = useState('');
  const [events, setEvents] = useState<EventRequestData[]>(MOCK_EVENTS);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);

  return (
    <ExtensionsContext.Provider
      value={{
        changes,
        setChanges,
        events,
        setEvents,
        eventReceiptId,
        setEventReceiptId,
        reviews,
        setReviews,
      }}
    >
      {children}
    </ExtensionsContext.Provider>
  );
}

function useExtensions() {
  const state = useContext(ExtensionsContext);
  if (!state) throw new Error('ExtensionsProvider is required');
  return state;
}

const PREVIEW = {
  optional: 'Tùy chọn · Bản mẫu',
  advanced: 'Nâng cao · Bản mẫu',
};
const DECISION_TEXT = {
  pending: 'Chờ xử lý',
  accepted: 'Đã chấp nhận',
  declined: 'Đã từ chối',
};
const EVENT_STATUS = {
  pending: 'Chờ xử lý',
  accepted: 'Có thể tổ chức',
  declined: 'Không thể tiếp nhận',
};
const REVIEW_STATUS = {
  pending: 'Chờ duyệt',
  published: 'Đã công bố',
  declined: 'Từ chối công bố',
};
const RATING_LABELS = [
  'Rất không hài lòng',
  'Không hài lòng',
  'Bình thường',
  'Hài lòng',
  'Rất hài lòng',
];
const EVENT_KINDS = [
  'Sinh nhật',
  'Tiệc công ty',
  'Họp mặt gia đình',
  'Sự kiện khác',
];
const DEFAULT_EVENT_TIME = TIMES[0] ?? '11:00';
const MIN_EVENT_GUESTS = 10;
const MAX_EVENT_GUESTS = TABLES.reduce((sum, table) => sum + table.seats, 0);

function PreviewAccess({ staff = false }: { staff?: boolean }) {
  return (
    <Empty
      title={staff ? 'Cần quyền quản trị viên' : 'Chức năng mở rộng'}
      description={
        staff
          ? 'Chức năng này dành cho Quản trị viên (Admin).'
          : 'Bật «Mở rộng» để dùng chức năng này.'
      }
      action={
        <Link className="button secondary" to={staff ? '/van-hanh' : '/'}>
          <ArrowLeft size={17} /> {staff ? 'Về vận hành' : 'Về trang chủ'}
        </Link>
      }
    />
  );
}

function SectionTitle({
  icon: Icon,
  children,
  focus = false,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  focus?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus) heading.current?.focus();
  }, [focus]);

  return (
    <h2
      className="ext-section-title"
      ref={heading}
      tabIndex={focus ? -1 : undefined}
    >
      {Icon && <Icon size={19} aria-hidden="true" />}
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="ext-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function FormError({ children, id }: { children: string; id?: string }) {
  const target = useRef<HTMLDivElement>(null);
  useEffect(() => {
    target.current?.focus();
  }, [children]);

  return (
    <div className="ext-form-error" ref={target} tabIndex={-1} id={id}>
      <Notice tone="danger">{children}</Notice>
    </div>
  );
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="ext-facts">
      {rows.map(([label, content]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{content}</dd>
        </div>
      ))}
    </dl>
  );
}

function SlotFields({
  date,
  setDate,
  time,
  setTime,
  guests,
  setGuests,
  minGuests = 1,
  maxGuests,
}: {
  date: string;
  setDate: (value: string) => void;
  time: string;
  setTime: (value: string) => void;
  guests: string;
  setGuests: (value: string) => void;
  minGuests?: number;
  maxGuests: number;
}) {
  return (
    <div className="ext-fields ext-fields-three">
      <Field label="Ngày đến">
        <input
          className="input"
          type="date"
          min={DEMO_DATE}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </Field>
      <Field label="Giờ đến">
        <select
          className="input"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          required
        >
          {TIMES.map((slot) => (
            <option key={slot}>{slot}</option>
          ))}
        </select>
      </Field>
      <Field label="Số khách">
        <input
          className="input"
          type="number"
          min={minGuests}
          max={maxGuests}
          step={1}
          value={guests}
          onChange={(event) => setGuests(event.target.value)}
          required
        />
      </Field>
    </div>
  );
}

function usePreviewSubmit() {
  const timer = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  return {
    busy,
    submit(action: () => void) {
      if (timer.current !== null) return;
      setBusy(true);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setBusy(false);
        action();
      }, 300);
    },
  };
}

function isPhone(phone: string) {
  return /^0\d{9}$/.test(phone.trim());
}

function verifiedBooking(bookings: Booking[], code: string, phone: string) {
  return bookings.find(
    (booking) =>
      booking.id === code.trim().toUpperCase() &&
      booking.phone === phone.trim(),
  );
}

function canChange(booking: Booking) {
  return (
    (booking.status === 'pending' || booking.status === 'confirmed') &&
    booking.date >= DEMO_DATE
  );
}

function availableTables(
  bookings: Booking[],
  date: string,
  time: string,
  exceptId?: string,
) {
  return TABLES.filter(
    (table) => !isTableOccupied(bookings, table.id, date, time, exceptId),
  );
}

export function MenuAdmin() {
  const { dishes, role } = useRestaurant();
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [editing, setEditing] = useState<Dish | 'new' | null>(null);
  const [feedback, setFeedback] = useState('');

  if (role !== 'admin') return <PreviewAccess staff />;

  const shown = dishes.filter(
    (dish) =>
      `${dish.name} ${dish.category}`
        .toLocaleLowerCase('vi')
        .includes(search.trim().toLocaleLowerCase('vi')) &&
      (visibility === 'all' ||
        (visibility === 'published' ? dish.published : !dish.published)),
  );

  return (
    <div className="ext-page">
      <PageHead
        eyebrow={PREVIEW.optional}
        title="Quản trị thực đơn"
        description="Sửa thông tin món, bật đặt trước hoặc ẩn món khỏi thực đơn."
        action={
          <button
            className="button"
            type="button"
            onClick={() => setEditing('new')}
          >
            <Plus size={18} /> Thêm món
          </button>
        }
      />
      {feedback && <Notice tone="success">{feedback}</Notice>}
      <Panel className="ext-table-panel">
        <div className="ext-table-tools">
          <div>
            <SectionTitle icon={Utensils}>Danh sách món</SectionTitle>
            <p className="ext-muted">
              {dishes.filter((dish) => dish.published).length} món đang công bố
            </p>
          </div>
          <div className="ext-fields">
            <label className="ext-search">
              <Search size={17} aria-hidden="true" />
              <input
                className="input"
                type="search"
                placeholder="Tìm tên hoặc nhóm món"
                aria-label="Tìm tên hoặc nhóm món"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select
              className="input"
              aria-label="Lọc theo công bố"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đang công bố</option>
              <option value="private">Đang ẩn</option>
            </select>
          </div>
        </div>
        {shown.length ? (
          <table className="ext-table" role="table" aria-label="Danh sách món">
            <thead>
              <tr>
                <th scope="col">Món</th>
                <th scope="col">Giá</th>
                <th scope="col">Đặt trước</th>
                <th scope="col">Công bố</th>
                <th scope="col">
                  <span className="ext-sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((dish) => (
                <tr key={dish.id}>
                  <td>
                    <strong>{dish.name}</strong>
                    <small>{dish.category}</small>
                  </td>
                  <td data-label="Giá" className="ext-table-price">
                    {money(dish.price)}
                  </td>
                  <td data-label="Đặt trước">
                    <Badge tone={dish.available ? 'success' : 'warning'}>
                      {dish.available ? 'Còn món' : 'Tạm hết'}
                    </Badge>
                  </td>
                  <td data-label="Công bố">
                    <Badge tone={dish.published ? 'info' : undefined}>
                      {dish.published ? 'Đang công bố' : 'Đang ẩn'}
                    </Badge>
                  </td>
                  <td>
                    <button
                      className="button tertiary"
                      type="button"
                      onClick={() => setEditing(dish)}
                      aria-label={`Sửa ${dish.name}`}
                    >
                      Chỉnh sửa <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty
            title="Không tìm thấy món"
            description="Thử tên món khác hoặc đổi bộ lọc hiển thị."
          />
        )}
      </Panel>
      {editing !== null && (
        <DishEditor
          editing={editing}
          onClose={() => setEditing(null)}
          onSave={(message) => {
            setFeedback(message);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function DishEditor({
  editing,
  onClose,
  onSave,
}: {
  editing: Dish | 'new';
  onClose: () => void;
  onSave: (message: string) => void;
}) {
  const { dishes, bookings, updateBooking, setDishes, role } = useRestaurant();
  const dish = editing === 'new' ? undefined : editing;
  const [name, setName] = useState(dish?.name ?? '');
  const [category, setCategory] = useState(dish?.category ?? '');
  const [price, setPrice] = useState(dish ? String(dish.price) : '');
  const [description, setDescription] = useState(dish?.description ?? '');
  const [available, setAvailable] = useState(dish?.available ?? true);
  const [published, setPublished] = useState(dish?.published ?? false);
  const [error, setError] = useState('');
  const { busy, submit } = usePreviewSubmit();

  const categories = [...new Set(dishes.map((item) => item.category))];
  const requiresDescription = dish?.description !== '';
  const affected =
    dish && (dish.published !== published || dish.available !== available);

  function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (
      !name.trim() ||
      !category.trim() ||
      (requiresDescription && !description.trim()) ||
      Number(price) < 1
    ) {
      setError(
        requiresDescription
          ? 'Điền tên, nhóm, mô tả và giá bán lớn hơn 0 để lưu món.'
          : 'Điền tên, nhóm và giá bán lớn hơn 0 để lưu món.',
      );
      return;
    }
    if (
      role !== 'admin' ||
      (dish && dishes.find((item) => item.id === dish.id) !== dish)
    ) {
      setError(
        'Thông tin món hoặc quyền chỉnh sửa đã thay đổi. Mở lại món để kiểm tra.',
      );
      return;
    }
    const updated: Dish = {
      id: dish?.id ?? `MON-${Date.now().toString(36)}`,
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      description: description.trim(),
      image: dish?.image,
      available,
      published,
    };
    submit(() => {
      if (dish && dish.price !== updated.price) {
        for (const booking of bookings) {
          if (
            !booking.items.some(
              (line) => line.dishId === dish.id && line.unitPrice === undefined,
            )
          )
            continue;
          updateBooking(booking.id, {
            items: booking.items.map((line) =>
              line.dishId === dish.id
                ? { ...line, unitPrice: line.unitPrice ?? dish.price }
                : line,
            ),
          });
        }
      }
      setDishes((current) =>
        dish
          ? current.map((item) => (item.id === dish.id ? updated : item))
          : [...current, updated],
      );
      onSave(
        `Đã lưu ${updated.name}. ${published ? 'Thông tin mới đã hiện trên thực đơn.' : 'Món đã ẩn khỏi thực đơn.'}`,
      );
    });
  }

  return (
    <Modal
      title={dish ? 'Chỉnh sửa món' : 'Thêm món mới'}
      onClose={onClose}
      className="ext-dish-editor"
    >
      <form className="ext-form" onSubmit={save} aria-busy={busy}>
        <Field label="Tên món">
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={90}
            required
          />
        </Field>
        <div className="ext-fields">
          <Field label="Nhóm món">
            <input
              className="input"
              list="ext-menu-categories"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              maxLength={60}
              required
            />
            <datalist id="ext-menu-categories">
              {categories.map((group) => (
                <option key={group} value={group} />
              ))}
            </datalist>
          </Field>
          <Field label="Giá bán (₫)">
            <input
              className="input"
              type="number"
              min={1}
              max={100000000}
              step={1}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </Field>
        </div>
        <Field
          label={
            requiresDescription ? 'Mô tả món' : 'Mô tả món (không bắt buộc)'
          }
        >
          <textarea
            className="input"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={300}
            required={requiresDescription}
          />
        </Field>
        <div className="ext-checks">
          <label>
            <input
              type="checkbox"
              checked={available}
              onChange={(event) => setAvailable(event.target.checked)}
            />{' '}
            Cho phép đặt trước
          </label>
          <label>
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />{' '}
            Công bố trong thực đơn
          </label>
        </div>
        {affected && (
          <Notice tone="warning">
            Thay đổi áp dụng cho lần chọn món mới. Món đã lưu vẫn có trong lượt
            đặt.
          </Notice>
        )}
        {error && <FormError>{error}</FormError>}
        <div className="ext-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Đóng
          </button>
          <button className="button" type="submit" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu món'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function VerificationForm({
  bookings,
  sample,
  onVerified,
  eligibility,
}: {
  bookings: Booking[];
  sample: { code: string; phone: string };
  onVerified: (booking: Booking) => void;
  eligibility?: (booking: Booking) => boolean;
}) {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { busy, submit } = usePreviewSubmit();

  function verify(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!isPhone(phone)) {
      setError('Số điện thoại phải có 10 chữ số và bắt đầu bằng 0.');
      return;
    }
    submit(() => {
      const booking = verifiedBooking(bookings, code, phone);
      if (!booking) {
        setError(
          'Mã đặt chỗ hoặc số điện thoại chưa đúng. Kiểm tra rồi thử lại.',
        );
      } else if (eligibility && !eligibility(booking)) {
        setError('Bạn chỉ có thể đánh giá lượt đặt đã dùng bữa.');
      } else {
        onVerified(booking);
      }
    });
  }

  return (
    <form className="ext-form" aria-busy={busy} onSubmit={verify}>
      <div className="ext-fields">
        <Field label="Mã đặt chỗ">
          <input
            className="input"
            placeholder="BAE-0000"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="off"
            maxLength={24}
            required
          />
        </Field>
        <Field label="Số điện thoại">
          <input
            className="input"
            type="tel"
            placeholder="Số đã dùng để đặt bàn"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="off"
            maxLength={13}
            required
          />
        </Field>
      </div>
      <div className="ext-demo-values">
        <span>
          Mã mẫu <strong>{sample.code}</strong> · Số điện thoại{' '}
          <strong>{sample.phone}</strong>
        </span>
        <button
          className="button tertiary"
          type="button"
          onClick={() => {
            setCode(sample.code);
            setPhone(sample.phone);
            setError('');
          }}
        >
          Dùng thông tin mẫu
        </button>
      </div>
      {error && <FormError>{error}</FormError>}
      <div className="ext-actions">
        <button className="button" type="submit" disabled={busy}>
          <ShieldCheck size={18} />
          {busy ? 'Đang tìm lượt đặt…' : 'Tìm lượt đặt'}
        </button>
      </div>
    </form>
  );
}

export function BookingLookup() {
  const { bookings } = useRestaurant();
  const { changes } = useExtensions();
  const [bookingId, setBookingId] = useState('');
  const booking = bookings.find((item) => item.id === bookingId);
  const request = changes.find((item) => item.bookingId === bookingId);

  return (
    <>
      <PublicPageIntro
        title="Tra cứu đặt chỗ"
        description="Nhập mã đặt chỗ và số điện thoại đã dùng khi đặt."
      />
      <div className="container public-page ext-page">
        {booking ? (
          <div className="ext-split">
            <Panel className="ext-card">
              <SectionTitle icon={CalendarDays} focus>
                Chi tiết đặt chỗ
              </SectionTitle>
              <Facts
                rows={[
                  [
                    'Mã đặt chỗ',
                    <span className="ext-reference">{booking.id}</span>,
                  ],
                  [
                    'Ngày và giờ',
                    `${displayDate(booking.date)} · ${booking.time}`,
                  ],
                  ['Số khách', `${booking.guests} khách`],
                  [
                    'Trạng thái đặt chỗ',
                    <Status kind="booking" value={booking.status} />,
                  ],
                  [
                    'Tiền cọc',
                    <Status kind="deposit" value={booking.deposit} />,
                  ],
                ]}
              />
              <button
                className="button tertiary ext-start-over"
                type="button"
                onClick={() => setBookingId('')}
              >
                <ArrowLeft size={16} /> Tra cứu lượt khác
              </button>
            </Panel>
            <Panel className="ext-card">
              <SectionTitle
                icon={ClipboardList}
                focus={request?.status === 'pending'}
              >
                Đổi hoặc hủy đặt chỗ
              </SectionTitle>
              {request ? (
                <Notice
                  tone={
                    request.status === 'declined'
                      ? 'warning'
                      : request.status === 'accepted'
                        ? 'success'
                        : 'info'
                  }
                >
                  <strong>
                    {request.status === 'pending'
                      ? request.kind === 'cancel'
                        ? 'Đã nhận yêu cầu hủy đặt chỗ'
                        : 'Đã nhận yêu cầu đổi đặt chỗ'
                      : DECISION_TEXT[request.status]}
                  </strong>
                  <p>
                    {request.status === 'pending'
                      ? 'Lượt đặt hiện tại vẫn có hiệu lực. Xem lại tại đây sau khi nhà hàng xử lý.'
                      : request.decisionNote || 'Nhà hàng đã phản hồi yêu cầu.'}
                  </p>
                </Notice>
              ) : canChange(booking) ? (
                <ChangeRequestForm booking={booking} />
              ) : (
                <Notice tone="warning">
                  Lượt đặt này hiện không thể đổi hoặc hủy.
                </Notice>
              )}
            </Panel>
          </div>
        ) : (
          <Panel className="ext-card ext-narrow">
            <SectionTitle icon={ShieldCheck}>Thông tin tra cứu</SectionTitle>
            <VerificationForm
              bookings={bookings}
              sample={{ code: 'BAE-1042', phone: '0900000042' }}
              onVerified={(verified) => setBookingId(verified.id)}
            />
          </Panel>
        )}
      </div>
    </>
  );
}

function ChangeRequestForm({ booking }: { booking: Booking }) {
  const { setChanges } = useExtensions();
  const [kind, setKind] = useState<ChangeRequest['kind']>('reschedule');
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState(booking.time);
  const [guests, setGuests] = useState(String(booking.guests));
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const { busy, submit } = usePreviewSubmit();

  function send(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (reason.trim().length < 5) {
      setError('Lý do cần ít nhất 5 ký tự.');
      return;
    }
    if (
      kind === 'reschedule' &&
      date === booking.date &&
      time === booking.time &&
      Number(guests) === booking.guests
    ) {
      setError('Chọn ngày, giờ hoặc số khách mới trước khi gửi.');
      return;
    }
    submit(() =>
      setChanges((current) =>
        current.some((request) => request.bookingId === booking.id)
          ? current
          : [
              ...current,
              {
                bookingId: booking.id,
                kind,
                date,
                time,
                guests: Number(guests),
                reason: reason.trim(),
                status: 'pending',
              },
            ],
      ),
    );
  }

  return (
    <form className="ext-form" onSubmit={send} aria-busy={busy}>
      <Field label="Loại yêu cầu">
        <select
          className="input"
          value={kind}
          onChange={(event) =>
            setKind(event.target.value as ChangeRequest['kind'])
          }
        >
          <option value="reschedule">Đổi thông tin đặt chỗ</option>
          <option value="cancel">Hủy đặt chỗ</option>
        </select>
      </Field>
      {kind === 'reschedule' && (
        <SlotFields
          date={date}
          setDate={setDate}
          time={time}
          setTime={setTime}
          guests={guests}
          setGuests={setGuests}
          maxGuests={MAX_EVENT_GUESTS}
        />
      )}
      <Field label="Lý do">
        <textarea
          className="input"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={300}
          aria-describedby="ext-change-reason-help"
          required
        />
      </Field>
      <p className="ext-muted" id="ext-change-reason-help">
        Nhập ít nhất 5 ký tự.
      </p>
      <p className="ext-muted">
        Nhà hàng sẽ xem xét yêu cầu trước khi đổi hoặc hủy chỗ.
      </p>
      {error && <FormError>{error}</FormError>}
      <div className="ext-actions">
        <button className="button" type="submit" disabled={busy}>
          {busy ? 'Đang gửi…' : 'Gửi yêu cầu'}
          <ArrowRight size={17} />
        </button>
      </div>
    </form>
  );
}

export function ChangeBooking() {
  const { id } = useParams();
  const { bookings, role, updateBooking } = useRestaurant();
  const { changes, setChanges } = useExtensions();
  const [decisionNote, setDecisionNote] = useState('');
  const [error, setError] = useState('');
  const { busy, submit } = usePreviewSubmit();
  const booking = bookings.find((item) => item.id === id);
  const request = changes.find((item) => item.bookingId === id);
  const detailUrl = booking
    ? `/van-hanh/dat-cho/${booking.id}`
    : '/van-hanh/dat-cho';

  if (role !== 'admin') return <PreviewAccess staff />;
  if (!booking)
    return (
      <Empty
        title="Không tìm thấy lượt đặt"
        action={
          <Link className="button secondary" to={detailUrl}>
            Về danh sách đặt chỗ
          </Link>
        }
      />
    );

  const reschedule = request?.kind === 'reschedule';
  const changeAllowed = canChange(booking);
  const depositBlocked =
    booking.deposit === 'review' || booking.deposit === 'exception';
  const depositUrl = `/van-hanh/dat-coc?id=${encodeURIComponent(booking.id)}`;

  function decide(decision: Exclude<Decision, 'pending'>) {
    if (!booking || !request || request.status !== 'pending') return;
    setError('');
    const note = decisionNote.trim();
    if (!note) {
      setError('Nhập lý do để thông báo cho khách.');
      return;
    }
    if (decision === 'declined') {
      submit(() => {
        setChanges((current) =>
          current.map((item) =>
            item === request
              ? { ...item, status: decision, decisionNote: note }
              : item,
          ),
        );
        updateBooking(
          booking.id,
          {},
          `Từ chối yêu cầu ${reschedule ? 'đổi' : 'hủy'} lượt đặt. ${note}`,
        );
      });
      return;
    }
    if (!canChange(booking)) {
      setError('Lượt đặt đã hết hạn hoặc không thể thay đổi.');
      return;
    }
    if (depositBlocked) {
      setError('Đối chiếu tiền cọc trước khi thay đổi lượt đặt.');
      return;
    }
    let next: Partial<Booking> = {
      status: 'cancelled',
      tables: [],
      kitchenChanged: booking.items.length > 0,
    };
    const depositFollowUp = !reschedule && booking.deposit === 'verified';
    if (reschedule) {
      const freeTables = availableTables(
        bookings,
        request.date,
        request.time,
        booking.id,
      );
      const retained = freeTables.filter((table) =>
        booking.tables.includes(table.id),
      );
      const remaining = freeTables
        .filter((table) => !booking.tables.includes(table.id))
        .sort((a, b) => b.seats - a.seats);
      const selected = [...retained];
      let seats = retained.reduce((sum, table) => sum + table.seats, 0);
      for (const table of remaining) {
        if (seats >= request.guests) break;
        selected.push(table);
        seats += table.seats;
      }
      if (seats < request.guests) {
        setError(
          `Khung ${request.time} ngày ${displayDate(request.date)} chỉ còn ${seats} chỗ. Bàn hiện tại vẫn được giữ.`,
        );
        return;
      }
      next = {
        date: request.date,
        time: request.time,
        guests: request.guests,
        tables: selected.map((item) => item.id),
        kitchenChanged: booking.items.length > 0,
      };
    } else if (depositFollowUp) {
      next.deposit = 'exception';
    } else if (booking.deposit === 'pending') {
      next.deposit = 'expired';
    }
    const history = `Chấp nhận yêu cầu ${reschedule ? 'đổi' : 'hủy'} lượt đặt. ${note}${depositFollowUp ? ' Thu ngân cần xử lý khoản cọc đã nhận.' : ''}`;
    submit(() => {
      updateBooking(booking.id, next, history);
      setChanges((current) =>
        current.map((item) =>
          item === request
            ? { ...item, status: decision, decisionNote: note, depositFollowUp }
            : item,
        ),
      );
    });
  }

  return (
    <div className="ext-page">
      <Link className="button tertiary ext-back" to={detailUrl}>
        <ArrowLeft size={17} /> Chi tiết {booking.id}
      </Link>
      <PageHead
        eyebrow={PREVIEW.optional}
        title="Quyết định đổi hoặc hủy"
        description={`Xem yêu cầu của lượt ${booking.id}.`}
      />
      {!request ? (
        <Empty
          title="Chưa có yêu cầu đổi hoặc hủy"
          description="Yêu cầu của khách sẽ hiện tại đây sau khi xác minh."
          action={
            <Link className="button secondary" to="/tra-cuu-dat-cho">
              Mở tra cứu đặt chỗ <ArrowRight size={16} />
            </Link>
          }
        />
      ) : (
        <div className="ext-split">
          <Panel className="ext-card">
            <SectionTitle icon={CalendarDays}>Lượt đặt hiện hành</SectionTitle>
            <Facts
              rows={[
                [
                  'Ngày và giờ',
                  `${displayDate(booking.date)} · ${booking.time}`,
                ],
                ['Số khách', `${booking.guests} khách`],
                [
                  'Bố trí',
                  booking.tables.length
                    ? booking.tables.join(', ')
                    : 'Chưa phân bàn',
                ],
                [
                  'Tình trạng đặt chỗ',
                  <Status kind="booking" value={booking.status} />,
                ],
                ['Cọc', <Status kind="deposit" value={booking.deposit} />],
              ]}
            />
            {request.status === 'pending' && (
              <div className="ext-subsection">
                <SectionTitle icon={ClipboardList}>
                  Thay đổi nếu chấp nhận
                </SectionTitle>
                <Facts
                  rows={[
                    [
                      'Bàn',
                      reschedule
                        ? 'Kiểm tra lại sức chứa và phân bàn theo khung mới.'
                        : 'Giải phóng bàn của lượt đặt.',
                    ],
                    [
                      'Món',
                      booking.items.length === 0
                        ? 'Lượt đặt chưa có món đặt trước.'
                        : reschedule
                          ? 'Giữ các món đã đặt và đánh dấu thay đổi cho bếp.'
                          : 'Các món vẫn có trong chi tiết lượt đặt để đối chiếu. Lượt hủy sẽ rời danh sách chuẩn bị bếp.',
                    ],
                    [
                      'Cọc',
                      reschedule
                        ? 'Giữ thông tin khoản cọc của lượt đặt.'
                        : booking.deposit === 'verified'
                          ? 'Thu ngân sẽ đối chiếu khoản cọc đã nhận.'
                          : booking.deposit === 'pending'
                            ? 'Yêu cầu chuyển cọc sẽ hết hiệu lực.'
                            : 'Kiểm tra trạng thái cọc trước khi xác nhận.',
                    ],
                  ]}
                />
              </div>
            )}
          </Panel>
          <Panel className="ext-card">
            <SectionTitle
              icon={request.kind === 'cancel' ? ClipboardList : CalendarRange}
            >
              {request.kind === 'cancel' ? 'Yêu cầu hủy' : 'Yêu cầu đổi'}
            </SectionTitle>
            <Badge
              tone={
                request.status === 'declined'
                  ? 'warning'
                  : request.status === 'accepted'
                    ? 'success'
                    : 'info'
              }
            >
              {DECISION_TEXT[request.status]}
            </Badge>
            <Facts
              rows={[
                ...(reschedule
                  ? ([
                      [
                        'Khung đề xuất',
                        `${displayDate(request.date)} · ${request.time}`,
                      ],
                      ['Số khách đề xuất', `${request.guests} khách`],
                    ] as [string, ReactNode][])
                  : []),
                ['Lý do của khách', request.reason],
              ]}
            />
            {request.status === 'pending' ? (
              <form
                className="ext-form"
                aria-busy={busy}
                onSubmit={(event) => {
                  event.preventDefault();
                  decide('accepted');
                }}
              >
                {!changeAllowed ? (
                  <Notice tone="warning">
                    Lượt đặt đã hết hạn hoặc không còn đủ điều kiện thay đổi.
                  </Notice>
                ) : depositBlocked ? (
                  <Notice tone="warning">
                    Cần đối chiếu cọc trước khi chấp nhận yêu cầu.
                    <p>
                      <Link to={depositUrl}>Mở đối chiếu cọc</Link>
                    </p>
                  </Notice>
                ) : null}
                <Field label="Lý do quyết định">
                  <textarea
                    className="input"
                    rows={3}
                    value={decisionNote}
                    onChange={(event) => setDecisionNote(event.target.value)}
                    maxLength={300}
                    required
                  />
                </Field>
                {error && <FormError>{error}</FormError>}
                <div className="ext-actions ext-actions-split">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => decide('declined')}
                    disabled={busy}
                  >
                    Từ chối
                  </button>
                  <button
                    className="button"
                    type="submit"
                    disabled={busy || depositBlocked || !changeAllowed}
                  >
                    {busy ? 'Đang lưu…' : 'Chấp nhận yêu cầu'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <Notice
                  tone={request.status === 'accepted' ? 'success' : 'info'}
                >
                  <strong>Đã lưu quyết định</strong>
                  <p>{request.decisionNote}</p>
                </Notice>
                {request.depositFollowUp && booking.deposit === 'exception' && (
                  <Notice tone="warning">
                    Tiền cọc đã nhận đang chờ đối chiếu.
                    <p>
                      <Link to={depositUrl}>Mở đối chiếu cọc</Link>
                    </p>
                  </Notice>
                )}
              </>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

export function EventRequest() {
  const { events, setEvents, eventReceiptId, setEventReceiptId } =
    useExtensions();
  const [date, setDate] = useState(DEMO_DATE);
  const [time, setTime] = useState(DEFAULT_EVENT_TIME);
  const [guests, setGuests] = useState(String(MIN_EVENT_GUESTS));
  const [kind, setKind] = useState('');
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<{
    message: string;
    field?: 'note' | 'name' | 'phone';
  } | null>(null);
  const { busy, submit } = usePreviewSubmit();
  const result = events.find((item) => item.id === eventReceiptId);
  const summaryDate = result?.date ?? date;
  const summaryGuests = result?.guests ?? guests;

  function send(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (note.trim().length < 5) {
      setError({
        field: 'note',
        message: 'Nhập yêu cầu về buổi tiệc từ 5 ký tự.',
      });
      return;
    }
    if (name.trim().length < 2) {
      setError({ field: 'name', message: 'Nhập họ và tên từ 2 ký tự.' });
      return;
    }
    if (!isPhone(phone)) {
      setError({
        field: 'phone',
        message: 'Nhập số điện thoại có 10 chữ số và bắt đầu bằng 0.',
      });
      return;
    }
    if (
      events.some(
        (item) =>
          item.date === date &&
          item.time === time &&
          item.phone === phone.trim() &&
          item.status !== 'declined',
      )
    ) {
      setError({
        message:
          'Bạn đã gửi yêu cầu cho giờ này. Dùng mã đã nhận khi liên hệ nhà hàng.',
      });
      return;
    }
    const id = `TIEC-${2001 + events.length}`;
    const draft: EventRequestData = {
      id,
      date,
      time,
      guests: Number(guests),
      kind,
      note: note.trim(),
      name: name.trim(),
      phone: phone.trim(),
      status: 'pending',
    };
    submit(() => {
      setEvents((current) => [draft, ...current]);
      setEventReceiptId(id);
      setName('');
      setPhone('');
    });
  }

  return (
    <>
      <PublicPageIntro
        title="Đặt tiệc"
        description="Gửi ngày, giờ và số khách để nhà hàng kiểm tra chỗ."
      />
      <div className="container public-page ext-page">
        <div className="ext-split ext-form-split">
          <Panel className="ext-card">
            {result ? (
              <div className="ext-result" role="status">
                <span className="ext-result-icon">
                  <CheckCircle2 size={27} aria-hidden="true" />
                </span>
                <div>
                  <SectionTitle focus>Đã nhận yêu cầu đặt tiệc</SectionTitle>
                  <p className="ext-muted">
                    Lưu mã yêu cầu để liên hệ khi cần.
                  </p>
                </div>
                <Facts
                  rows={[
                    [
                      'Mã yêu cầu',
                      <span className="ext-reference">{result.id}</span>,
                    ],
                    [
                      'Trạng thái',
                      <Badge
                        tone={
                          result.status === 'accepted'
                            ? 'success'
                            : result.status === 'declined'
                              ? 'warning'
                              : 'info'
                        }
                      >
                        {EVENT_STATUS[result.status]}
                      </Badge>,
                    ],
                    [
                      'Phản hồi',
                      result.status === 'pending'
                        ? 'Nhà hàng sẽ gọi lại theo số bạn cung cấp.'
                        : result.decisionNote,
                    ],
                  ]}
                />
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setEventReceiptId('')}
                >
                  Gửi yêu cầu khác
                </button>
              </div>
            ) : (
              <form className="ext-form" aria-busy={busy} onSubmit={send}>
                <SectionTitle icon={CalendarRange}>
                  Thông tin buổi tiệc
                </SectionTitle>
                <SlotFields
                  date={date}
                  setDate={setDate}
                  time={time}
                  setTime={setTime}
                  guests={guests}
                  setGuests={setGuests}
                  minGuests={MIN_EVENT_GUESTS}
                  maxGuests={MAX_EVENT_GUESTS}
                />
                <p className="ext-muted">
                  Từ {MIN_EVENT_GUESTS} đến {MAX_EVENT_GUESTS} khách mỗi khung
                  giờ.
                </p>
                {Number(guests) > MAX_EVENT_GUESTS && (
                  <Notice tone="warning">
                    Một khung giờ nhận tối đa {MAX_EVENT_GUESTS} khách.
                  </Notice>
                )}
                <Field label="Dịp tổ chức">
                  <select
                    className="input"
                    value={kind}
                    onChange={(event) => setKind(event.target.value)}
                    required
                  >
                    <option value="">Chọn dịp</option>
                    {EVENT_KINDS.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Yêu cầu về buổi tiệc">
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="Ví dụ: Nhóm có 2 khách ăn chay"
                    value={note}
                    onChange={(event) => {
                      setNote(event.target.value);
                      if (error?.field === 'note') setError(null);
                    }}
                    maxLength={500}
                    aria-invalid={error?.field === 'note' || undefined}
                    aria-describedby={
                      error?.field === 'note' ? 'ext-event-error' : undefined
                    }
                    required
                  />
                </Field>
                <div className="ext-subsection">
                  <SectionTitle>Thông tin liên hệ</SectionTitle>
                  <div className="ext-fields">
                    <Field label="Họ và tên">
                      <input
                        className="input"
                        name="name"
                        autoComplete="name"
                        value={name}
                        onChange={(event) => {
                          setName(event.target.value);
                          if (error?.field === 'name') setError(null);
                        }}
                        maxLength={80}
                        aria-invalid={error?.field === 'name' || undefined}
                        aria-describedby={
                          error?.field === 'name'
                            ? 'ext-event-error'
                            : undefined
                        }
                        required
                      />
                    </Field>
                    <Field label="Số điện thoại">
                      <input
                        className="input"
                        type="tel"
                        name="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(event) => {
                          setPhone(event.target.value);
                          if (error?.field === 'phone') setError(null);
                        }}
                        maxLength={13}
                        aria-invalid={error?.field === 'phone' || undefined}
                        aria-describedby={
                          error?.field === 'phone'
                            ? 'ext-event-error'
                            : undefined
                        }
                        required
                      />
                    </Field>
                  </div>
                </div>
                {error && (
                  <FormError id="ext-event-error">{error.message}</FormError>
                )}
                <div className="ext-actions">
                  <button className="button" type="submit" disabled={busy}>
                    {busy ? 'Đang gửi…' : 'Gửi yêu cầu tiệc'}
                    <ArrowRight size={17} />
                  </button>
                </div>
              </form>
            )}
          </Panel>
          <Panel className="ext-card ext-summary">
            <SectionTitle icon={ClipboardList}>Tóm tắt yêu cầu</SectionTitle>
            <div className="ext-summary-list">
              <p>
                <CalendarDays size={18} aria-hidden="true" />
                <span>
                  {summaryDate ? displayDate(summaryDate) : 'Chưa chọn ngày'}
                </span>
              </p>
              <p>
                <Clock3 size={18} aria-hidden="true" />
                <span>{result?.time ?? time}</span>
              </p>
              <p>
                <Users size={18} aria-hidden="true" />
                <span>
                  {summaryGuests
                    ? `${summaryGuests} khách`
                    : 'Chưa nhập số khách'}
                </span>
              </p>
              <p>
                <Utensils size={18} aria-hidden="true" />
                <span>{(result?.kind ?? kind) || 'Chưa chọn dịp'}</span>
              </p>
            </div>
            <Notice tone="info">Nhà hàng sẽ liên hệ trước khi giữ bàn.</Notice>
          </Panel>
        </div>
      </div>
    </>
  );
}

function useQueueSelection() {
  const [selectedId, setSelectedId] = useState('');
  const backButton = useRef<HTMLButtonElement>(null);
  const currentRow = useRef<HTMLButtonElement>(null);
  const filterControl = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    if (selectedId) backButton.current?.focus();
    else if (currentRow.current) {
      const target = currentRow.current.isConnected
        ? currentRow.current
        : filterControl.current;
      target?.focus();
    }
  }, [selectedId]);

  return {
    selectedId,
    backButton,
    filterControl,
    select(id: string, row?: HTMLButtonElement) {
      if (row) currentRow.current = row;
      setSelectedId(id);
    },
  };
}

function QueueItem({
  selected,
  onClick,
  title,
  subtitle,
  meta,
  state,
  controls,
}: {
  selected: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
  title: string;
  subtitle: string;
  meta: string;
  state: ReactNode;
  controls: string;
}) {
  return (
    <li>
      <button
        className="ext-queue-item"
        type="button"
        aria-pressed={selected}
        aria-controls={controls}
        onClick={onClick}
      >
        <span className="ext-queue-copy">
          <strong>{title}</strong>
          <span>{subtitle}</span>
          <small>{meta}</small>
        </span>
        <span className="ext-queue-state">
          {state}
          <ArrowRight size={17} aria-hidden="true" />
        </span>
      </button>
    </li>
  );
}

export function EventOperations() {
  const { bookings, role } = useRestaurant();
  const { events } = useExtensions();
  const [filter, setFilter] = useState('all');
  const { selectedId, select, backButton, filterControl } = useQueueSelection();
  const selected = events.find((item) => item.id === selectedId);
  const entries = events.filter(
    (item) => filter === 'all' || item.status === filter,
  );

  if (role !== 'admin') return <PreviewAccess staff />;

  return (
    <div className="ext-page">
      <PageHead
        eyebrow={PREVIEW.advanced}
        title="Yêu cầu đặt tiệc"
        description="Kiểm tra số chỗ còn trống trước khi trả lời yêu cầu."
      />
      <div className={`ext-queue-layout${selected ? ' ext-detail-open' : ''}`}>
        <Panel className="ext-card ext-queue-list">
          <SectionTitle icon={CalendarRange}>Danh sách yêu cầu</SectionTitle>
          <Field label="Lọc theo tình trạng">
            <select
              className="input"
              ref={filterControl}
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                select('');
              }}
            >
              <option value="all">Tất cả yêu cầu</option>
              {Object.entries(EVENT_STATUS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          {entries.length ? (
            <ul className="ext-queue">
              {entries.map((item) => (
                <QueueItem
                  key={item.id}
                  selected={selected?.id === item.id}
                  onClick={(event) => select(item.id, event.currentTarget)}
                  title={item.kind}
                  subtitle={`${displayDate(item.date)} · ${item.time} · ${item.guests} khách`}
                  meta={item.id}
                  controls="ext-event-detail"
                  state={
                    <Badge
                      tone={
                        item.status === 'accepted'
                          ? 'success'
                          : item.status === 'declined'
                            ? 'warning'
                            : 'info'
                      }
                    >
                      {EVENT_STATUS[item.status]}
                    </Badge>
                  }
                />
              ))}
            </ul>
          ) : (
            <Empty
              title="Chưa có yêu cầu ở tình trạng này"
              description="Chọn tình trạng khác để xem yêu cầu."
            />
          )}
        </Panel>
        <div className="panel ext-card ext-queue-detail" id="ext-event-detail">
          {selected ? (
            <>
              <button
                className="button tertiary ext-queue-back"
                type="button"
                ref={backButton}
                onClick={() => select('')}
              >
                <ArrowLeft size={17} /> Danh sách yêu cầu
              </button>
              <EventDetail
                key={selected.id}
                item={selected}
                bookings={bookings}
              />
            </>
          ) : (
            <Empty
              title="Chọn một yêu cầu"
              description="Chọn một mục trong danh sách để xem chi tiết."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EventDetail({
  item,
  bookings,
}: {
  item: EventRequestData;
  bookings: Booking[];
}) {
  const { setEvents } = useExtensions();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const { busy, submit } = usePreviewSubmit();
  const free = availableTables(bookings, item.date, item.time);
  const seats = free.reduce((sum, table) => sum + table.seats, 0);
  const conflict = seats < item.guests;

  function decide(decision: Exclude<Decision, 'pending'>) {
    setError('');
    if (!note.trim()) {
      setError('Nhập kết quả và cách liên hệ tiếp theo.');
      return;
    }
    if (decision === 'accepted' && conflict) {
      setError(
        'Khung giờ này không đủ chỗ. Kiểm tra các lượt đã đặt trước khi trả lời.',
      );
      return;
    }
    submit(() =>
      setEvents((current) =>
        current.map((entry) =>
          entry.id === item.id && entry.status === 'pending'
            ? { ...entry, status: decision, decisionNote: note.trim() }
            : entry,
        ),
      ),
    );
  }

  return (
    <>
      <div className="ext-detail-head">
        <div>
          <span className="ext-reference">{item.id}</span>
          <SectionTitle>{item.kind}</SectionTitle>
        </div>
        <Badge
          tone={
            item.status === 'accepted'
              ? 'success'
              : item.status === 'declined'
                ? 'warning'
                : 'info'
          }
        >
          {EVENT_STATUS[item.status]}
        </Badge>
      </div>
      <Facts
        rows={[
          ['Khung dự kiến', `${displayDate(item.date)} · ${item.time}`],
          ['Quy mô', `${item.guests} khách`],
          ['Nhu cầu', item.note],
          ['Liên hệ', `${item.name} · ${item.phone}`],
        ]}
      />
      {item.status === 'pending' ? (
        <form
          className="ext-form"
          aria-busy={busy}
          onSubmit={(event) => {
            event.preventDefault();
            decide('accepted');
          }}
        >
          <Notice tone={conflict ? 'warning' : 'info'}>
            <strong>{conflict ? 'Không đủ chỗ' : 'Còn đủ chỗ'}</strong>
            <p>
              {seats} chỗ còn trống trong khung này. Yêu cầu có {item.guests}{' '}
              khách.
            </p>
          </Notice>
          <Field label="Nội dung quyết định">
            <textarea
              className="input"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ghi rõ bước liên hệ tiếp theo"
              maxLength={300}
              required
            />
          </Field>
          {error && <FormError>{error}</FormError>}
          <div className="ext-actions ext-actions-split">
            <button
              type="button"
              className="button secondary"
              onClick={() => decide('declined')}
              disabled={busy}
            >
              Không thể tiếp nhận
            </button>
            <button
              className="button"
              type="submit"
              disabled={busy || conflict}
            >
              {busy ? 'Đang lưu…' : 'Ghi nhận có thể tổ chức'}
            </button>
          </div>
        </form>
      ) : (
        <Notice tone={item.status === 'accepted' ? 'success' : 'info'}>
          <strong>Đã lưu quyết định</strong>
          <p>{item.decisionNote}</p>
          {item.status === 'accepted' && (
            <p>Liên hệ khách để chốt phương án và xác nhận bàn.</p>
          )}
        </Notice>
      )}
    </>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="ext-stars" role="img" aria-label={`${rating} trên 5 sao`}>
      {RATING_LABELS.map((label, index) => (
        <Star
          key={label}
          size={16}
          aria-hidden="true"
          fill={index < rating ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

export function ReviewForm() {
  const { bookings } = useRestaurant();
  const { reviews } = useExtensions();
  const [bookingId, setBookingId] = useState('');
  const submitted = reviews.find((item) => item.bookingId === bookingId);
  const published = reviews.filter((item) => item.status === 'published');

  return (
    <>
      <PublicPageIntro
        title="Đánh giá nhà hàng"
        description="Bạn có thể gửi một đánh giá cho mỗi lượt đã dùng bữa."
      />
      <div className="container public-page ext-page">
        <Panel className="ext-card ext-review-main">
          {!bookingId ? (
            <>
              <SectionTitle icon={ShieldCheck}>Thông tin đặt chỗ</SectionTitle>
              <VerificationForm
                bookings={bookings}
                sample={{ code: 'BAE-1038', phone: '0900000038' }}
                eligibility={(booking) => booking.status === 'completed'}
                onVerified={(booking) => setBookingId(booking.id)}
              />
            </>
          ) : submitted ? (
            <div className="ext-result" role="status">
              <span className="ext-result-icon">
                <CheckCircle2 size={27} aria-hidden="true" />
              </span>
              <div>
                <SectionTitle focus>Đã nhận đánh giá</SectionTitle>
                <p className="ext-muted">
                  Bạn có thể xem trạng thái đánh giá tại đây.
                </p>
              </div>
              <Facts
                rows={[
                  [
                    'Mã đánh giá',
                    <span className="ext-reference">{submitted.id}</span>,
                  ],
                  [
                    'Trạng thái',
                    <Badge
                      tone={
                        submitted.status === 'published'
                          ? 'success'
                          : submitted.status === 'declined'
                            ? 'warning'
                            : 'info'
                      }
                    >
                      {REVIEW_STATUS[submitted.status]}
                    </Badge>,
                  ],
                  ...(submitted.status === 'declined' &&
                  submitted.moderationNote
                    ? [
                        ['Lý do', submitted.moderationNote] as [
                          string,
                          ReactNode,
                        ],
                      ]
                    : []),
                ]}
              />
            </div>
          ) : (
            <ReviewEditor bookingId={bookingId} />
          )}
          {bookingId && (
            <button
              className="button tertiary ext-start-over"
              type="button"
              onClick={() => setBookingId('')}
            >
              <ArrowLeft size={16} /> Dùng mã đặt chỗ khác
            </button>
          )}
        </Panel>
        <section className="ext-published" aria-labelledby="ext-public-reviews">
          <h2 id="ext-public-reviews" className="ext-section-title">
            Đánh giá từ khách
          </h2>
          {published.length ? (
            <div className="ext-published-list">
              {published.map((item) => (
                <Panel className="ext-card ext-quote" key={item.id}>
                  <Stars rating={item.rating} />
                  <blockquote>{item.comment}</blockquote>
                  <small>Khách đã dùng bữa</small>
                </Panel>
              ))}
            </div>
          ) : (
            <Empty title="Chưa có đánh giá công khai" />
          )}
        </section>
      </div>
    </>
  );
}

function ReviewEditor({ bookingId }: { bookingId: string }) {
  const { reviews, setReviews } = useExtensions();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const { busy, submit } = usePreviewSubmit();

  function send(event: FormEvent) {
    event.preventDefault();
    setError('');
    const content = comment.trim();
    if (!rating || content.length < 12) {
      setError('Chọn số sao và viết nhận xét ít nhất 12 ký tự.');
      return;
    }
    if (
      /\b(?:https?:\/\/|www\.)|\b0\d{9}\b|\b[\w.+-]+@[\w.-]+\.\w{2,}\b/i.test(
        content,
      )
    ) {
      setError(
        'Xóa đường dẫn, số điện thoại hoặc email trong nhận xét rồi gửi lại.',
      );
      return;
    }
    const review: Review = {
      id: `DG-${3001 + reviews.length}`,
      bookingId,
      rating,
      comment: content,
      status: 'pending',
    };
    submit(() =>
      setReviews((current) =>
        current.some((entry) => entry.bookingId === bookingId)
          ? current
          : [review, ...current],
      ),
    );
  }

  return (
    <form className="ext-form" aria-busy={busy} onSubmit={send}>
      <SectionTitle icon={Star} focus>
        Viết đánh giá
      </SectionTitle>
      <fieldset className="ext-rating">
        <legend>Số sao</legend>
        <div>
          {RATING_LABELS.map((label, index) => (
            <label
              className={rating >= index + 1 ? 'ext-rating-active' : ''}
              key={label}
              title={label}
            >
              <input
                className="ext-sr-only"
                type="radio"
                name="rating"
                value={index + 1}
                checked={rating === index + 1}
                onChange={() => setRating(index + 1)}
                required
              />
              <span>
                <Star
                  size={24}
                  fill={rating >= index + 1 ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
                <span className="ext-sr-only">
                  {index + 1} sao · {label}
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="ext-muted">
          {rating
            ? `${rating}/5 · ${RATING_LABELS[rating - 1]}`
            : 'Chọn từ 1 đến 5 sao.'}
        </p>
      </fieldset>
      <Field label="Nhận xét">
        <textarea
          className="input"
          rows={5}
          maxLength={500}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            if (error) setError('');
          }}
          placeholder="Ví dụ: Món lên nóng, nhưng đợi hơi lâu."
          aria-describedby={
            error
              ? 'ext-review-comment-help ext-review-comment-error'
              : 'ext-review-comment-help'
          }
          aria-invalid={Boolean(error) || undefined}
          required
        />
      </Field>
      <p className="ext-muted" id="ext-review-comment-help">
        Từ 12 ký tự. Nhà hàng sẽ duyệt đánh giá trước khi đăng.
      </p>
      {error && <FormError id="ext-review-comment-error">{error}</FormError>}
      <div className="ext-actions">
        <button className="button" type="submit" disabled={busy}>
          {busy ? 'Đang gửi…' : 'Gửi đánh giá'}
          <ArrowRight size={17} />
        </button>
      </div>
    </form>
  );
}

export function ReviewOperations() {
  const { role } = useRestaurant();
  const { reviews } = useExtensions();
  const [filter, setFilter] = useState('pending');
  const { selectedId, select, backButton, filterControl } = useQueueSelection();
  const selected = reviews.find((item) => item.id === selectedId);
  const entries = reviews.filter(
    (item) => filter === 'all' || item.status === filter,
  );

  if (role !== 'admin') return <PreviewAccess staff />;

  return (
    <div className="ext-page">
      <PageHead
        eyebrow={PREVIEW.advanced}
        title="Quản lý đánh giá"
        description="Duyệt đánh giá của khách trước khi hiển thị công khai."
      />
      <div className={`ext-queue-layout${selected ? ' ext-detail-open' : ''}`}>
        <Panel className="ext-card ext-queue-list">
          <SectionTitle icon={Star}>Danh sách đánh giá</SectionTitle>
          <Field label="Lọc theo tình trạng">
            <select
              className="input"
              ref={filterControl}
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                select('');
              }}
            >
              <option value="all">Tất cả đánh giá</option>
              {Object.entries(REVIEW_STATUS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          {entries.length ? (
            <ul className="ext-queue">
              {entries.map((item) => (
                <QueueItem
                  key={item.id}
                  selected={selected?.id === item.id}
                  onClick={(event) => select(item.id, event.currentTarget)}
                  title={item.id}
                  subtitle={`${item.rating}/5 · ${RATING_LABELS[item.rating - 1]}`}
                  meta={item.bookingId}
                  controls="ext-review-detail"
                  state={
                    <Badge
                      tone={
                        item.status === 'published'
                          ? 'success'
                          : item.status === 'declined'
                            ? 'warning'
                            : 'info'
                      }
                    >
                      {REVIEW_STATUS[item.status]}
                    </Badge>
                  }
                />
              ))}
            </ul>
          ) : (
            <Empty
              title={
                filter === 'pending'
                  ? 'Không có đánh giá chờ duyệt'
                  : 'Chưa có đánh giá ở tình trạng này'
              }
              description="Đổi bộ lọc để xem các đánh giá khác."
            />
          )}
        </Panel>
        <div className="panel ext-card ext-queue-detail" id="ext-review-detail">
          {selected ? (
            <>
              <button
                className="button tertiary ext-queue-back"
                type="button"
                ref={backButton}
                onClick={() => select('')}
              >
                <ArrowLeft size={17} /> Danh sách đánh giá
              </button>
              <ReviewDetail key={selected.id} item={selected} />
            </>
          ) : (
            <Empty
              title="Chọn một đánh giá"
              description="Chọn một mục trong danh sách để xem nội dung."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewDetail({ item }: { item: Review }) {
  const { setReviews } = useExtensions();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const { busy, submit } = usePreviewSubmit();

  function moderate(status: Exclude<Review['status'], 'pending'>) {
    setError('');
    if (status === 'declined' && !note.trim()) {
      setError('Nhập lý do từ chối để thông báo cho khách.');
      return;
    }
    submit(() =>
      setReviews((current) =>
        current.map((entry) =>
          entry.id === item.id && entry.status === 'pending'
            ? { ...entry, status, moderationNote: note.trim() }
            : entry,
        ),
      ),
    );
  }

  return (
    <>
      <div className="ext-detail-head">
        <div>
          <span className="ext-reference">{item.id}</span>
          <SectionTitle>Nội dung đánh giá</SectionTitle>
        </div>
        <Badge
          tone={
            item.status === 'published'
              ? 'success'
              : item.status === 'declined'
                ? 'warning'
                : 'info'
          }
        >
          {REVIEW_STATUS[item.status]}
        </Badge>
      </div>
      <Facts
        rows={[
          ['Lượt đã phục vụ', item.bookingId],
          [
            'Điểm đánh giá',
            <span className="ext-rating-summary">
              <Stars rating={item.rating} /> {item.rating}/5
            </span>,
          ],
          ['Nhận xét', item.comment],
        ]}
      />
      {item.status === 'pending' ? (
        <form
          className="ext-form"
          aria-busy={busy}
          onSubmit={(event) => {
            event.preventDefault();
            moderate('published');
          }}
        >
          <Notice tone="info">
            Khi công bố, số sao và nhận xét sẽ hiện công khai. Nếu từ chối,
            khách sẽ thấy lý do.
          </Notice>
          <Field label="Lý do nếu từ chối">
            <textarea
              className="input"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={300}
            />
          </Field>
          {error && <FormError>{error}</FormError>}
          <div className="ext-actions ext-actions-split">
            <button
              type="button"
              className="button secondary"
              onClick={() => moderate('declined')}
              disabled={busy}
            >
              Từ chối công bố
            </button>
            <button className="button" type="submit" disabled={busy}>
              {busy ? 'Đang lưu…' : 'Công bố đánh giá'}
            </button>
          </div>
        </form>
      ) : (
        <Notice tone={item.status === 'published' ? 'success' : 'info'}>
          <strong>Đã lưu quyết định</strong>
          <p>
            {item.status === 'published'
              ? 'Khách có thể xem nội dung trên trang đánh giá.'
              : item.moderationNote}
          </p>
        </Notice>
      )}
    </>
  );
}
