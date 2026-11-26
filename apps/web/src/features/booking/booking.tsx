import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  CreditCard,
  Minus,
  Plus,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { DishDetails } from '../menu/catalog';
import { useRestaurant } from '../../app/restaurant-context';
import {
  bookingApi,
  bookingUsesApi,
  type NewBooking,
  type SavedBooking,
} from '../../services/booking-api';
import { ApiServiceError } from '../../services/contracts';
import {
  availableTimes,
  bookingOpen,
  DEPOSIT_AMOUNT,
  DEMO_DATE,
  displayDate,
  MAX_DISH_QUANTITY,
  money,
  preparePreorder,
  type Booking,
  type BookingDraft,
  type Dish,
  type OrderLine,
} from '../../shared/model';
import {
  Badge,
  DishImage,
  Empty,
  Loading,
  Notice,
  PageHead,
  Panel,
  PublicPageIntro,
  Status,
} from '../../shared/ui';

function useMockAction(delay = 440) {
  const timer = useRef<number | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function run(action: () => void | Promise<void>) {
    if (timer.current !== undefined) return;
    setBusy(true);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      void Promise.resolve(action()).then(
        () => setBusy(false),
        () => setBusy(false),
      );
    }, delay);
  }

  return { busy, run };
}

function GuestSummary({
  draft,
  children,
}: {
  draft: Pick<BookingDraft, 'date' | 'time' | 'guests'>;
  children?: ReactNode;
}) {
  return (
    <Panel className="guest-summary">
      <h2>Tóm tắt đặt bàn</h2>
      <dl>
        <div>
          <dt>
            <CalendarDays size={17} /> Ngày đến
          </dt>
          <dd>{displayDate(draft.date)}</dd>
        </div>
        <div>
          <dt>
            <Clock3 size={17} /> Khung giờ
          </dt>
          <dd>{draft.time || 'Chưa chọn'}</dd>
        </div>
        <div>
          <dt>
            <Users size={17} /> Số khách
          </dt>
          <dd>{draft.guests} khách</dd>
        </div>
      </dl>
      {children}
    </Panel>
  );
}

const defaultDraft: BookingDraft = {
  date: DEMO_DATE,
  time: '',
  guests: 4,
  name: '',
  phone: '',
  note: '',
  source: 'web',
};
type FormErrors = Partial<
  Record<'date' | 'time' | 'name' | 'phone' | 'general', string>
>;

const localDay = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
type BookingAttempt = { key: string; payload: NewBooking; csrfToken?: string };

export function BookingPage() {
  const { key, state } = useLocation();
  const handoff = (state as { draft?: Partial<BookingDraft> } | null)?.draft;

  return <BookingForm key={handoff ? key : undefined} handoff={handoff} />;
}

function BookingForm({ handoff }: { handoff?: Partial<BookingDraft> }) {
  const { bookings, createBooking, scenario } = useRestaurant();
  const nav = useNavigate();
  const minimumDay = bookingUsesApi ? localDay.format(new Date()) : DEMO_DATE;
  const [draft, setDraft] = useState<BookingDraft>(() => ({
    ...defaultDraft,
    ...handoff,
    ...(bookingUsesApi
      ? {
          source: 'web',
          date:
            handoff?.date && handoff.date >= minimumDay
              ? handoff.date
              : minimumDay,
          time: '',
        }
      : {}),
  }));
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState(
    !bookingUsesApi && Boolean(handoff?.time),
  );
  const [serverSlots, setServerSlots] = useState<
    Array<{ time: string; available: boolean }>
  >([]);
  const [blockedTime, setBlockedTime] = useState('');
  const [recovery, setRecovery] = useState<'none' | 'unknown' | 'session-lost'>(
    'none',
  );
  const uncertain = recovery !== 'none';
  const [errors, setErrors] = useState<FormErrors>({});
  const { busy, run } = useMockAction(bookingUsesApi ? 0 : 440);
  const attempt = useRef<BookingAttempt | null>(null);
  const formError = useRef<HTMLDivElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const slots = bookingUsesApi
    ? serverSlots
    : availableTimes(bookings, draft.date, draft.guests);
  const demoEmpty = !bookingUsesApi && scenario === 'empty';
  const hasSlot = slots.some(
    (slot) => slot.available && slot.time !== blockedTime,
  );

  useEffect(() => {
    if (Object.keys(errors).length) formError.current?.focus();
  }, [errors]);

  function setValue<K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) {
    const resetsTime = key === 'date' || key === 'guests';
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(resetsTime ? { time: '' } : {}),
    }));
    if (resetsTime) {
      setChecked(false);
      setBlockedTime('');
    }
    setErrors({});
  }

  function go(stepNumber: number) {
    setStep(stepNumber);
    requestAnimationFrame(() => stepHeading.current?.focus());
  }

  function checkSlots() {
    if (!draft.date || draft.date < minimumDay) {
      setErrors({ date: `Chọn ngày từ ${displayDate(minimumDay)} trở đi.` });
      return;
    }
    setErrors({});
    setChecked(false);
    run(async () => {
      if (bookingUsesApi) {
        try {
          setServerSlots(
            (await bookingApi.availability(draft.date, draft.guests)).slots,
          );
        } catch {
          setErrors({
            general: 'Chưa kiểm tra được khung giờ. Vui lòng thử lại.',
          });
          return;
        }
      }
      setChecked(true);
    });
  }

  function openResult(booking: SavedBooking) {
    attempt.current = null;
    nav(`/dat-ban/ket-qua?id=${encodeURIComponent(booking.id)}`);
  }

  async function sendReservation(current: BookingAttempt) {
    setErrors({});
    if (!current.csrfToken) {
      try {
        current.csrfToken = (await bookingApi.session()).csrfToken;
      } catch {
        attempt.current = null;
        setErrors({
          general: 'Chưa thiết lập được phiên khách. Vui lòng thử lại.',
        });
        return;
      }
    }
    try {
      openResult(
        await bookingApi.create(
          current.payload,
          current.key,
          current.csrfToken,
        ),
      );
    } catch (error) {
      if (
        error instanceof ApiServiceError &&
        [
          'CAPACITY_UNAVAILABLE',
          'SLOT_CLOSED',
          'BOOKING_WINDOW_CLOSED',
        ].includes(error.code)
      ) {
        attempt.current = null;
        setRecovery('none');
        setDraft((previous) => ({ ...previous, time: '' }));
        setChecked(false);
        setErrors({ general: error.message });
        go(0);
        try {
          setServerSlots(
            (
              await bookingApi.availability(
                current.payload.date,
                current.payload.guests,
              )
            ).slots,
          );
          setChecked(true);
        } catch {
          // The existing check button can refresh the chosen date again.
        }
        return;
      }
      if (error instanceof ApiServiceError) {
        if (error.status === 401 && recovery === 'unknown') {
          setRecovery('session-lost');
          setErrors({
            general:
              'Phiên khách đã hết hạn. Lượt trước có thể đã được ghi nhận.',
          });
          return;
        }
        if (
          recovery === 'none' &&
          [400, 401, 403, 422, 429].includes(error.status)
        ) {
          attempt.current = null;
          setErrors({ general: error.message });
          return;
        }
        if (recovery === 'unknown' && error.status === 403) {
          setErrors({
            general:
              'Lần gửi lại bị từ chối. Hãy kiểm tra kết quả của lần trước.',
          });
        }
      }
      setRecovery('unknown');
    }
  }

  function startNewReservation() {
    attempt.current = null;
    setRecovery('none');
    setErrors({});
    setDraft((current) => ({ ...current, time: '' }));
    setChecked(false);
    go(0);
  }

  function recoverReservation() {
    const current = attempt.current;
    if (!current || busy) return;
    run(async () => {
      try {
        openResult(await bookingApi.attempt(current.key));
      } catch (error) {
        const status =
          error instanceof ApiServiceError ? error.status : undefined;
        if (status === 401) setRecovery('session-lost');
        setErrors({
          general:
            status === 404
              ? 'Chưa thấy kết quả. Bạn có thể kiểm tra lại hoặc gửi lại cùng yêu cầu.'
              : status === 401
                ? 'Phiên khách đã hết hạn. Lượt trước có thể đã được ghi nhận.'
                : 'Chưa kiểm tra được kết quả. Vui lòng thử lại.',
        });
      }
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uncertain) return;
    if (step === 0) {
      if (
        !checked ||
        !draft.time ||
        !slots.some((slot) => slot.available && slot.time === draft.time)
      ) {
        setErrors({ time: 'Chọn một giờ còn chỗ.' });
        return;
      }
      go(1);
    } else if (step === 1) {
      const issues: FormErrors = {};
      if (draft.name.trim().length < 2)
        issues.name = 'Nhập tên có ít nhất hai ký tự.';
      if (!/^0\d{9}$/.test(draft.phone.replace(/\s/g, '')))
        issues.phone = 'Nhập số điện thoại mẫu gồm 10 chữ số, bắt đầu bằng 0.';
      setErrors(issues);
      if (!Object.keys(issues).length) go(2);
    } else {
      if (bookingUsesApi) {
        const current = attempt.current ?? {
          key: crypto.randomUUID(),
          payload: {
            date: draft.date,
            time: draft.time,
            guests: draft.guests,
            contact: {
              name: draft.name.trim(),
              phone: draft.phone.replace(/\s/g, ''),
            },
            note: draft.note.trim(),
          },
        };
        attempt.current = current;
        run(() => sendReservation(current));
        return;
      }
      run(async () => {
        const booking =
          scenario === 'slot-conflict' && !blockedTime
            ? null
            : await createBooking({
                ...draft,
                name: draft.name.trim(),
                phone: draft.phone.replace(/\s/g, ''),
              });
        if (!booking) {
          setBlockedTime(draft.time);
          setDraft((current) => ({ ...current, time: '' }));
          setChecked(true);
          setErrors({
            general: 'Khung giờ này vừa hết chỗ. Hãy chọn giờ khác.',
          });
          go(0);
        } else if (scenario === 'lost-response') {
          setRecovery('unknown');
        } else {
          nav('/dat-ban/ket-qua');
        }
      });
    }
  }

  return (
    <>
      <PublicPageIntro
        title="Đặt bàn"
        description="Chọn ngày và số khách để xem giờ còn chỗ."
      />
      <div className="container public-page">
        <ol className="steps" aria-label="Tiến trình đặt bàn">
          {['Khung giờ', 'Liên hệ', 'Kiểm tra lại'].map((label, index) => (
            <li
              key={label}
              aria-current={index === step ? 'step' : undefined}
              className={index < step ? 'step-done' : ''}
            >
              {index < step ? (
                <button
                  type="button"
                  onClick={() => go(index)}
                  disabled={busy || uncertain}
                >
                  <span>
                    <Check size={16} />
                  </span>
                  {label}
                </button>
              ) : (
                <div>
                  <span>{index + 1}</span>
                  {label}
                </div>
              )}
            </li>
          ))}
        </ol>
        <div className="transaction">
          <Panel className="transaction-main">
            <form className="stack" onSubmit={submit} noValidate>
              <h2 ref={stepHeading} tabIndex={-1}>
                {
                  [
                    'Ngày và số khách',
                    'Thông tin liên hệ',
                    'Kiểm tra yêu cầu đặt bàn',
                  ][step]
                }
              </h2>
              {Object.keys(errors).length > 0 && (
                <div tabIndex={-1} ref={formError}>
                  <Notice tone="danger">
                    {errors.general ??
                      errors.time ??
                      'Kiểm tra các mục được đánh dấu.'}
                  </Notice>
                </div>
              )}
              {step === 0 && (
                <>
                  <div className="two-fields">
                    <label className="field">
                      <span>
                        Ngày đến <small>(bắt buộc)</small>
                      </span>
                      <input
                        className="input"
                        type="date"
                        min={minimumDay}
                        value={draft.date}
                        disabled={busy}
                        aria-invalid={Boolean(errors.date)}
                        aria-describedby={
                          errors.date ? 'booking-date-error' : undefined
                        }
                        onChange={(event) =>
                          setValue('date', event.target.value)
                        }
                      />
                      {errors.date && (
                        <small className="field-error" id="booking-date-error">
                          {errors.date}
                        </small>
                      )}
                    </label>
                    <fieldset className="field guest-field">
                      <legend>Số khách</legend>
                      <div className="quantity">
                        <button
                          type="button"
                          aria-label="Giảm số khách"
                          disabled={draft.guests <= 1 || busy}
                          onClick={() => setValue('guests', draft.guests - 1)}
                        >
                          <Minus size={16} />
                        </button>
                        <output aria-live="polite">{draft.guests} khách</output>
                        <button
                          type="button"
                          aria-label="Tăng số khách"
                          disabled={draft.guests >= 10 || busy}
                          onClick={() => setValue('guests', draft.guests + 1)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </fieldset>
                  </div>
                  <div>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={checkSlots}
                      disabled={busy}
                    >
                      Kiểm tra khung giờ
                    </button>
                  </div>
                  {busy && <Loading label="Đang kiểm tra khung giờ…" />}
                  {checked &&
                    (demoEmpty || !hasSlot ? (
                      <Empty
                        title="Không còn giờ trống"
                        description="Thử chọn ngày khác hoặc đổi số khách."
                      />
                    ) : (
                      <fieldset className="slot-field">
                        <legend>Chọn giờ đến</legend>
                        <div className="slot-grid">
                          {slots.map(({ time, available }) => {
                            const open = available && time !== blockedTime;
                            return (
                              <button
                                key={time}
                                type="button"
                                className="slot"
                                aria-pressed={draft.time === time}
                                disabled={!open}
                                onClick={() => setValue('time', time)}
                              >
                                {time}
                                {!open && <small>Hết chỗ</small>}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}
                  {checked && !demoEmpty && hasSlot && (
                    <div className="form-actions">
                      <button className="button" type="submit">
                        Tiếp tục <ArrowRight size={17} />
                      </button>
                    </div>
                  )}
                </>
              )}
              {step === 1 && (
                <>
                  <Notice>Dùng tên và số điện thoại mẫu.</Notice>
                  <label className="field">
                    <span>
                      Tên người đặt <small>(bắt buộc)</small>
                    </span>
                    <input
                      className="input"
                      name="name"
                      autoComplete={bookingUsesApi ? 'off' : 'name'}
                      value={draft.name}
                      maxLength={80}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={
                        errors.name ? 'booking-name-error' : undefined
                      }
                      onChange={(event) => setValue('name', event.target.value)}
                    />
                    {errors.name && (
                      <small id="booking-name-error" className="field-error">
                        {errors.name}
                      </small>
                    )}
                  </label>
                  <label className="field">
                    <span>
                      Số điện thoại mẫu <small>(bắt buộc)</small>
                    </span>
                    <input
                      type="tel"
                      className="input"
                      inputMode="tel"
                      name="tel"
                      autoComplete={bookingUsesApi ? 'off' : 'tel'}
                      value={draft.phone}
                      maxLength={18}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={
                        errors.phone ? 'booking-phone-error' : undefined
                      }
                      onChange={(event) =>
                        setValue('phone', event.target.value)
                      }
                    />
                    {errors.phone && (
                      <small id="booking-phone-error" className="field-error">
                        {errors.phone}
                      </small>
                    )}
                  </label>
                  <label className="field">
                    <span>
                      Ghi chú <small>(tùy chọn)</small>
                    </span>
                    <textarea
                      className="input"
                      rows={3}
                      value={draft.note}
                      maxLength={200}
                      onChange={(event) => setValue('note', event.target.value)}
                    />
                  </label>
                  <button
                    className="button tertiary sample-button"
                    type="button"
                    onClick={() => {
                      setDraft((current) => ({
                        ...current,
                        name: 'Khách mẫu',
                        phone: '0900000001',
                      }));
                      setErrors({});
                    }}
                  >
                    Dùng thông tin mẫu
                  </button>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => go(0)}
                    >
                      <ArrowLeft size={17} /> Quay lại
                    </button>
                    <button type="submit" className="button">
                      Kiểm tra lại <ArrowRight size={17} />
                    </button>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <dl className="fact-list">
                    <div>
                      <dt>Khung giờ</dt>
                      <dd>
                        {draft.time}, {displayDate(draft.date)}
                      </dd>
                    </div>
                    <div>
                      <dt>Số khách</dt>
                      <dd>{draft.guests} khách</dd>
                    </div>
                    <div>
                      <dt>Người đặt</dt>
                      <dd>{draft.name}</dd>
                    </div>
                    <div>
                      <dt>Số điện thoại mẫu</dt>
                      <dd>{draft.phone}</dd>
                    </div>
                    {draft.note && (
                      <div>
                        <dt>Ghi chú</dt>
                        <dd>{draft.note}</dd>
                      </div>
                    )}
                  </dl>
                  {uncertain ? (
                    <>
                      <Notice tone="warning">
                        Chưa rõ yêu cầu đã được ghi nhận. Kiểm tra kết quả trước
                        khi gửi lại.
                      </Notice>
                      {recovery === 'session-lost' ? (
                        <button
                          type="button"
                          className="button"
                          onClick={startNewReservation}
                          disabled={busy}
                        >
                          Bắt đầu yêu cầu mới
                        </button>
                      ) : bookingUsesApi ? (
                        <div className="form-actions">
                          <button
                            type="button"
                            className="button"
                            onClick={recoverReservation}
                            disabled={busy}
                          >
                            Kiểm tra kết quả
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => {
                              const current = attempt.current;
                              if (current) run(() => sendReservation(current));
                            }}
                            disabled={busy}
                          >
                            Gửi lại cùng yêu cầu
                          </button>
                        </div>
                      ) : (
                        <Link className="button" to="/dat-ban/ket-qua">
                          Kiểm tra kết quả <ArrowRight size={17} />
                        </Link>
                      )}
                    </>
                  ) : (
                    <>
                      <Notice>
                        {bookingUsesApi
                          ? 'Lượt này dùng để thử quy trình giữ bàn. Hãy dùng thông tin mẫu.'
                          : `Bàn được giữ tạm trong khi chờ xác minh tiền cọc mẫu ${money(DEPOSIT_AMOUNT)}.`}
                      </Notice>
                      {busy && <Loading label="Đang gửi yêu cầu…" />}
                      <div className="form-actions">
                        <button
                          type="button"
                          className="button secondary"
                          disabled={busy}
                          onClick={() => go(1)}
                        >
                          <ArrowLeft size={17} /> Sửa thông tin
                        </button>
                        <button
                          type="submit"
                          className="button"
                          disabled={busy}
                        >
                          Gửi yêu cầu đặt bàn <ArrowRight size={17} />
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </form>
          </Panel>
          <GuestSummary draft={draft} />
        </div>
      </div>
    </>
  );
}

function needBooking() {
  return (
    <div className="container public-page">
      <Empty
        title="Chưa có lượt đặt bàn"
        description="Đặt bàn mới hoặc dùng mã để tra cứu lượt đã có."
        action={
          <div className="row recovery-actions">
            <Link className="button" to="/dat-ban">
              Đặt bàn
            </Link>
            <Link className="button secondary" to="/tra-cuu-dat-cho">
              Tra cứu đặt chỗ
            </Link>
          </div>
        }
      />
    </div>
  );
}

export function Preorder() {
  const { activeBooking, dishes, updateBooking, scenario } = useRestaurant();
  if (!activeBooking) return needBooking();
  if (!bookingOpen(activeBooking)) {
    return (
      <div className="container public-page">
        <Empty
          title="Lượt đặt đã khóa chọn món"
          description="Mở kết quả để xem món đã lưu và tình trạng đặt chỗ."
          action={
            <Link className="button" to="/dat-ban/ket-qua">
              Xem kết quả đặt chỗ
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <PreorderForm
      key={activeBooking.id}
      booking={activeBooking}
      dishes={scenario === 'empty' ? [] : dishes}
      updateBooking={updateBooking}
    />
  );
}

function PreorderForm({
  booking,
  dishes,
  updateBooking,
}: {
  booking: Booking;
  dishes: ReturnType<typeof useRestaurant>['dishes'];
  updateBooking: ReturnType<typeof useRestaurant>['updateBooking'];
}) {
  const { draftQuantities, setDraftQuantities } = useRestaurant();
  const [initial] = useState(() =>
    preparePreorder(booking.items, dishes, draftQuantities),
  );
  const [quantities, setQuantities] = useState(initial.quantities);
  const transferred = useRef(initial.transferred);
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { busy, run } = useMockAction();
  const publicDishes = dishes.filter((dish) => dish.published);
  const selectedDish = publicDishes.find((dish) => dish.id === selected);
  const savedById = new Map(booking.items.map((line) => [line.dishId, line]));
  const retainedItems = booking.items.filter(
    (line) => !publicDishes.some((dish) => dish.id === line.dishId),
  );
  const editedItems = publicDishes.flatMap((dish) => {
    const quantity = quantities[dish.id] ?? 0;
    if (!quantity) return [];
    return [
      {
        dishId: dish.id,
        quantity,
        unitPrice: savedById.get(dish.id)?.unitPrice ?? dish.price,
      },
    ];
  });
  const lines = [...editedItems, ...retainedItems];
  const total = lines.reduce(
    (value, line) => value + line.quantity * (line.unitPrice ?? 0),
    0,
  );
  function save() {
    const unavailable = publicDishes.find(
      (dish) =>
        !dish.available &&
        (quantities[dish.id] ?? 0) > (savedById.get(dish.id)?.quantity ?? 0),
    );
    if (unavailable) {
      setError(`${unavailable.name} đang tạm hết. Giảm số lượng rồi lưu lại.`);
      return;
    }
    setError('');
    run(() => {
      const items: OrderLine[] = lines;
      updateBooking(
        booking.id,
        { items, kitchenChanged: booking.items.length > 0 },
        'Đã cập nhật danh sách món đặt trước.',
      );
      const applied = transferred.current;
      transferred.current = {};
      setDraftQuantities((current) => {
        const remaining = { ...current };
        for (const [id, count] of Object.entries(applied)) {
          const quantity = (remaining[id] ?? 0) - count;
          if (quantity > 0) remaining[id] = quantity;
          else delete remaining[id];
        }
        return remaining;
      });
      setSaved(true);
    });
  }

  function quantityControls(dish: Dish) {
    const quantity = quantities[dish.id] ?? 0;
    const change = (delta: 1 | -1) => {
      setQuantities((current) => ({
        ...current,
        [dish.id]: Math.max(
          0,
          Math.min(MAX_DISH_QUANTITY, (current[dish.id] ?? 0) + delta),
        ),
      }));
      setSaved(false);
      setError('');
    };
    return (
      <div className="quantity">
        <button
          type="button"
          aria-label={`Bớt ${dish.name}`}
          disabled={!quantity || busy}
          onClick={() => change(-1)}
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <output aria-label={`Số lượng ${dish.name}`}>{quantity}</output>
        <button
          type="button"
          aria-label={`Thêm ${dish.name}`}
          disabled={!dish.available || quantity >= MAX_DISH_QUANTITY || busy}
          onClick={() => change(1)}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="container public-page">
      <PageHead
        title="Chọn món trước"
        description={`Lượt ${booking.id} · ${booking.time} · ${booking.guests} khách. Giá và tình trạng món là dữ liệu mẫu.`}
        action={
          <Link className="button secondary" to="/dat-ban/ket-qua">
            <ArrowLeft size={17} /> Kết quả đặt chỗ
          </Link>
        }
      />
      <div className="transaction">
        <Panel className="transaction-main stack">
          {!publicDishes.length && (
            <Empty
              title="Chưa có món để chọn"
              description="Bạn vẫn có thể tiếp tục đặt bàn."
            />
          )}
          {publicDishes.length > 0 && (
            <a
              className="text-link preorder-summary-link"
              href="#preorder-summary"
            >
              Xem món đã chọn <ArrowRight size={17} />
            </a>
          )}
          {publicDishes.map((dish) => (
            <div key={dish.id} className="preorder-row">
              <button
                type="button"
                className="photo-button"
                aria-label={`Xem ${dish.name}`}
                onClick={() => setSelected(dish.id)}
              >
                <DishImage dish={dish} />
              </button>
              <div>
                <button
                  className="item-link"
                  type="button"
                  onClick={() => setSelected(dish.id)}
                >
                  {dish.name}
                </button>
                <p>{money(savedById.get(dish.id)?.unitPrice ?? dish.price)}</p>
                {!dish.available && <Badge tone="warning">Tạm hết</Badge>}
              </div>
              {quantityControls(dish)}
            </div>
          ))}
        </Panel>
        <Panel className="guest-summary preorder-summary stack">
          <h2 id="preorder-summary" tabIndex={-1}>
            Món đã chọn
          </h2>
          {lines.length ? (
            <dl className="fact-list">
              {lines.map((line) => (
                <div key={line.dishId}>
                  <dt>
                    {line.quantity} ×{' '}
                    {dishes.find((dish) => dish.id === line.dishId)?.name ??
                      'Món đã lưu'}
                  </dt>
                  <dd>{money(line.quantity * (line.unitPrice ?? 0))}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>Chưa chọn món nào.</p>
          )}
          <div className="summary-total">
            <span>Tổng tiền món</span>
            <strong>{money(total)}</strong>
          </div>
          {error && <Notice tone="danger">{error}</Notice>}
          {busy && <Loading label="Đang lưu món…" />}
          {saved && (
            <Notice tone="success">Đã lưu món cho lượt {booking.id}.</Notice>
          )}
          {publicDishes.length > 0 && (
            <button
              className="button"
              type="button"
              disabled={busy}
              onClick={save}
            >
              Lưu món
            </button>
          )}
          <Link
            className="button secondary"
            to={
              booking.deposit === 'verified'
                ? '/dat-ban/ket-qua'
                : '/dat-ban/dat-coc'
            }
          >
            {booking.deposit === 'verified'
              ? 'Xem kết quả'
              : 'Tiếp tục đặt cọc'}{' '}
            <ArrowRight size={17} />
          </Link>
        </Panel>
      </div>
      {selectedDish && (
        <DishDetails
          dish={{
            ...selectedDish,
            price:
              savedById.get(selectedDish.id)?.unitPrice ?? selectedDish.price,
          }}
          close={() => setSelected(null)}
          action={
            <div className="row preorder-detail-controls">
              <span>Số lượng đặt trước</span>
              {quantityControls(selectedDish)}
            </div>
          }
        />
      )}
    </div>
  );
}

function DepositQr() {
  const { scenario, setScenario } = useRestaurant();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(
    scenario === 'qr-error' ? 'error' : 'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  return (
    <div className="qr-box" ref={box} tabIndex={-1}>
      {state === 'loading' && (
        <div className="qr-placeholder">
          <Loading label="Đang tải mã QR…" />
        </div>
      )}
      {state === 'error' ? (
        <div className="qr-placeholder">
          <p role="status">Chưa tải được mã QR.</p>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              box.current?.focus({ preventScroll: true });
              if (scenario === 'qr-error') setScenario('normal');
              setAttempt((current) => current + 1);
              setState('loading');
            }}
          >
            Tải lại mã QR
          </button>
        </div>
      ) : (
        <img
          key={attempt}
          src={
            attempt
              ? `/images/demo-qr.png?lan=${attempt}`
              : '/images/demo-qr.png'
          }
          width="156"
          height="156"
          alt="Mã QR mẫu không có thông tin thanh toán"
          hidden={state !== 'ready'}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
        />
      )}
      {state === 'ready' && <small>QR mẫu</small>}
    </div>
  );
}

export function DepositPage() {
  const { activeBooking: booking, updateBooking, scenario } = useRestaurant();
  const { busy, run } = useMockAction();
  const [clipboard, setClipboard] = useState('');
  if (!booking) return needBooking();
  const reference = `COC-${booking.id}`;
  const canTransfer = bookingOpen(booking) && booking.deposit === 'pending';
  const canCheck = bookingOpen(booking) && booking.deposit === 'review';

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setClipboard('Đã sao chép nội dung chuyển khoản.');
    } catch {
      setClipboard('Hãy sao chép nội dung chuyển khoản theo cách thủ công.');
    }
  }

  function updateDeposit() {
    if (!booking) return;
    if (booking.deposit === 'pending') {
      run(() =>
        updateBooking(
          booking.id,
          { deposit: 'review' },
          'Khách báo đã chuyển cọc, chờ xác minh.',
        ),
      );
    } else if (booking.deposit === 'review') {
      run(async () => {
        if (scenario === 'late-deposit') {
          await updateBooking(
            booking.id,
            {
              deposit: 'exception',
              status: 'cancelled',
              tables: [],
              received: DEPOSIT_AMOUNT,
            },
            'Tiền đến sau hạn giữ bàn. Cần người phụ trách đối chiếu.',
          );
        } else {
          await updateBooking(
            booking.id,
            {
              deposit: 'verified',
              status: 'confirmed',
              received: DEPOSIT_AMOUNT,
            },
            'Kết quả mẫu: giao dịch khớp, lượt đặt đã được xác nhận.',
          );
        }
      });
    }
  }

  return (
    <div className="container public-page">
      <PageHead
        title="Đặt cọc"
        description={`Lượt ${booking.id} · ${booking.time} ngày ${displayDate(booking.date)}`}
        action={
          <Link className="button secondary" to="/dat-ban/ket-qua">
            Xem kết quả
          </Link>
        }
      />
      <div className="transaction deposit-transaction">
        <Panel className="transaction-main stack">
          <div className="row deposit-heading">
            <h2>
              {canTransfer ? 'Thông tin chuyển khoản' : 'Thông tin khoản cọc'}
            </h2>
            <Status value={booking.deposit} kind="deposit" />
          </div>
          {canTransfer && (
            <Notice tone="warning">
              Đây là QR mẫu. Không chuyển tiền thật.
            </Notice>
          )}
          <div className="deposit-grid" data-payable={canTransfer}>
            <dl className="fact-list deposit-payee">
              <div>
                <dt>Số tiền cọc</dt>
                <dd>{money(DEPOSIT_AMOUNT)}</dd>
              </div>
              <div>
                <dt>Người nhận mẫu</dt>
                <dd>Ba Anh Em Demo</dd>
              </div>
            </dl>
            {canTransfer && <DepositQr />}
            <dl className="fact-list deposit-reference">
              <div>
                <dt>Nội dung chuyển</dt>
                <dd>
                  {reference}{' '}
                  {canTransfer && (
                    <button
                      className="icon-button"
                      type="button"
                      aria-label="Sao chép nội dung chuyển"
                      onClick={() => void copy(reference)}
                    >
                      <Copy size={17} aria-hidden="true" />
                    </button>
                  )}
                </dd>
              </div>
              {canTransfer && (
                <div>
                  <dt>Thời gian giữ bàn mẫu</dt>
                  <dd>15 phút từ lúc đặt</dd>
                </div>
              )}
            </dl>
          </div>
          {canTransfer && clipboard && <Notice>{clipboard}</Notice>}
          {booking.deposit === 'review' && (
            <Notice>
              Đã nhận thông báo chuyển khoản. Cọc đang chờ xác minh.
            </Notice>
          )}
          {booking.deposit === 'verified' && (
            <Notice tone="success">Đã xác minh khoản cọc mẫu.</Notice>
          )}
          {booking.deposit === 'exception' && (
            <Notice tone="warning">
              Tiền đến sau hạn giữ bàn. Lượt này không còn được giữ bàn. Khoản
              cọc vẫn cần đối chiếu.
            </Notice>
          )}
          {booking.deposit === 'expired' && (
            <Notice tone="warning">
              Thông tin chuyển khoản mẫu đã hết hạn.
            </Notice>
          )}
          {busy && <Loading label="Đang kiểm tra khoản cọc…" />}
          {(canTransfer || canCheck) && (
            <div>
              <button
                className="button"
                type="button"
                disabled={busy}
                onClick={updateDeposit}
              >
                <CreditCard size={17} />
                {canTransfer ? 'Báo đã chuyển (mẫu)' : 'Kiểm tra tiền cọc'}
              </button>
            </div>
          )}
        </Panel>
        <GuestSummary draft={booking} />
      </div>
    </div>
  );
}

export function BookingResult() {
  const [search] = useSearchParams();
  const reference = search.get('id');
  if (bookingUsesApi && reference)
    return <SavedBookingResult reference={reference} />;
  return <DemoBookingResult />;
}

function SavedBookingResult({ reference }: { reference: string }) {
  const result = useQuery({
    queryKey: ['booking', 'guest-result', reference],
    queryFn: ({ signal }) => bookingApi.get(reference, signal),
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? 30_000 : false,
  });
  if (result.isPending)
    return (
      <div className="container public-page">
        <Loading label="Đang tải kết quả đặt bàn…" />
      </div>
    );
  if (result.isError) {
    const status =
      result.error instanceof ApiServiceError ? result.error.status : undefined;
    const inaccessible = status === 401 || status === 404;
    return (
      <div className="container public-page">
        <Empty
          title={
            inaccessible
              ? 'Không tìm thấy lượt trong phiên này'
              : 'Chưa tải được kết quả'
          }
          action={
            inaccessible ? (
              <Link className="button" to="/">
                Về trang chủ
              </Link>
            ) : (
              <button
                className="button"
                type="button"
                onClick={() => void result.refetch()}
              >
                Thử lại
              </button>
            )
          }
        />
      </div>
    );
  }
  const booking = result.data;
  return (
    <div className="container public-page result-page">
      <PageHead
        title={
          booking.statusReason === 'HOLD_EXPIRED'
            ? 'Lượt giữ bàn đã hết hạn'
            : 'Kết quả đặt bàn thử'
        }
        description={`Mã tham chiếu ${booking.id}`}
      />
      <GuestSummary draft={booking}>
        <Status value={booking.status} kind="booking" />
        {booking.status === 'pending' && (
          <Notice>Bàn đang được giữ tạm cho lượt đặt thử.</Notice>
        )}
        <Link className="button" to="/">
          Về trang chủ
        </Link>
      </GuestSummary>
    </div>
  );
}

function DemoBookingResult() {
  const { activeBooking: booking, dishes } = useRestaurant();
  if (!booking) return needBooking();
  const open = bookingOpen(booking);
  const heading =
    booking.status === 'pending'
      ? 'Đã tiếp nhận lượt đặt'
      : booking.status === 'cancelled'
        ? 'Lượt đặt đã kết thúc'
        : booking.status === 'confirmed'
          ? 'Đã xác nhận đặt bàn'
          : 'Kết quả đặt chỗ';
  return (
    <div className="container public-page result-page">
      <PageHead title={heading} description={`Mã tham chiếu ${booking.id}`} />
      <Panel className="result-panel stack">
        <dl className="fact-list">
          <div>
            <dt>Ngày và giờ</dt>
            <dd>
              {booking.time} · {displayDate(booking.date)}
            </dd>
          </div>
          <div>
            <dt>Số khách</dt>
            <dd>{booking.guests} khách</dd>
          </div>
          <div>
            <dt>Đặt chỗ</dt>
            <dd>
              <Status value={booking.status} kind="booking" />
            </dd>
          </div>
          <div>
            <dt>Bố trí bàn</dt>
            <dd>
              {booking.tables.length
                ? `${booking.status === 'pending' ? 'Đang giữ' : 'Đã phân bàn'} ${booking.tables.join(', ')}`
                : 'Chưa phân bàn'}
            </dd>
          </div>
          <div>
            <dt>Khoản cọc</dt>
            <dd>
              <Status value={booking.deposit} kind="deposit" />
            </dd>
          </div>
          <div>
            <dt>Món đặt trước</dt>
            <dd>
              {booking.items.length
                ? booking.items
                    .map(
                      (line) =>
                        `${line.quantity} × ${dishes.find((dish) => dish.id === line.dishId)?.name ?? line.dishId}`,
                    )
                    .join(', ')
                : 'Chưa chọn món'}
            </dd>
          </div>
        </dl>
        {booking.deposit === 'exception' && (
          <Notice tone="warning">
            Khoản cọc cần đối chiếu. Xem tình trạng bàn ở trên.
          </Notice>
        )}
        {booking.status === 'pending' && (
          <Notice>Lượt đặt đang chờ xác nhận.</Notice>
        )}
        <div className="form-actions">
          {open && (
            <Link className="button secondary" to="/dat-ban/chon-mon">
              {booking.items.length ? 'Sửa món đặt trước' : 'Chọn món trước'}
            </Link>
          )}
          {open && booking.deposit !== 'verified' ? (
            <Link className="button" to="/dat-ban/dat-coc">
              Xem tiền cọc <ArrowRight size={17} />
            </Link>
          ) : (
            <Link className="button" to="/">
              Về trang chủ
            </Link>
          )}
        </div>
      </Panel>
    </div>
  );
}
