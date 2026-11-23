# Cấu trúc dự án Full Stack — Nhà hàng Ba Anh Em

Cấu trúc nền được khởi tạo ở T05 trong [kế hoạch](IMPLEMENTATION_PLAN.md), dựa trên [BRS v0.1](../../documents/BRS-Nha-hang-Ba-Anh-Em.md). Repo có npm workspaces cho web, API, prototype đã duyệt và package hợp đồng. Tính đến 20/11/2026, `apps/web` đã nhận giao diện và nền tảng service/mock ban đầu từ Prototype; T08 vẫn đang làm vì chưa có OpenAPI từ Backend, xác thực thật và smoke test API.

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

- `apps/api/src/main.ts` đọc cấu hình khởi động, tạo ứng dụng và khai báo prefix API. `app.module.ts` là điểm lắp ghép module.
- API dùng CommonJS với phân giải TypeScript `NodeNext` trên Node.js 24 để dùng được các package ESM của NestJS 12 và giữ Jest cho backend theo kế hoạch. [Hướng dẫn NestJS 12](https://docs.nestjs.com/migration-guide#esm-packages).
- `modules/` dự kiến có `auth` và các miền tương ứng frontend. Controller phụ trách biên HTTP, dịch vụ thực hiện use case, repository truy vấn khi cần. Lịch, sức chứa và giao dịch giữ bàn thuộc `booking`. Các adapter Groq và VietQR thuộc `chat` và `deposits`.
- `platform/` chứa phần hạ tầng dùng chung như cấu hình, kết nối DB, giao dịch, logging và audit. Hiện có mã đọc cổng API và test gần mã. Module miền trao đổi qua interface dịch vụ. Web chỉ dùng HTTP và hợp đồng công khai.
- `db/migrations/` chứa migration theo phiên bản, `db/fixtures/` chứa dữ liệu thử. `db/import/` chứa quy trình nhập dữ liệu được kiểm soát. Kysely, node-postgres, migration runner và dữ liệu thử được triển khai tại T06. Chỉ thêm `jobs/` khi cần tác vụ nền theo thiết kế đã duyệt.
- `test/integration/` dành cho test API và giao dịch dùng PostgreSQL thật. Tách các test này khỏi Jest unit ở `src/`.

### Hợp đồng, kiểm thử và tài liệu

- `packages/api-contract/` dành cho OpenAPI và type sinh từ backend. Việc sinh artifact và kiểm tra chênh lệch chưa triển khai. `docs/design/api-contract.md` là bản nháp để chuẩn bị tích hợp, không phải hợp đồng đã duyệt.
- `tests/e2e/` chứa ca Playwright xuyên web/API. `tests/load/` chứa kịch bản k6. `tests/fixtures/` chứa dữ liệu thử cấp hệ thống.
- `docs/decisions/` giữ quyết định kiến trúc, `docs/design/` giữ thiết kế, `docs/qa/` giữ bằng chứng kiểm thử, `docs/runbooks/` giữ hướng dẫn vận hành.
- Các thư mục có `.gitkeep` là điểm đặt đã tổ chức sẵn. Thêm tệp thực tế khi đến task tương ứng.

### Cấu hình và hạ tầng

- Tệp gốc quản lý Node/npm, lockfile, TypeScript strict, lint, format và các lệnh dùng chung. Cấu hình Vite, NestJS và Jest nằm cùng workspace sở hữu.
- `infra/compose/compose.dev.yaml` cấu hình PostgreSQL 17 có volume, health check và cổng bind loopback. `infra/caddy/` dành cho cấu hình reverse proxy ở T25. Hướng dẫn local nằm ở [README](../README.md).
- `.github/workflows/ci.yml` định nghĩa bước cài theo lockfile, lint, format, kiểm kiểu, unit test, build, quét bí mật, kiểm advisory và xác thực cấu hình Compose. Tệp workflow nằm trong repo. Thực thi trên GitHub và đặt required checks thuộc cấu hình remote.
- `.env.example` có dữ liệu giả lập. `.env` và các biến thể chứa cấu hình cá nhân được Git bỏ qua. Vite đọc `API_PORT` để đặt proxy trong dev. Biến dùng cho DB và dịch vụ ngoài thuộc server.

## Checklist nghiệm thu

- [x] Xác minh 21 thư mục theo quy ước T05, 3 workspace trong lockfile và quy tắc bỏ qua `.env`.
- [x] SHA-256 của `IMPLEMENTATION_PLAN.md` và BRS khớp với trước khi khởi tạo.
- [x] `npm ci`, lint, format, kiểm kiểu, unit test và build các workspace chạy thành công trên Windows với Node 24.16.0 và npm 11.13.0.
- [x] `npm run dev` phục vụ HTML và điểm vào React. Smoke test dùng `API_PORT=3107` và đối chiếu phản hồi JSON 404 của NestJS qua Vite proxy và kết nối trực tiếp.
- [x] Compose CLI xác thực cấu hình PostgreSQL với `.env.example`.
- [x] YAML của workflow CI đọc được, có đúng các bước kiểm tra và phiên bản action.
- [ ] Xác minh container PostgreSQL đạt trạng thái healthy. Máy hiện tại thiếu Docker Engine.
- [ ] Xác minh CI chạy trên GitHub và cấu hình required checks. Repo hiện chưa có remote.

`npm audit --omit=dev` hiện báo 0 lỗ hổng cho các dependency runtime. Audit toàn bộ lockfile báo 18 mục mức moderate trong chuỗi công cụ kiểm thử Jest và 0 mục high hoặc critical.
