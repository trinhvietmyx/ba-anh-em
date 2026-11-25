# Hợp đồng API

Workspace này chứa hợp đồng của các route đã đăng ký trong NestJS. Bản hiện tại có `getLiveness` và `getReadiness`. [Thiết kế API nghiệp vụ](../../docs/design/BACKEND_OPENAPI.yaml)

Chạy từ thư mục gốc của repo.

```sh
npm run contract:generate
npm run contract:check
```

`contract:generate` build API, đọc OpenAPI từ ứng dụng NestJS và cập nhật `generated/openapi.json` cùng `generated/index.d.ts`. Lệnh chạy độc lập với server HTTP và PostgreSQL. Mỗi khi sửa Swagger decorator hoặc đăng ký một route mới, chạy lại lệnh và đưa cả hai tệp sinh vào cùng thay đổi.

`contract:check` sinh lại dữ liệu trong bộ nhớ. Khi một tệp còn thiếu hoặc khác mã nguồn, lệnh báo tên tệp và thoát với mã lỗi để CI chặn thay đổi.

Frontend nhập kiểu theo `operationId` để chọn đúng response code.

```ts
import type { operations } from '@ba-anh-em/api-contract';

type Liveness =
  operations['getLiveness']['responses'][200]['content']['application/json'];
```

JSON contract dùng export `@ba-anh-em/api-contract/openapi.json`. Kiểm thử tích hợp đối chiếu contract này với endpoint OpenAPI runtime, kiểm ví dụ và payload HTTP bằng JSON Schema.
