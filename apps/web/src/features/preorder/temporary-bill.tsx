import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Download, Minus, Plus, ReceiptText, Trash2, X } from 'lucide-react';
import { Link } from 'react-router';
import { useRestaurant } from '../../app/restaurant-context';
import {
  bookingOpen,
  MAX_DISH_QUANTITY,
  money,
  type Dish,
} from '../../shared/model';
import { Badge, Modal } from '../../shared/ui';
import './temporary-bill.css';

export function TemporaryBill() {
  const { dishes, draftQuantities } = useRestaurant();
  const items = dishes.flatMap((dish) => {
    const quantity = draftQuantities[dish.id];
    return quantity ? [{ dish, quantity, amount: dish.price * quantity }] : [];
  });
  const count = items.reduce((sum, { quantity }) => sum + quantity, 0);
  const total = items.reduce((sum, { amount }) => sum + amount, 0);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousCount = useRef(count);

  useLayoutEffect(() => {
    const lastCount = previousCount.current;
    previousCount.current = count;
    if (
      count <= lastCount ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const motion = trigger.current?.animate(
      [
        { translate: lastCount === 0 ? '-112% 0' : '-64px 0' },
        { translate: '0 0' },
      ],
      { duration: 440, easing: 'cubic-bezier(0.3, 0.3, 0.25, 1)' },
    );
    return () => motion?.cancel();
  }, [count]);

  return (
    <>
      <span className="catalog-bill-status" role="status">
        {count
          ? `${count} phần, tạm tính ${money(total)}`
          : 'Chưa chọn món nào.'}
      </span>
      {count > 0 && (
        <ActiveBill
          items={items}
          count={count}
          total={total}
          trigger={trigger}
        />
      )}
    </>
  );
}

function ActiveBill({
  items,
  count,
  total,
  trigger,
}: {
  items: { dish: Dish; quantity: number; amount: number }[];
  count: number;
  total: number;
  trigger: RefObject<HTMLButtonElement | null>;
}) {
  const { activeBooking, changeDraftQuantity, scenario, setDraftQuantities } =
    useRestaurant();
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const totalRegion = useRef<HTMLDivElement>(null);
  const keepItems = useRef<HTMLButtonElement>(null);
  const clearButton = useRef<HTMLButtonElement>(null);
  const canContinue = activeBooking && bookingOpen(activeBooking);

  useEffect(() => {
    if (confirmClear) keepItems.current?.focus();
  }, [confirmClear]);

  function close() {
    setConfirmClear(false);
    setOpen(false);
  }

  function removeItem(id: string) {
    totalRegion.current?.focus({ preventScroll: true });
    setDraftQuantities((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function clearItems() {
    setDraftQuantities({});
  }

  function cancelClear() {
    setConfirmClear(false);
    requestAnimationFrame(() => clearButton.current?.focus());
  }

  const download = open
    ? [
        'Nhà hàng Ba Anh Em',
        'Hóa đơn tạm tính',
        'Giá mẫu, dùng để tham khảo.',
        '',
        ...items.map(
          ({ dish, quantity, amount }) =>
            `${dish.name} · ${quantity} × ${money(dish.price)} = ${money(amount)}`,
        ),
        '',
        `Tổng tiền món: ${money(total)}`,
      ].join('\r\n')
    : '';

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="temporary-bill-trigger"
        aria-haspopup="dialog"
        aria-label={`Hóa đơn tạm tính, ${count} phần, ${money(total)}`}
        onClick={() => setOpen(true)}
      >
        <ReceiptText size={22} aria-hidden="true" />
        <span>
          <small>Tạm tính · {count} phần</small>
          <strong>{money(total)}</strong>
        </span>
      </button>
      {open && (
        <Modal
          className="temporary-bill-dialog"
          onClose={close}
          title={
            <>
              <ReceiptText size={23} aria-hidden="true" /> Hóa đơn tạm tính
            </>
          }
          headerAction={
            download && (
              <a
                className="bill-download"
                href={`data:text/plain;charset=utf-8,${encodeURIComponent('\uFEFF' + download)}`}
                download="hoa-don-tam-tinh-ba-anh-em.txt"
                aria-label="Lưu về máy"
                title="Lưu về máy"
              >
                <Download size={17} aria-hidden="true" />
                <span>Lưu về máy</span>
              </a>
            )
          }
        >
          <div className="bill-totals" ref={totalRegion} tabIndex={-1}>
            <div className="summary-total">
              <h3>Tổng tiền món</h3>
              <strong aria-live="polite">{money(total)}</strong>
            </div>
            <p>Giá mẫu, dùng để tham khảo.</p>
          </div>
          <div className="bill-scroll">
            <ul className="catalog-bill-items">
              {items.map(({ dish, quantity, amount }) => {
                const available =
                  dish.available && dish.published && scenario !== 'empty';
                return (
                  <li className="catalog-bill-item" key={dish.id}>
                    <div className="bill-dish">
                      <strong>{dish.name}</strong>
                      <p>{money(dish.price)} / phần</p>
                      {!available && (
                        <Badge tone="warning">Tạm ngừng nhận đặt</Badge>
                      )}
                    </div>
                    <div className="quantity bill-quantity">
                      <button
                        type="button"
                        aria-label={`Bớt ${dish.name}`}
                        onClick={() => {
                          if (quantity === 1)
                            totalRegion.current?.focus({
                              preventScroll: true,
                            });
                          changeDraftQuantity(dish.id, -1);
                        }}
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <output aria-label={`Số lượng ${dish.name}`}>
                        {quantity}
                      </output>
                      <button
                        type="button"
                        aria-label={`Thêm ${dish.name}`}
                        disabled={!available || quantity >= MAX_DISH_QUANTITY}
                        onClick={() => changeDraftQuantity(dish.id, 1)}
                      >
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>
                    <strong className="bill-line-amount">
                      {money(amount)}
                    </strong>
                    <button
                      type="button"
                      className="icon-button bill-remove"
                      aria-label={`Xóa ${dish.name}`}
                      onClick={() => removeItem(dish.id)}
                    >
                      <X size={17} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <footer className="bill-footer">
            {confirmClear ? (
              <div
                className="bill-clear-prompt"
                role="group"
                aria-label="Xóa tất cả món đã chọn?"
              >
                <p>Xóa tất cả món đã chọn?</p>
                <div>
                  <button
                    ref={keepItems}
                    className="button secondary"
                    type="button"
                    onClick={cancelClear}
                  >
                    Giữ món
                  </button>
                  <button
                    className="button danger"
                    type="button"
                    onClick={clearItems}
                  >
                    Xóa hết
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  ref={clearButton}
                  type="button"
                  className="button tertiary bill-clear"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 size={17} aria-hidden="true" /> Xóa hết
                </button>
                <Link
                  className="button"
                  to={canContinue ? '/dat-ban/chon-mon' : '/dat-ban'}
                >
                  {canContinue
                    ? 'Tiếp tục chọn món'
                    : 'Đặt bàn với các món này'}
                </Link>
              </>
            )}
          </footer>
        </Modal>
      )}
    </>
  );
}
