# Nhà hàng Ba Anh Em

Workspace Full Stack cho website nhà hàng. `apps/web` hiện chạy giao diện đã chuyển từ Prototype bằng dữ liệu mô phỏng; NestJS và PostgreSQL mới ở nền tảng, chưa có API nghiệp vụ hoặc đăng nhập thật. Bản Prototype đã duyệt được giữ riêng trong `apps/prototype`.

- [Cấu trúc dự án và checklist nghiệm thu](docs/PROJECT_STRUCTURE.md)
- [Kế hoạch triển khai](docs/IMPLEMENTATION_PLAN.md)
- [Bản đặc tả nghiệp vụ](../documents/BRS-Nha-hang-Ba-Anh-Em.md)
- [Đánh giá mức sẵn sàng Frontend](FRONTEND_READINESS.md)

## Chạy local

Cần Node.js 24.x từ 24.16.0 và npm 11.x. Các máy phát triển nên dùng bản vá Node.js 24 LTS đang được hỗ trợ. Docker Engine và Docker Compose cần cho phần PostgreSQL.

1. Tại thư mục gốc, cài dependency từ lockfile.

   ```sh
   npm ci
   ```

2. Để chạy PostgreSQL, tạo `.env` từ tệp mẫu nếu chưa có. Có thể chạy riêng web/API bằng cấu hình mặc định khi chưa dựng DB.

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

   ```sh
   docker compose --env-file .env -f infra/compose/compose.dev.yaml config --quiet
   docker compose --env-file .env -f infra/compose/compose.dev.yaml up -d --wait
   ```

3. Khởi động web và API trong một terminal.

   ```sh
   npm run dev
   ```

   Web mở ở `http://127.0.0.1:5173`. API lắng nghe cổng `3000` theo mặc định, với prefix `/api/v1`. Truy cập một đường dẫn API chưa khai báo sẽ trả `404`. Vite chuyển các request bắt đầu bằng `/api/v1` sang cổng API local.

   `apps/web` hiện dùng mock service; việc khởi động NestJS không đồng nghĩa các màn hình đã nối tới API nghiệp vụ. Để chỉ chạy web: `npm run dev --workspace=@ba-anh-em/web`. Để so sánh lại Prototype đã duyệt: `npm run dev:prototype`.

`API_PORT` trong `.env` dùng chung cho NestJS và Vite proxy. Khi đổi thông tin hoặc cổng PostgreSQL, cập nhật cả `DATABASE_URL` dùng ở T06. Các thông tin trong `.env.example` chỉ dành cho local. Trên PowerShell, có thể dùng `npm.cmd` nếu chính sách thực thi chặn `npm.ps1`.

## Kiểm tra trước khi bàn giao

```sh
npm run lint
npm run format:check
npm run typecheck
npm run test:unit
npm run build
```

Xem [checklist nghiệm thu](docs/PROJECT_STRUCTURE.md#checklist-nghiệm-thu) để biết phạm vi đã kiểm tra và các bước còn phụ thuộc môi trường.
