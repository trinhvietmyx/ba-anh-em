# Nhà hàng Ba Anh Em

Workspace Full Stack cho website nhà hàng. `apps/web` chạy giao diện với dữ liệu mô phỏng. `apps/api` có nền NestJS, health check, kết nối PostgreSQL 17 và OpenAPI local. Các API nghiệp vụ và đăng nhập được triển khai theo kế hoạch.

- [Cấu trúc dự án và checklist nghiệm thu](docs/PROJECT_STRUCTURE.md)
- [Kế hoạch triển khai](docs/IMPLEMENTATION_PLAN.md)
- [Bản đặc tả nghiệp vụ](docs/BRS-Nha-hang-Ba-Anh-Em.md)
- [Đánh giá mức sẵn sàng Frontend](docs/FRONTEND_READINESS.md)

## Chạy local

Cần Node.js 24.x từ 24.16.0 và npm 11.x. PostgreSQL 17 có thể chạy bằng Docker Compose hoặc bằng bản cài local. Web và API có thể khởi động khi DB chưa sẵn sàng.

1. Tại thư mục gốc, cài dependency từ lockfile.

   ```sh
   npm ci
   ```

2. Khi cần điều chỉnh cấu hình, tạo `.env` từ tệp mẫu nếu chưa có.

   PowerShell

   ```powershell
   if (-not (Test-Path -LiteralPath '.env')) {
     Copy-Item -LiteralPath '.env.example' -Destination '.env'
   }
   ```

   Linux hoặc macOS

   ```sh
   test -f .env || cp .env.example .env
   ```

3. Khởi động web và API trong một terminal.

   ```sh
   npm run dev
   ```

   Web mở ở `http://127.0.0.1:5173`. API mặc định lắng nghe tại `127.0.0.1:3000` với prefix `/api/v1`. Vite proxy các request có prefix này sang API. Có thể chạy riêng API bằng `npm run dev -w @ba-anh-em/api` hoặc riêng web bằng `npm run dev -w @ba-anh-em/web`.

   Nếu máy đã có bản Prototype riêng ở `apps/prototype`, dùng `npm run dev:prototype` để đối chiếu. Thư mục này được Git bỏ qua nên cần lấy từ nguồn lưu Prototype khi dựng checkout mới.

### Health check và OpenAPI

- `GET /api/v1/health/live` trả `200` khi tiến trình API tiếp nhận được yêu cầu.
- `GET /api/v1/health/ready` trả `200` khi kết nối được PostgreSQL 17, đọc được bảng nền và xác nhận các migration `001_base`, `002_auth` đã chạy. Tài khoản API cần quyền đọc `ba_anh_em.venues` và `ba_anh_em.kysely_migration`. DB thiếu, sai phiên bản, chưa migrate hoặc thiếu quyền đọc sẽ trả `503 NOT_READY`.
- `/api/v1/docs` mở Swagger UI, còn `/api/v1/openapi.json` cung cấp OpenAPI sinh từ route thực tế. Hai đường này dùng cho môi trường phát triển. Bản đặc tả API nghiệp vụ nằm trong [OpenAPI thiết kế](docs/design/BACKEND_OPENAPI.yaml).
- Mỗi phản hồi mang `X-Trace-Id`. Phản hồi lỗi trả mã, thông báo, `traceId` và khả năng thử lại để đối chiếu với log.

### Cấu hình PostgreSQL và API

`API_PORT` dùng chung cho NestJS và Vite proxy. `API_HOST` nhận địa chỉ IP và mặc định chỉ lắng nghe loopback. `NODE_ENV` nhận `development`, `test` hoặc `production`. Khi không khai báo biến, API mặc định dùng `development`. Trong `production`, API đọc cấu hình từ môi trường và tắt Swagger. Để dùng proxy cùng origin, để trống `API_CORS_ORIGINS`. Khi cần frontend khác origin, khai báo danh sách origin HTTP/HTTPS chính xác, phân cách bằng dấu phẩy.

Nếu dùng Compose, chạy các lệnh sau từ thư mục gốc.

```sh
docker compose --env-file .env -f infra/compose/compose.dev.yaml config --quiet
docker compose --env-file .env -f infra/compose/compose.dev.yaml up -d --wait
```

Cấu hình `MIGRATION_DATABASE_URL` cho tài khoản sở hữu schema trên DB local. Chạy build rồi chạy migration từ thư mục gốc.

```sh
npm run build -w @ba-anh-em/api
npm run db:migrate -w @ba-anh-em/api
```

Kysely ghi phiên bản trong `ba_anh_em.kysely_migration`. Lệnh có thể chạy lại sau khi thành công. Với database đã dùng [DDL kiểm chứng](docs/design/BACKEND_SCHEMA.sql), dùng database local mới để chạy migration. Các bảng tạo từ DDL kiểm chứng chưa có lịch sử migration.

Đặt `DATABASE_URL` cho tài khoản runtime riêng. Sau khi chạy migration, DBA hoặc tài khoản sở hữu schema cấp quyền cần cho health check. Nếu role chưa có, tạo role bằng `CREATE ROLE ba_anh_em_runtime LOGIN;` rồi đặt mật khẩu qua `\password ba_anh_em_runtime` trong `psql`.

```sql
GRANT USAGE ON SCHEMA ba_anh_em TO ba_anh_em_runtime;
GRANT SELECT ON ba_anh_em.venues, ba_anh_em.kysely_migration TO ba_anh_em_runtime;
```

### Phiên khách và đăng nhập nhân sự

Đặt `APP_ORIGIN` bằng origin trình duyệt dùng để mở web và gọi API cùng origin. Khi chạy Vite local, ví dụ là `http://127.0.0.1:5173`. Môi trường production yêu cầu HTTPS. Các endpoint trả `503` khi thiếu cấu hình phiên hoặc kết nối DB chưa được khai báo.

- Để bật phiên khách, đặt `GUEST_SESSION_TTL_SECONDS` theo thời hạn được duyệt và cấp `SELECT, INSERT` trên `ba_anh_em.guest_sessions` cho role runtime. `POST /api/v1/guest/session` cần `Origin` khớp `APP_ORIGIN`. Phản hồi cấp hoặc khôi phục cookie khách, đồng thời trả CSRF token cho lệnh ghi sau này.
- Để bật đăng nhập nhân sự, cấu hình `OIDC_ISSUER`, `OIDC_CLIENT_ID` và `OIDC_CLIENT_SECRET`. IdP cần hỗ trợ PKCE S256, xác thực client `client_secret_basic`, công bố khóa JWKS và cho phép redirect về `${APP_ORIGIN}/api/v1/ops/auth/callback`. Thời hạn tuyệt đối và hạn không hoạt động lấy từ `STAFF_SESSION_TTL_SECONDS` và `STAFF_SESSION_IDLE_SECONDS`. `STAFF_VENUE_CODE` khớp `venues.code` của nhà hàng đã chọn.
- DBA cấp các quyền runtime bên dưới cho đăng nhập nhân sự. Nhà hàng cấp danh tính bằng cặp issuer và subject trong `staff_users` và quyền theo từng nhà hàng trong `staff_venue_grants`. `display_role` dùng để hiển thị. Quyền mới có hiệu lực sau đăng nhập lại. Quyền đã thu hồi mất hiệu lực ở lần kiểm tiếp theo.
- API giới hạn mặc định `60` yêu cầu mỗi phút cho mỗi endpoint phiên và mỗi địa chỉ kết nối tới một tiến trình. Có thể chỉnh `AUTH_RATE_LIMIT_PER_MINUTE`. Khi chạy sau reverse proxy, API dùng địa chỉ kết nối trực tiếp và áp dụng chung hạn mức cho request qua proxy đó. Chính sách giới hạn theo người dùng cuối và ngưỡng dùng thử thuộc Q-14.

```sql
GRANT SELECT ON ba_anh_em.staff_users, ba_anh_em.staff_venue_grants TO ba_anh_em_runtime;
GRANT SELECT, INSERT ON ba_anh_em.staff_sessions TO ba_anh_em_runtime;
GRANT UPDATE (idle_expires_at, revoked_at) ON ba_anh_em.staff_sessions TO ba_anh_em_runtime;
GRANT SELECT, INSERT, DELETE ON ba_anh_em.staff_login_attempts TO ba_anh_em_runtime;
```

Cookie khách và nhân sự dùng `HttpOnly`, `Secure` và `SameSite=Lax`. Cookie tạm của OIDC có hạn 5 phút. API dọn một lô yêu cầu hết hạn khi bắt đầu lượt đăng nhập mới. Thời hạn lưu phiên và lịch dọn định kỳ tại nhà hàng cần chốt theo Q-14. Luồng đăng nhập API được kiểm trên IdP giả lập. Việc nối trang vận hành với đăng nhập thật phụ thuộc IdP và phân quyền đã được xác nhận.

### Seed và kiểm tra dữ liệu nhập

- Để seed fixture, migrate một database thử có tên kết thúc bằng `_test` hoặc `_test_<id>`. Đặt `NODE_ENV=test` và `BAE_TEST_SEED_DATABASE_URL` trỏ tới database đó với tài khoản được ghi. Chạy `npm run db:seed:test -w @ba-anh-em/api`. Chạy lại seed không ghi đè chỉnh sửa hiện có.
- Để kiểm tra tệp bố trí từ nhà hàng, truyền đường dẫn tuyệt đối bằng lệnh `npm run db:validate:import -w @ba-anh-em/api -- "D:/data/layout.json"`. Tệp JSON gồm `source`, `venue` với `code`, `name`, `timeZone`, các `areas` với `code`, `name`, `displayOrder`, và các `tables` với `code`, `areaCode`, `seats`. Lệnh xác minh dữ liệu ở chế độ đọc. Dữ liệu vận hành và lịch phục vụ thật sẽ được nhập sau khi nhà hàng xác nhận.

Trên PowerShell, dùng `npm.cmd` nếu chính sách thực thi chặn `npm.ps1`.

## Kiểm tra trước khi bàn giao

```sh
npm run lint
npm run format:check
npm run typecheck
npm run test:unit
npm run build
npm run test:integration
npm run contract:check
```

Suite tích hợp khởi động API trên cổng loopback ngẫu nhiên. Đặt `BAE_TEST_DATABASE_URL` cho ca readiness qua tài khoản runtime. Đặt `BAE_TEST_POSTGRES_ADMIN_URL` cho suite migration và phiên trên một cluster test với quyền tạo database và role. Suite phiên dùng IdP giả lập trên loopback và role runtime có quyền giới hạn. Suite dọn database và role kiểm thử đã tạo khi kết thúc. CI dựng PostgreSQL 17 cô lập, migrate schema và chạy các nhóm ca này.

Sau khi đổi route hoặc cấu trúc request/response, chạy `npm run contract:generate` để sinh lại OpenAPI và type frontend. [Hướng dẫn hợp đồng API](packages/api-contract/README.md)

### Smoke test trình duyệt

```sh
npm exec -- playwright install --only-shell chromium
npm run test:e2e
```

Playwright khởi động riêng NestJS và Vite trên cổng loopback `3310` và `5317`. Có thể đổi cổng bằng `BAE_E2E_API_PORT` và `BAE_E2E_WEB_PORT` nếu cổng mặc định bận. Test mở trang chủ, gọi liveness và readiness qua Vite proxy. Khi cung cấp `BAE_TEST_DATABASE_URL` trỏ tới PostgreSQL 17 đã migrate, test kiểm readiness `200`. Mặc định test kiểm trạng thái `503 NOT_READY` của API khi thiếu database.

Để kiểm cookie khách qua Vite proxy, chạy thêm với `BAE_E2E_GUEST_SESSION=1`. Dùng database thử trong `BAE_TEST_DATABASE_URL` và cấp thêm quyền `SELECT, INSERT` trên `ba_anh_em.guest_sessions` cho role kiểm thử.

Xem [checklist nghiệm thu](docs/PROJECT_STRUCTURE.md#checklist-nghiệm-thu) để biết phạm vi đã kiểm tra và các bước còn phụ thuộc môi trường.
