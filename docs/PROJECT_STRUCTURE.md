# Cấu trúc dự án Full Stack — Nhà hàng Ba Anh Em

Cấu trúc nền được khởi tạo ở T05 trong [kế hoạch](IMPLEMENTATION_PLAN.md), dựa trên [BRS v0.1](BRS-Nha-hang-Ba-Anh-Em.md). Repo có npm workspaces cho web, API, prototype đã duyệt và package hợp đồng. `apps/web` dùng giao diện và lớp service ban đầu từ Prototype. T08 đã có OpenAPI sinh từ NestJS và smoke test API qua Vite proxy. Tích hợp xác thực nhân sự vào giao diện cần IdP và ma trận quyền đã được xác nhận.

## Cây thư mục

```text
ba-anh-em/
├── .github/workflows/ci.yml
├── apps/
│   ├── prototype/             # Bản Prototype đã duyệt, giữ làm baseline đối chiếu
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── modules/
│   │   │   └── platform/config/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   ├── fixtures/
│   │   │   └── import/
│   │   ├── test/integration/
│   │   └── package.json, nest-cli.json, tsconfig*.json, jest.config.cjs
│   └── web/
│       ├── src/
│       │   ├── main.tsx, app/
│       │   ├── routes/index.tsx
│       │   ├── features/{booking,chat,extensions,home,menu,operations,preorder}/
│       │   ├── mocks/
│       │   ├── services/
│       │   └── shared/
│       ├── public/images/      # Tài sản ảnh của Prototype được dùng trong web
│       └── package.json, index.html, tsconfig.json, vite.config.ts
├── packages/api-contract/
├── tests/
│   ├── e2e/
│   ├── fixtures/
│   └── load/
├── infra/
│   ├── compose/compose.dev.yaml
│   └── caddy/
├── docs/
│   ├── decisions/
│   ├── design/
│   ├── qa/
│   ├── runbooks/
│   ├── IMPLEMENTATION_PLAN.md
│   └── PROJECT_STRUCTURE.md
├── .env.example
├── .node-version, .npmrc, .editorconfig, .gitignore
├── package.json, package-lock.json, tsconfig.base.json
├── eslint.config.mjs, .prettierrc.json, .prettierignore
└── README.md
```

## Trách nhiệm và ranh giới

### Frontend

- `apps/web/src/main.tsx` gắn React, font và CSS nền. `app/` lắp provider và layout; `routes/index.tsx` giữ route khách/vận hành đã duyệt.
- `features/` nhóm màn hình theo miền: `home`, `menu`, `booking`, `preorder`, `chat`, `operations` và `extensions`. Các component và CSS hiện giữ phong cách Prototype; tiếp tục tách theo trách nhiệm khi có nhu cầu thực tế.
- `services/` định nghĩa service, HTTP transport và mock service. `mocks/` lưu fixture dùng thử. `shared/` giữ model, quyền UI, component nền và CSS/token. TanStack Query quản lý cache menu/đặt chỗ đang nối qua mock service; các luồng còn lại chưa chuyển hết sang API.
- `apps/prototype/` là baseline được phê duyệt để đối chiếu UI; không nhập thêm vào bundle web và không xóa trong giai đoạn chuẩn hóa.

### Backend và database

- `apps/api/src/main.ts` nạp cấu hình local, kiểm biến môi trường và khởi động. `api-app.ts` lắp prefix `/api/v1`, giới hạn JSON, CORS, biên lỗi, validation, log và OpenAPI local. `app.module.ts` lắp các module và provider.
- API dùng CommonJS với phân giải TypeScript `NodeNext` trên Node.js 24 để dùng được các package ESM của NestJS 12 và giữ Jest cho backend theo kế hoạch. [Hướng dẫn NestJS 12](https://docs.nestjs.com/migration-guide#esm-packages).
- `modules/auth/` vận hành phiên khách, đăng nhập nhân sự OIDC, giới hạn tần suất và kiểm quyền theo nhà hàng. Lịch, sức chứa và giao dịch giữ bàn thuộc miền `booking`. Các adapter Groq và VietQR thuộc `chat` và `deposits`.
- `modules/menu/` đọc thực đơn công bố cho khách và phục vụ thao tác quản lý có quyền theo nhà hàng. Dữ liệu mẫu thực đơn được seed từ danh mục của web vào database thử.
- `modules/booking/` tính khung giờ từ lịch và sức chứa, giữ bàn trong transaction và cho phiên khách đọc lại lượt. Lát đặt bàn hiện chạy với dữ liệu thử local.
- `platform/` chứa cấu hình, kết nối DB, health check và xử lý HTTP dùng chung. Liveness kiểm tiến trình. Readiness kiểm PostgreSQL 17, quyền đọc bảng nền và lịch sử migration từ `001_base` đến `004_booking`.
- `src/platform/db/` chứa CLI, các migration TypeScript, fixture và trình kiểm tra tệp bố trí. `apps/api/db/` dành cho tệp dữ liệu nhập và tài sản database ngoài mã.
- `test/integration/` dùng trình chạy test của Node cho HTTP, PostgreSQL 17 và OIDC giả lập. `BAE_TEST_DATABASE_URL` bật ca readiness. `BAE_TEST_POSTGRES_ADMIN_URL` bật ca migration và phiên trên database test cô lập. Jest chạy unit test trong `src/`.

### Hợp đồng, kiểm thử và tài liệu

- `packages/api-contract/generated/` chứa OpenAPI và type được sinh từ route NestJS đang triển khai. `scripts/contract.mjs` sinh và đối chiếu hai tệp. Package xuất type cho web và JSON cho bộ kiểm tích hợp. [Hướng dẫn hợp đồng](../packages/api-contract/README.md) · [OpenAPI thiết kế](design/BACKEND_OPENAPI.yaml)
- `tests/e2e/` có smoke Playwright mở trang chủ và gọi NestJS qua Vite proxy. `tests/load/` dành cho kịch bản k6. `tests/fixtures/` chứa dữ liệu thử cấp hệ thống.
- `docs/decisions/` giữ quyết định kiến trúc, `docs/design/` giữ thiết kế, `docs/qa/` giữ bằng chứng kiểm thử, `docs/runbooks/` giữ hướng dẫn vận hành.
- Các thư mục có `.gitkeep` là điểm đặt đã tổ chức sẵn. Thêm tệp thực tế khi đến task tương ứng.

### Cấu hình và hạ tầng

- Tệp gốc quản lý Node/npm, lockfile, TypeScript strict, lint, format và các lệnh dùng chung. Cấu hình Vite, NestJS và Jest nằm cùng workspace sở hữu.
- `infra/compose/compose.dev.yaml` cấu hình PostgreSQL 17 có volume, health check và cổng bind loopback. `infra/caddy/` dành cho cấu hình reverse proxy ở T25. Hướng dẫn local nằm ở [README](../README.md).
- `.github/workflows/ci.yml` định nghĩa cài theo lockfile, lint, format, kiểm kiểu, unit test, build, quét bí mật, kiểm advisory và integration test với PostgreSQL 17 cô lập. Kết quả chạy trên GitHub và required checks phụ thuộc cấu hình remote.
- `.env.example` có dữ liệu giả lập. `.env` và các biến thể chứa cấu hình cá nhân được Git bỏ qua. Vite đọc `API_PORT` để đặt proxy trong dev. Biến dùng cho DB và dịch vụ ngoài thuộc server.

## Checklist nghiệm thu

- [x] Xác minh 21 thư mục theo quy ước T05, 3 workspace trong lockfile và quy tắc bỏ qua `.env`.
- [x] SHA-256 của `IMPLEMENTATION_PLAN.md` và BRS khớp với trước khi khởi tạo.
- [x] `npm ci`, lint, format, kiểm kiểu, unit test và build các workspace chạy thành công trên Windows với Node 24.16.0 và npm 11.13.0.
- [x] `npm run dev` phục vụ HTML và điểm vào React. Smoke test dùng `API_PORT=3107` và đối chiếu phản hồi JSON 404 của NestJS qua Vite proxy và kết nối trực tiếp.
- [x] Compose CLI xác thực cấu hình PostgreSQL với `.env.example`.
- [x] YAML của workflow CI đọc được, có đúng các bước kiểm tra và phiên bản action.
- [x] Nền API trả liveness và OpenAPI runtime qua HTTP local. Đã kiểm Vite proxy và readiness với tài khoản đọc bảng nền trên PostgreSQL 17.12 tạm.
- [ ] Xác minh container PostgreSQL đạt trạng thái healthy. Máy hiện tại thiếu Docker Engine.
- [ ] Xác minh CI chạy trên GitHub và cấu hình required checks. Repo hiện chưa có remote.

`npm audit --omit=dev` hiện báo 0 lỗ hổng cho các dependency runtime. Audit toàn bộ lockfile báo 18 mục mức moderate trong chuỗi công cụ kiểm thử Jest và 0 mục high hoặc critical.
