import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  CircleAlert,
  CircleCheck,
  Info,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import type { Dish } from './model';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export function PageHead({
  title,
  description,
  action,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        {eyebrow && <div className="page-context">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-action">{action}</div>}
    </header>
  );
}

export function PublicPageIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="catalog-intro public-page-intro">
      <div className="container catalog-intro-inner public-page-intro-inner">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </header>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

const labels: Record<string, [string, Tone]> = {
  pending: ['Đang chờ', 'info'],
  confirmed: ['Đã xác nhận', 'success'],
  arrived: ['Đã đến', 'success'],
  completed: ['Đã phục vụ', 'neutral'],
  'no-show': ['Không đến', 'warning'],
  cancelled: ['Đã hủy', 'neutral'],
  review: ['Chờ xác minh', 'info'],
  verified: ['Đã xác minh', 'success'],
  exception: ['Cần đối chiếu', 'warning'],
  expired: ['Hết hiệu lực', 'danger'],
};

export function Status({
  value,
  kind,
}: {
  value: string;
  kind?: 'deposit' | 'booking';
}) {
  if (value === 'pending' && kind) {
    return (
      <Badge tone="info">
        {kind === 'deposit' ? 'Chờ chuyển cọc' : 'Chờ xác nhận'}
      </Badge>
    );
  }
  const [label, tone] = labels[value] ?? [value, 'neutral'];
  return <Badge tone={tone}>{label}</Badge>;
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`panel ${className}`}>{children}</div>;
}

export function Empty({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Info size={22} />
      </span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Notice({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  const Icon =
    tone === 'success'
      ? CircleCheck
      : tone === 'danger' || tone === 'warning'
        ? CircleAlert
        : Info;
  return (
    <div
      className={`notice tone-${tone}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon size={19} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  className = '',
  headerAction,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement;
    node?.showModal();
    return () => {
      if (node?.open) node.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={className ? `modal ${className}` : 'modal'}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="modal-head">
        <h2 id={headingId}>{title}</h2>
        {headerAction}
        <button
          type="button"
          className="icon-button"
          aria-label="Đóng"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </header>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}

export function DishImage({
  dish,
  className = '',
}: {
  dish: Dish;
  className?: string;
}) {
  const label = `Ảnh minh họa ${dish.name}`;
  const [failedImage, setFailedImage] = useState<string>();
  const source = dish.image;
  if (typeof source === 'string' && source !== failedImage) {
    return (
      <div className={`dish-photo ${className}`}>
        <img
          src={source}
          alt={label}
          loading="lazy"
          decoding="async"
          onError={() => setFailedImage(source)}
        />
      </div>
    );
  }
  if (typeof source !== 'number') {
    return (
      <span
        className={`dish-photo dish-photo-empty ${className}`}
        aria-hidden="true"
      >
        <UtensilsCrossed size={20} />
      </span>
    );
  }
  return (
    <div
      className={`dish-photo dish-photo-sprite dish-photo-${source} ${className}`}
      role="img"
      aria-label={label}
    />
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}
