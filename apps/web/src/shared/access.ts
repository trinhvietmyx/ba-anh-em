export const ROLE_LABELS = {
  customer: 'Khách hàng',
  employee: 'Nhân viên',
  admin: 'Quản trị viên (Admin)',
} as const;

export type Role = keyof typeof ROLE_LABELS;

export const OPS_PATHS = {
  home: '/van-hanh',
  signIn: '/van-hanh/dang-nhap',
  bookings: '/van-hanh/dat-cho',
  floor: '/van-hanh/so-do-ban',
  kitchen: '/van-hanh/chuan-bi-bep',
  deposits: '/van-hanh/dat-coc',
  reports: '/van-hanh/bao-cao',
  menu: '/van-hanh/thuc-don',
  events: '/van-hanh/dat-tiec',
  reviews: '/van-hanh/danh-gia',
} as const;

const operationalPages = new Set<string>([
  OPS_PATHS.home,
  OPS_PATHS.bookings,
  OPS_PATHS.floor,
  OPS_PATHS.kitchen,
  OPS_PATHS.deposits,
]);
const expandedAdminPages = new Set<string>([
  OPS_PATHS.menu,
  OPS_PATHS.events,
  OPS_PATHS.reviews,
]);

export function canAccessOperations(role: Role, path: string) {
  const [pathPart = ''] = path.split(/[?#]/, 1);
  const pathname = pathPart.replace(/\/+$/, '').toLowerCase();
  if (role === 'customer') return false;
  if (
    operationalPages.has(pathname) ||
    /^\/van-hanh\/dat-cho\/[^/]+$/.test(pathname)
  ) {
    return true;
  }
  return (
    role === 'admin' &&
    (pathname === OPS_PATHS.reports ||
      expandedAdminPages.has(pathname) ||
      /^\/van-hanh\/dat-cho\/[^/]+\/doi-huy$/.test(pathname))
  );
}
