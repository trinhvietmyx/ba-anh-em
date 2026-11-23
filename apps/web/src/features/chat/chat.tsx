import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  Flame,
  MessageCircle,
  RotateCcw,
  Send,
  UsersRound,
  Utensils,
  WifiOff,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { useRestaurant } from '../../app/restaurant-context';
import {
  availableTimes,
  DEMO_DATE,
  displayDate,
  money,
  TIMES,
  type Booking,
  type BookingDraft,
  type Dish,
} from '../../shared/model';
import { DishImage, Status } from '../../shared/ui';
import './chat.css';

type Stage =
  | 'welcome'
  | 'date'
  | 'guests'
  | 'time'
  | 'contact'
  | 'review'
  | 'recover'
  | 'done';

type Message =
  | { kind: 'user' | 'assistant' | 'warning'; text: string }
  | { kind: 'dishes'; text: string; dishes: Dish[] }
  | { kind: 'review'; draft: BookingDraft }
  | { kind: 'tool'; draft: BookingDraft }
  | { kind: 'result'; booking: Booking; api: boolean; recovered: boolean };

const newDraft: BookingDraft = {
  date: '',
  time: '',
  guests: 0,
  name: '',
  phone: '',
  note: '',
  source: 'chat',
};

const welcome: Message = {
  kind: 'assistant',
  text: 'Chào bạn, bạn muốn xem gợi ý món hay đặt bàn?',
};

const suggests = 'Gợi ý món cho 4 người';
const asksBooking = 'Đặt bàn';
const maxGuests = 10;
let pendingChatBooking: { id: string; api: boolean } | null = null;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replaceAll('đ', 'd');
}

function demoDateAfter(days: number) {
  const date = new Date(`${DEMO_DATE}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isBookableDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date &&
    date >= DEMO_DATE
  );
}

function readDate(value: string) {
  const iso = value.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (iso) return iso;

  const parts = value.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);
  if (parts?.[1] && parts[2]) {
    return `${parts[3] ?? DEMO_DATE.slice(0, 4)}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }

  if (/\b(ngay mai|toi mai|trua mai|chieu mai|sang mai)\b/.test(value))
    return demoDateAfter(1);
  if (/\b(hom nay|toi nay|trua nay|chieu nay|sang nay)\b/.test(value))
    return DEMO_DATE;
  return undefined;
}

function readTime(value: string) {
  const parts = value.match(/\b(\d{1,2})\s*(h|gio|:)\s*(\d{2})?(?=\b|$)/);
  if (!parts?.[1]) return undefined;

  const [, , separator, minuteText] = parts;
  let hours = Number(parts[1]);
  const afterTime = value
    .slice((parts.index ?? 0) + parts[0].length)
    .trimStart();
  const followedByPartySize =
    /(?:h|gio)\s+\d{2}$/.test(parts[0]) && /^(nguoi|khach)\b/.test(afterTime);
  const minutes = followedByPartySize ? '00' : minuteText;
  if (separator === ':' && !minutes) return null;
  const evening =
    /^(toi|chieu)\b/.test(afterTime) ||
    /\b(toi|chieu) (mai|nay|ngay)\b/.test(value);
  const daytime =
    /^(sang|trua)\b/.test(afterTime) ||
    /\b(sang|trua) (mai|nay|ngay)\b/.test(value);
  if (hours === 12 && /^toi\b/.test(afterTime)) return null;
  if (hours < 12 && separator !== ':' && !daytime && !evening) return null;
  if (hours >= 1 && hours <= 11 && evening) hours += 12;

  return `${String(hours).padStart(2, '0')}:${minutes ?? '00'}`;
}

function readGuests(value: string, allowNumber: boolean) {
  const match = value.match(/\b(\d+)\s*(?:nguoi|khach)\b/);
  const guests =
    match?.[1] ?? (allowNumber && /^\d+$/.test(value) ? value : undefined);
  return guests === undefined ? undefined : Number(guests);
}

function hasFoodRestriction(query: string) {
  return /\b(di ung|khong an|khong (co |chua )?(tom|hai san|trung|sua|dau|lac|ca|gluten|lua mi|hat)|co chua|an toan|thanh phan|an chay|mon chay|kieng|tranh|nguyen lieu|tiep xuc cheo)\b/.test(
    query,
  );
}

function ChatFacts({
  draft,
}: {
  draft: Pick<BookingDraft, 'date' | 'time' | 'guests'>;
}) {
  return (
    <ul className="chat-facts" aria-label="Thông tin đặt bàn">
      <li>
        <CalendarDays size={16} aria-hidden="true" />
        {displayDate(draft.date)}
      </li>
      <li>
        <Clock3 size={16} aria-hidden="true" />
        {draft.time}
      </li>
      <li>
        <UsersRound size={16} aria-hidden="true" />
        {draft.guests} khách
      </li>
    </ul>
  );
}

function ChatToolPreview({ draft }: { draft: BookingDraft }) {
  return (
    <>
      <p className="chat-api-caption">
        <Code2 size={16} aria-hidden="true" /> Thao tác API mô phỏng
      </p>
      <strong>booking.create</strong>
      <ChatFacts draft={draft} />
    </>
  );
}

export function ChatWidget() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(pathname === '/tro-ly');
  const widget = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const { bookings, dishes, expanded, scenario, createBooking, setActiveId } =
    useRestaurant();
  const [pending, setPending] = useState(() => {
    const recovery = pendingChatBooking;
    return recovery && bookings.some((booking) => booking.id === recovery.id)
      ? recovery
      : null;
  });
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [stage, setStage] = useState<Stage>(() =>
    pending ? 'recover' : 'welcome',
  );
  const [draft, setDraft] = useState(newDraft);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState<'reply' | 'booking' | 'recover' | null>(
    null,
  );
  const [failedPrompt, setFailedPrompt] = useState('');
  const [unavailableSlot, setUnavailableSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [contactErrors, setContactErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});
  const [dateInput, setDateInput] = useState(DEMO_DATE);
  const [partyInput, setPartyInput] = useState(4);
  const [toolEnabled, setToolEnabled] = useState(false);
  const transcript = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLInputElement>(null);
  const contactName = useRef<HTMLInputElement>(null);
  const contactPhone = useRef<HTMLInputElement>(null);
  const focusNextAction = useRef(false);
  const nextTask = useRef<number | null>(null);
  const showingTool = expanded && toolEnabled;
  const offline = scenario === 'chat-offline';
  const empty = scenario === 'empty';
  const handoffDraft: Partial<BookingDraft> = {};

  if (draft.date) handoffDraft.date = draft.date;
  if (draft.guests) handoffDraft.guests = draft.guests;
  if (draft.time) handoffDraft.time = draft.time;
  const handoff = Object.keys(handoffDraft).length
    ? { draft: handoffDraft }
    : undefined;

  useEffect(() => {
    if (!open) return;
    panel.current?.focus({ preventScroll: true });

    const viewport = window.visualViewport;
    const dock = widget.current;
    if (!viewport || !dock) return;
    const syncViewport = () => {
      dock.style.setProperty('--chat-visible-height', `${viewport.height}px`);
      dock.toggleAttribute('data-chat-compact', viewport.height <= 320);
      const bottom = window.innerHeight - viewport.height - viewport.offsetTop;
      dock.style.setProperty(
        '--chat-keyboard-offset',
        `${Math.max(0, bottom)}px`,
      );
    };
    syncViewport();
    viewport.addEventListener('resize', syncViewport);
    viewport.addEventListener('scroll', syncViewport);
    return () => {
      viewport.removeEventListener('resize', syncViewport);
      viewport.removeEventListener('scroll', syncViewport);
      dock.style.removeProperty('--chat-visible-height');
      dock.style.removeProperty('--chat-keyboard-offset');
      dock.removeAttribute('data-chat-compact');
    };
  }, [open]);

  useEffect(
    () => () => {
      if (nextTask.current !== null) window.clearTimeout(nextTask.current);
    },
    [],
  );

  useEffect(() => {
    if (transcript.current)
      transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [messages, stage, busy, failedPrompt, offline, showingTool]);

  useEffect(() => {
    if (busy || !focusNextAction.current) return;
    focusNextAction.current = false;
    if (!open) return;
    const focused = document.activeElement;
    if (focused === composer.current || focused === launcher.current) return;
    if (focused !== document.body && !panel.current?.contains(focused)) return;
    const next = transcript.current?.querySelector<HTMLElement>(
      '[data-chat-next]:not(:disabled)',
    );
    (next ?? composer.current)?.focus();
  }, [busy, messages, offline, open, stage]);

  function collapse() {
    setOpen(false);
    launcher.current?.focus({ preventScroll: true });
  }

  function followLink() {
    setOpen(false);
    document
      .getElementById('prototype-content')
      ?.focus({ preventScroll: true });
  }

  function say(message: Message) {
    setMessages((current) => [...current, message]);
  }

  function reply(text: string) {
    say({ kind: 'assistant', text });
  }

  function later(
    kind: NonNullable<typeof busy>,
    task: () => void | Promise<void>,
  ) {
    if (nextTask.current !== null) return;

    setBusy(kind);
    nextTask.current = window.setTimeout(() => {
      nextTask.current = null;
      void Promise.resolve(task()).then(
        () => setBusy(null),
        () => {
          setBusy(null);
          say({
            kind: 'warning',
            text: 'Chưa xử lý được yêu cầu. Bạn thử lại nhé.',
          });
        },
      );
    }, 380);
  }

  function moveToReview(next: BookingDraft) {
    setStage('review');
    say({ kind: 'review', draft: next });
  }

  function advance(next: BookingDraft, clarifyTime = false) {
    setDraft(next);
    if (next.date) setDateInput(next.date);
    if (next.guests) setPartyInput(next.guests);
    if (!next.date) {
      setStage('date');
      reply('Bạn muốn đến ngày nào?');
    } else if (!next.guests) {
      setStage('guests');
      reply('Bạn đi mấy người? Mỗi lượt nhận từ 1 đến 10 khách.');
    } else if (!next.time) {
      setStage('time');
      if (getSlots(next.date, next.guests).some((slot) => slot.available)) {
        reply(
          clarifyTime
            ? 'Bạn chọn giờ cụ thể trong danh sách bên dưới.'
            : 'Chọn một giờ còn chỗ bên dưới.',
        );
      }
    } else if (!next.name || !next.phone) {
      setStage('contact');
      reply('Giờ này còn chỗ. Bạn điền tên và số điện thoại mẫu để tiếp tục.');
    } else {
      moveToReview(next);
    }
  }

  function updateDraft(date?: string, guests?: number, time?: string | null) {
    const next = { ...draft };
    if (date) next.date = isBookableDate(date) ? date : '';
    if (guests !== undefined)
      next.guests = guests >= 1 && guests <= maxGuests ? guests : 0;
    if (time !== undefined) {
      next.time = time && TIMES.includes(time) ? time : '';
    } else if (next.date !== draft.date || next.guests !== draft.guests) {
      next.time = '';
    }
    return next;
  }

  function suggestDishes(query: string) {
    if (hasFoodRestriction(query)) {
      say({
        kind: 'dishes',
        dishes: [],
        text: 'Thực đơn mẫu chưa xác minh đầy đủ thành phần và thông tin dị ứng. Hãy hỏi nhân viên về nguyên liệu và nguy cơ lẫn chất gây dị ứng trước khi chọn món.',
      });
      return;
    }

    const publicDishes = empty
      ? []
      : dishes.filter((dish) => dish.published && dish.available);
    const keywords = query
      .replace(/\bgoi y\b/g, '')
      .split(/\W+/)
      .filter((word) =>
        ['bo', 'ga', 'ca', 'tom', 'rau', 'lau', 'goi', 'nuong'].includes(word),
      );
    const suggestions = keywords.length
      ? publicDishes
          .filter((dish) =>
            normalize(dish.name)
              .split(/\s+/)
              .some((word) => keywords.includes(word)),
          )
          .slice(0, 3)
      : [...new Set(publicDishes.map((dish) => dish.category))]
          .map((category) =>
            publicDishes.find((dish) => dish.category === category),
          )
          .filter((dish) => dish !== undefined)
          .slice(0, 3);
    if (!suggestions.length) {
      say({
        kind: 'dishes',
        dishes: [],
        text: 'Chưa có món phù hợp đang nhận đặt trước.',
      });
      return;
    }

    say({
      kind: 'dishes',
      text: keywords.length
        ? 'Các món phù hợp đang nhận đặt trước.'
        : 'Một vài món đang nhận đặt trước từ các nhóm trong thực đơn.',
      dishes: suggestions,
    });
  }

  function answer(message: string) {
    const query = normalize(message.trim());
    const date = readDate(query);
    const time = readTime(query);
    const guests = readGuests(query, stage === 'guests');
    const reservation =
      /\b(dat ban|dat cho|giu ban|con ban|khung gio)\b/.test(query) ||
      Boolean(date && guests);
    const hasActiveDraft = !['welcome', 'done', 'recover'].includes(stage);

    if (offline) {
      if (reservation || hasActiveDraft)
        setDraft(updateDraft(date, guests, time));
      setFailedPrompt(message);
      say({
        kind: 'warning',
        text:
          stage === 'recover'
            ? 'Trợ lý tạm thời gián đoạn. Kiểm tra kết quả trước khi đặt lại.'
            : 'Chưa xử lý được tin nhắn. Bạn có thể gửi lại hoặc đặt bàn trên web.',
      });
      return;
    }

    setFailedPrompt('');

    if (
      hasFoodRestriction(query) ||
      (/\b(mon|thuc don|goi y|hai san|gia bao nhieu|bao nhieu tien)\b/.test(
        query,
      ) &&
        !reservation)
    ) {
      suggestDishes(query);
      if (!reservation) return;
    }

    if (stage === 'recover') {
      reply('Kiểm tra kết quả yêu cầu vừa gửi để tránh đặt trùng.');
      return;
    }

    if (stage === 'done' && reservation) {
      reply('Xem kết quả ở trên hoặc chọn «Đặt lượt khác».');
      return;
    }

    if (!reservation && !hasActiveDraft) {
      reply(
        'Bạn có thể hỏi về món hoặc nhắn ngày, giờ và số khách để đặt bàn.',
      );
      return;
    }

    const askingForAnotherTime =
      !time && /\b(gio|som hon|muon hon|toi hon)\b/.test(query);
    const next = updateDraft(date, guests, askingForAnotherTime ? null : time);
    if (date && !next.date) {
      setDraft(next);
      setStage('date');
      reply('Ngày này chưa đặt được. Bạn chọn ngày khác trong lịch.');
      return;
    }
    if (guests !== undefined && !next.guests) {
      setDraft(next);
      setStage('guests');
      reply('Mỗi lượt nhận từ 1 đến 10 khách. Bạn chọn lại số khách.');
      return;
    }
    if (next.time && next.date && next.guests && !canUseTime(next)) {
      say({
        kind: 'warning',
        text: `Khung ${next.time} đã hết chỗ.`,
      });
      next.time = '';
    } else if (
      stage === 'review' &&
      next.date === draft.date &&
      next.guests === draft.guests &&
      next.time === draft.time
    ) {
      reply('Bạn có thể sửa thông tin hoặc xác nhận gửi yêu cầu.');
      return;
    }
    advance(
      next,
      time !== undefined ||
        askingForAnotherTime ||
        /\b(toi|trua|chieu|sang|bay)\b/.test(query),
    );
  }

  function send(message: string, fromAction = false) {
    const cleanMessage = message.trim();
    if (!cleanMessage || nextTask.current !== null) return;

    focusNextAction.current = fromAction;
    say({ kind: 'user', text: cleanMessage });
    if (!fromAction) setInput('');
    later('reply', () => answer(cleanMessage));
  }

  function getSlots(date: string, guests: number) {
    if (empty) return [];
    const slots = availableTimes(bookings, date, guests);
    if (date !== unavailableSlot?.date) return slots;
    return slots.map((slot) =>
      slot.time === unavailableSlot.time ? { ...slot, available: false } : slot,
    );
  }

  function canUseTime({ date, time, guests }: BookingDraft) {
    return getSlots(date, guests).some(
      (slot) => slot.time === time && slot.available,
    );
  }

  function selectDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isBookableDate(dateInput)) return;
    send(`Ngày ${displayDate(dateInput)}`, true);
  }

  function selectGuests(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(`${partyInput} khách`, true);
  }

  function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.name.trim();
    const phone = draft.phone.replace(/[\s.-]/g, '');
    const errors: typeof contactErrors = {};
    if (name.length < 2) errors.name = 'Nhập tên từ 2 ký tự.';
    if (!/^(?:0\d{9}|\+84\d{9})$/.test(phone)) {
      errors.phone = 'Nhập số mẫu có 10 chữ số bắt đầu bằng 0 hoặc dạng +84.';
    }
    setContactErrors(errors);
    if (errors.name || errors.phone) {
      (errors.name ? contactName : contactPhone).current?.focus();
      return;
    }
    focusNextAction.current = true;
    const next = { ...draft, name, phone };
    setDraft(next);
    moveToReview(next);
  }

  function showBooking(booking: Booking, api: boolean, recovered: boolean) {
    setStage('done');
    say({ kind: 'result', booking, api, recovered });
  }

  function chooseAnotherTime(time: string) {
    setUnavailableSlot({ date: draft.date, time });
    setDraft((current) => ({ ...current, time: '' }));
    setStage('time');
    say({
      kind: 'warning',
      text: `${showingTool ? 'Phản hồi mô phỏng · 409. ' : ''}Khung ${time} vừa hết chỗ.`,
    });
  }

  function confirmBooking() {
    if (stage !== 'review' || offline || nextTask.current !== null) return;
    focusNextAction.current = true;
    if (showingTool) say({ kind: 'tool', draft });
    later('booking', async () => {
      if (
        !canUseTime(draft) ||
        (scenario === 'slot-conflict' && !unavailableSlot)
      ) {
        chooseAnotherTime(draft.time);
        return;
      }

      const booking = await createBooking(draft);
      if (!booking) {
        chooseAnotherTime(draft.time);
        return;
      }

      if (scenario === 'lost-response') {
        const result = { id: booking.id, api: showingTool };
        pendingChatBooking = result;
        setPending(result);
        setStage('recover');
        say({
          kind: 'warning',
          text: `${showingTool ? 'Phản hồi mô phỏng · 504. ' : ''}Chưa rõ yêu cầu đã được ghi nhận. Kiểm tra kết quả trước khi đặt lại.`,
        });
        return;
      }

      showBooking(booking, showingTool, false);
    });
  }

  function recoverBooking() {
    focusNextAction.current = true;
    later('recover', () => {
      const booking = bookings.find((item) => item.id === pending?.id);
      if (!booking) {
        pendingChatBooking = null;
        setPending(null);
        setStage('welcome');
        say({
          kind: 'warning',
          text: 'Không tìm thấy yêu cầu trong phiên này. Bạn có thể đặt bàn lại.',
        });
        return;
      }
      showBooking(booking, expanded && Boolean(pending?.api), true);
    });
  }

  function startNewBooking() {
    pendingChatBooking = null;
    setPending(null);
    setUnavailableSlot(null);
    setContactErrors({});
    focusNextAction.current = true;
    say({ kind: 'user', text: 'Tôi muốn đặt lượt khác.' });
    advance(newDraft);
  }

  function editBooking() {
    focusNextAction.current = true;
    setDraft((current) => ({ ...current, date: '', time: '' }));
    setStage('date');
    reply('Bạn chọn lại ngày và giờ.');
  }

  const slots = stage === 'time' ? getSlots(draft.date, draft.guests) : [];
  const hasOpenSlot = slots.some((slot) => slot.available);

  return (
    <div
      className="chat-widget"
      ref={widget}
      onKeyDown={(event) => {
        if (!open || event.key !== 'Escape') return;
        event.preventDefault();
        collapse();
      }}
    >
      <button
        type="button"
        className="chat-launcher"
        ref={launcher}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-haspopup="dialog"
        aria-label={open ? 'Thu gọn trợ lý AI' : 'Mở trợ lý AI'}
        title={open ? 'Thu gọn trợ lý AI' : 'Mở trợ lý AI'}
        onClick={() => (open ? collapse() : setOpen(true))}
      >
        {open ? (
          <X size={25} aria-hidden="true" />
        ) : (
          <MessageCircle size={26} aria-hidden="true" />
        )}
      </button>
      <section
        id="chat-panel"
        className="chat-panel"
        role="dialog"
        aria-labelledby="chat-title"
        aria-hidden={!open}
        data-open={open}
        inert={!open}
        tabIndex={-1}
        ref={panel}
      >
        <header className="chat-panel-header">
          <span className="chat-avatar">
            <Flame size={22} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div>
            <h2 id="chat-title">Trợ lý Ba Anh Em</h2>
            <p>Chat mẫu</p>
          </div>
          <button
            type="button"
            className="chat-close"
            onClick={collapse}
            aria-label="Đóng cửa sổ chat"
            title="Đóng cửa sổ chat"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </header>

        {expanded && (
          <label className="chat-tool-toggle">
            <Code2 size={17} aria-hidden="true" />
            <span>Xem trước thao tác API</span>
            <input
              type="checkbox"
              checked={toolEnabled}
              disabled={busy !== null}
              onChange={(event) => setToolEnabled(event.target.checked)}
            />
          </label>
        )}

        <div
          className="chat-scroll"
          ref={transcript}
          tabIndex={0}
          role="region"
          aria-label="Cuộc trò chuyện"
        >
          <div className="chat-shortcuts">
            <Link to="/thuc-don" onClick={followLink}>
              <Utensils size={16} aria-hidden="true" /> Thực đơn
            </Link>
            {stage !== 'recover' && (
              <Link to="/dat-ban" state={handoff} onClick={followLink}>
                <CalendarDays size={16} aria-hidden="true" /> Đặt bàn trên web
              </Link>
            )}
          </div>
          <div role="log" aria-label="Tin nhắn" className="chat-transcript">
            {messages.map((message, index) => {
              if (message.kind === 'dishes') {
                return (
                  <article key={index} className="chat-message chat-assistant">
                    <p>{message.text}</p>
                    <div className="chat-dish-list">
                      {message.dishes.map((dish) => (
                        <Link
                          key={dish.id}
                          className="chat-dish"
                          to={`/thuc-don?mon=${encodeURIComponent(dish.id)}`}
                          onClick={followLink}
                        >
                          <DishImage dish={dish} className="chat-dish-photo" />
                          <span>
                            <strong>{dish.name}</strong>
                            <small>
                              {dish.category} ·{' '}
                              {dish.price > 0
                                ? money(dish.price)
                                : 'Chưa công bố giá'}
                            </small>
                          </span>
                          <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                    <Link
                      to="/thuc-don"
                      className="chat-menu-link"
                      onClick={followLink}
                    >
                      Xem thực đơn <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </article>
                );
              }
              if (message.kind === 'review') {
                return (
                  <article key={index} className="chat-message chat-card">
                    <h3>Kiểm tra lại thông tin đặt bàn</h3>
                    <ChatFacts draft={message.draft} />
                    <p>
                      Số điện thoại mẫu · •••• {message.draft.phone.slice(-4)}
                    </p>
                  </article>
                );
              }
              if (message.kind === 'tool') {
                return (
                  <article
                    key={index}
                    className="chat-message chat-card chat-tool-card"
                  >
                    <ChatToolPreview draft={message.draft} />
                  </article>
                );
              }
              if (message.kind === 'result') {
                const { booking, api, recovered } = message;
                return (
                  <article
                    key={index}
                    className="chat-message chat-card chat-result"
                  >
                    {api && (
                      <p className="chat-api-caption">
                        <Code2 size={15} aria-hidden="true" />
                        {recovered
                          ? 'Phản hồi mô phỏng · 200'
                          : 'Phản hồi mô phỏng · 201'}
                      </p>
                    )}
                    <h3>
                      <CheckCircle2 size={19} aria-hidden="true" />
                      {recovered
                        ? 'Đã tìm thấy lượt đặt'
                        : 'Đã nhận yêu cầu đặt bàn'}
                    </h3>
                    <div className="chat-reference">
                      <strong>{booking.id}</strong>
                      <Status value={booking.status} kind="booking" />
                    </div>
                    <ChatFacts draft={booking} />
                    <Link
                      className="button secondary"
                      data-chat-next={
                        stage === 'done' && index === messages.length - 1
                          ? true
                          : undefined
                      }
                      to="/dat-ban/ket-qua"
                      onClick={() => {
                        if (pendingChatBooking?.id === booking.id)
                          pendingChatBooking = null;
                        setActiveId(booking.id);
                        followLink();
                      }}
                    >
                      Xem kết quả đặt bàn{' '}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </article>
                );
              }
              return (
                <p key={index} className={`chat-message chat-${message.kind}`}>
                  <span className="chat-sr-only">
                    {message.kind === 'user' ? 'Bạn: ' : 'Trợ lý: '}
                  </span>
                  {message.text}
                </p>
              );
            })}
          </div>

          <p className="chat-busy" role="status">
            {busy && (
              <>
                <span aria-hidden="true" />
                {busy === 'reply'
                  ? 'Trợ lý đang xử lý…'
                  : busy === 'booking'
                    ? 'Đang gửi yêu cầu…'
                    : 'Đang kiểm tra kết quả…'}
              </>
            )}
          </p>

          {offline && (
            <div className="chat-alert">
              <p>
                <WifiOff size={17} aria-hidden="true" /> Trợ lý tạm thời gián
                đoạn
              </p>
              {stage !== 'recover' && (
                <Link
                  to="/dat-ban"
                  state={handoff}
                  onClick={followLink}
                  data-chat-next
                >
                  Chuyển sang đặt bàn trên web{' '}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
          )}

          {failedPrompt && (
            <button
              className="button secondary chat-retry"
              type="button"
              disabled={busy !== null}
              onClick={() => {
                focusNextAction.current = true;
                later('reply', () => answer(failedPrompt));
              }}
            >
              <RotateCcw size={16} aria-hidden="true" /> Thử gửi lại
            </button>
          )}

          {stage === 'welcome' && !busy && !failedPrompt && (
            <div className="chat-prompts" aria-label="Gợi ý bắt đầu">
              <button type="button" onClick={() => send(suggests, true)}>
                <Utensils size={17} aria-hidden="true" />
                {suggests}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => send(asksBooking, true)}>
                <CalendarDays size={17} aria-hidden="true" />
                {asksBooking}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          {!busy && !offline && stage === 'date' && (
            <form className="chat-control" onSubmit={selectDate}>
              <label htmlFor="chat-date">Ngày đến</label>
              <div className="chat-field-row">
                <input
                  id="chat-date"
                  data-chat-next
                  type="date"
                  required
                  min={DEMO_DATE}
                  value={dateInput}
                  onChange={(event) => setDateInput(event.target.value)}
                />
                <button className="button secondary" type="submit">
                  Chọn ngày
                </button>
              </div>
            </form>
          )}

          {!busy && !offline && stage === 'guests' && (
            <form className="chat-control" onSubmit={selectGuests}>
              <label htmlFor="chat-guests">Số khách</label>
              <div className="chat-field-row">
                <select
                  id="chat-guests"
                  data-chat-next
                  value={partyInput}
                  onChange={(event) =>
                    setPartyInput(Number(event.target.value))
                  }
                >
                  {Array.from({ length: maxGuests }, (_, count) => (
                    <option key={count + 1} value={count + 1}>
                      {count + 1} khách
                    </option>
                  ))}
                </select>
                <button className="button secondary" type="submit">
                  Chọn số khách
                </button>
              </div>
            </form>
          )}

          {!busy && !offline && stage === 'time' && (
            <div className="chat-control">
              <h3>
                Khung giờ · {displayDate(draft.date)} · {draft.guests} khách
              </h3>
              {hasOpenSlot ? (
                <div className="chat-slots">
                  {slots.map((slot) => (
                    <button
                      className="button secondary"
                      key={slot.time}
                      type="button"
                      data-chat-next={slot.available ? true : undefined}
                      disabled={!slot.available}
                      onClick={() => send(slot.time, true)}
                    >
                      {slot.time}
                      {!slot.available && <small>Hết chỗ</small>}
                    </button>
                  ))}
                </div>
              ) : (
                <p role="status">
                  Ngày này không còn giờ trống cho nhóm của bạn.
                </p>
              )}
              <div className="chat-small-links">
                <button
                  type="button"
                  data-chat-next={hasOpenSlot ? undefined : true}
                  onClick={editBooking}
                >
                  Chọn lại ngày
                </button>
                <Link to="/dat-ban" state={handoff} onClick={followLink}>
                  Dùng trang đặt bàn
                </Link>
              </div>
            </div>
          )}

          {!busy && !offline && stage === 'contact' && (
            <form
              className="chat-control chat-contact"
              onSubmit={submitContact}
              noValidate
            >
              <h3>Thông tin liên hệ mẫu</h3>
              <label htmlFor="chat-name">Tên khách</label>
              <input
                id="chat-name"
                name="name"
                ref={contactName}
                data-chat-next
                required
                autoComplete="name"
                value={draft.name}
                aria-describedby={
                  contactErrors.name ? 'chat-name-error' : undefined
                }
                aria-invalid={contactErrors.name ? true : undefined}
                onChange={(event) => {
                  setDraft({ ...draft, name: event.target.value });
                  setContactErrors((current) => ({
                    ...current,
                    name: undefined,
                  }));
                }}
              />
              {contactErrors.name && (
                <p className="chat-error" id="chat-name-error" role="alert">
                  {contactErrors.name}
                </p>
              )}
              <label htmlFor="chat-phone">Số điện thoại</label>
              <input
                id="chat-phone"
                name="tel"
                ref={contactPhone}
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={draft.phone}
                aria-describedby={
                  contactErrors.phone ? 'chat-phone-error' : undefined
                }
                aria-invalid={contactErrors.phone ? true : undefined}
                onChange={(event) => {
                  setDraft({ ...draft, phone: event.target.value });
                  setContactErrors((current) => ({
                    ...current,
                    phone: undefined,
                  }));
                }}
              />
              {contactErrors.phone && (
                <p className="chat-error" id="chat-phone-error" role="alert">
                  {contactErrors.phone}
                </p>
              )}
              <div className="chat-small-links">
                <button
                  type="button"
                  onClick={() => {
                    setDraft((current) => ({
                      ...current,
                      name: 'Nguyễn An',
                      phone: '0900000000',
                    }));
                    setContactErrors({});
                  }}
                >
                  Điền liên hệ mẫu
                </button>
              </div>
              <button className="button secondary" type="submit">
                Xem lại yêu cầu <ArrowRight size={16} aria-hidden="true" />
              </button>
            </form>
          )}

          {stage === 'review' && (
            <div className="chat-control">
              {showingTool && busy !== 'booking' && (
                <div className="chat-tool-card">
                  <ChatToolPreview draft={draft} />
                  <p>Xác nhận để lưu lượt đặt vào dữ liệu mẫu.</p>
                </div>
              )}
              <button
                className="button"
                type="button"
                data-chat-next
                disabled={busy !== null || offline}
                onClick={confirmBooking}
              >
                {busy === 'booking'
                  ? 'Đang gửi yêu cầu…'
                  : 'Xác nhận gửi yêu cầu'}{' '}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <div className="chat-small-links">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={editBooking}
                >
                  Sửa ngày và giờ
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    focusNextAction.current = true;
                    setStage('contact');
                  }}
                >
                  Sửa liên hệ
                </button>
                {showingTool && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => {
                      setToolEnabled(false);
                      reply(
                        'Đã tắt xem trước API. Bạn vẫn có thể kiểm tra và gửi yêu cầu.',
                      );
                    }}
                  >
                    Tắt xem trước API
                  </button>
                )}
              </div>
            </div>
          )}

          {stage === 'recover' && (
            <div className="chat-control chat-recover">
              <h3>Kiểm tra yêu cầu vừa gửi</h3>
              <p>Kiểm tra mã đặt bàn và tình trạng yêu cầu trong phiên này.</p>
              <button
                className="button"
                type="button"
                data-chat-next
                disabled={busy !== null}
                onClick={recoverBooking}
              >
                <RotateCcw size={17} aria-hidden="true" />{' '}
                {busy === 'recover' ? 'Đang kiểm tra…' : 'Kiểm tra kết quả'}
              </button>
            </div>
          )}

          {!busy && !offline && stage === 'done' && (
            <button
              className="button secondary chat-retry"
              type="button"
              onClick={startNewBooking}
            >
              Đặt lượt khác
            </button>
          )}
        </div>

        <form
          className="chat-composer"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
            composer.current?.focus();
          }}
        >
          <label htmlFor="chat-message">Tin nhắn</label>
          <div className="chat-field-row">
            <input
              id="chat-message"
              ref={composer}
              value={input}
              maxLength={400}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Hỏi món hoặc đặt bàn…"
            />
            <button
              className="button"
              type="submit"
              disabled={!input.trim() || busy !== null}
              aria-label="Gửi tin nhắn"
              title="Gửi tin nhắn"
            >
              <Send size={19} aria-hidden="true" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
