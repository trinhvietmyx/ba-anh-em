import { useEffect, useRef } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router';
import {
  BookingPage,
  BookingResult,
  DepositPage,
  Preorder,
} from '../features/booking/booking';
import { Catalog } from '../features/menu/catalog';
import {
  BookingLookup,
  ChangeBooking,
  EventOperations,
  EventRequest,
  MenuAdmin,
  ReviewForm,
  ReviewOperations,
} from '../features/extensions/extensions';
import { Home } from '../features/home/home';
import {
  OpsDeposits,
  OpsDetail,
  OpsFloor,
  OpsKitchen,
  OpsLayout,
  OpsList,
  OpsReports,
  OpsSignIn,
} from '../features/operations/operations';
import { Empty } from '../shared/ui';
import { PublicLayout } from '../app/public-layout';

function RoutePosition() {
  const { pathname } = useLocation();
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    window.scrollTo(0, 0);
    if (!document.querySelector('dialog[open]')) {
      document
        .querySelector<HTMLElement>('#prototype-content, #ops-main')
        ?.focus({ preventScroll: true });
    }
  }, [pathname]);
  return null;
}

function Recovery() {
  return (
    <div className="container public-page">
      <Empty
        title="Không tìm thấy trang"
        description="Kiểm tra đường dẫn hoặc về trang chủ."
        action={
          <Link className="button" to="/">
            Về trang chủ
          </Link>
        }
      />
    </div>
  );
}

export function AppRoutes() {
  return (
    <>
      <RoutePosition />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="thuc-don" element={<Catalog />} />
          <Route path="dat-ban" element={<BookingPage />} />
          <Route path="dat-ban/chon-mon" element={<Preorder />} />
          <Route path="dat-ban/dat-coc" element={<DepositPage />} />
          <Route path="dat-ban/ket-qua" element={<BookingResult />} />
          <Route path="tro-ly" element={<Home />} />
          <Route path="tra-cuu-dat-cho" element={<BookingLookup />} />
          <Route path="dat-tiec" element={<EventRequest />} />
          <Route path="danh-gia" element={<ReviewForm />} />
          <Route path="*" element={<Recovery />} />
        </Route>
        <Route path="van-hanh/dang-nhap" element={<OpsSignIn />} />
        <Route path="van-hanh" element={<OpsLayout />}>
          <Route index element={<Navigate to="dat-cho" replace />} />
          <Route path="dat-cho" element={<OpsList />} />
          <Route path="dat-cho/:id" element={<OpsDetail />} />
          <Route path="so-do-ban" element={<OpsFloor />} />
          <Route path="chuan-bi-bep" element={<OpsKitchen />} />
          <Route path="dat-coc" element={<OpsDeposits />} />
          <Route path="bao-cao" element={<OpsReports />} />
          <Route path="thuc-don" element={<MenuAdmin />} />
          <Route path="dat-cho/:id/doi-huy" element={<ChangeBooking />} />
          <Route path="dat-tiec" element={<EventOperations />} />
          <Route path="danh-gia" element={<ReviewOperations />} />
        </Route>
      </Routes>
    </>
  );
}
