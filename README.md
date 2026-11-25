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
- `GET /api/v1/health/ready` trả `200` khi kết nối được PostgreSQL 17 và tài khoản API có quyền đọc `ba_anh_em.venues`. Thiếu DB, sai phiên bản, thiếu schema hoặc thiếu quyền trả `503 NOT_READY`. DB rỗng từ Compose cần schema để đạt readiness.
- `/api/v1/docs` mở Swagger UI, còn `/api/v1/openapi.json` cung cấp OpenAPI sinh từ route thực tế. Hai đường này dùng cho môi trường phát triển. Bản đặc tả API nghiệp vụ nằm trong [OpenAPI thiết kế](docs/design/BACKEND_OPENAPI.yaml).
- Mỗi phản hồi mang `X-Trace-Id`. Phản hồi lỗi trả mã, thông báo, `traceId` và khả năng thử lại để đối chiếu với log.

### Cấu hình PostgreSQL và API

`API_PORT` dùng chung cho NestJS và Vite proxy. `API_HOST` nhận địa chỉ IP và mặc định chỉ lắng nghe loopback. `NODE_ENV` nhận `development`, `test` hoặc `production`. Khi không khai báo biến, API mặc định dùng `development`. Trong `production`, API đọc cấu hình từ môi trường và tắt Swagger. Để dùng proxy cùng origin, để trống `API_CORS_ORIGINS`. Khi cần frontend khác origin, khai báo danh sách origin HTTP/HTTPS chính xác, phân cách bằng dấu phẩy.

Nếu dùng Compose, chạy các lệnh sau từ thư mục gốc.

```sh
docker compose --env-file .env -f infra/compose/compose.dev.yaml config --quiet
docker compose --env-file .env -f infra/compose/compose.dev.yaml up -d --wait
```

Cập nhật `DATABASE_URL` nếu dùng tài khoản hoặc cổng PostgreSQL khác mẫu. File [DDL kiểm chứng](docs/design/BACKEND_SCHEMA.sql) dành cho database thử trống. Migration có phiên bản và dữ liệu seed thuộc T06. Trên PowerShell, dùng `npm.cmd` nếu chính sách thực thi chặn `npm.ps1`.

## Kiểm tra trước khi bàn giao

```sh
npm run lint
npm run format:check
npm run typecheck
npm run test:unit
npm run build
npm run test:integration
```

Suite tích hợp khởi động API trên cổng loopback ngẫu nhiên. Đặt `BAE_TEST_DATABASE_URL` trong môi trường kiểm thử để chạy thêm ca readiness với PostgreSQL 17 đã có schema nền. CI tạo database kiểm thử riêng từ Compose, áp dụng DDL kiểm chứng và gọi readiness qua tài khoản chỉ có quyền đọc bảng nền.

Xem [checklist nghiệm thu](docs/PROJECT_STRUCTURE.md#checklist-nghiệm-thu) để biết phạm vi đã kiểm tra và các bước còn phụ thuộc môi trường.
