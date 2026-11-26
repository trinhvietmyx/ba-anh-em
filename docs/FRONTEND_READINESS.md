# Frontend Readiness — Nhà hàng Ba Anh Em

**Ngày rà soát ban đầu:** 20/11/2026

**Phạm vi:** Chuẩn hóa workspace web từ Prototype được duyệt; chưa triển khai Backend, Database hay tích hợp API thật.

**Kết luận:** Frontend chạy ổn định ở local với mock data và đã qua các quality gate hiện có. Chưa đủ điều kiện gọi là production-ready để nhận đặt chỗ hoặc giao dịch thật vì xác thực, API nghiệp vụ, OpenAPI được duyệt, xử lý dữ liệu bền vững và kiểm thử e2e/accessibility đầy đủ chưa có.

## 1. Hiện trạng và đối chiếu

- Repo có `apps/web` React/Vite; giao diện 23 màn hình/biến thể đã được chuyển sang workspace này.
- Source Prototype được lưu dự phòng tại `backups/approved-prototype-2026-11-26.zip` trên máy tạo archive. Bản ZIP nằm trong thư mục bị Git ignore; giao diện và tài sản ảnh phục vụ chạy ứng dụng hiện nằm trong `apps/web`.
- Route khách và vận hành đã tách khỏi điểm khởi động. UI quản lý menu/đặt chỗ qua React Query và mock service. Fixture, model, HTTP transport và component UI dùng chung được tách riêng.
- Bản nháp API hiện ở [`docs/design/api-contract.md`](docs/design/api-contract.md). Đây chưa phải OpenAPI đã duyệt. Các quyết định Q-01…Q-15 còn mở trong BRS vẫn được giữ là câu hỏi, không chuyển thành quy tắc triển khai.
- Ngày 26/11/2026, workspace `apps/prototype` được gỡ khỏi cấu hình npm và thư mục nguồn được xóa sau khi xác minh ZIP dự phòng chứa đủ 194 tệp.

### Đã hoàn thành trong bước này

- `apps/web/src/app/`: root app, provider dữ liệu và layout khách.
- `apps/web/src/routes/index.tsx`: route khách, route vận hành, chuyển hướng và màn hình không tìm thấy.
- `apps/web/src/features/`: `home`, `menu`, `booking`, `preorder`, `chat`, `operations`, `extensions`.
- `apps/web/src/shared/`: model, quyền hiển thị, component nền và CSS/tokens.
- `apps/web/src/mocks/`: fixture menu, đặt chỗ, sự kiện/đánh giá mẫu cùng test bảo toàn fixture.
- `apps/web/src/services/`: kiểu lỗi/transport HTTP có cấu trúc, interface service và mock service cho menu/đặt chỗ.
- Font, CSS, ảnh và meta trang được khai báo trong workspace web; không dùng toolbar dữ liệu thử của Prototype trong giao diện web.
- Tách mẫu dữ liệu khỏi một số màn hình mở rộng; source trước chuyển đổi được giữ dưới dạng ZIP dự phòng cục bộ.

### Thành phần dùng chung có thể tái sử dụng

| Nhóm            | Thành phần / trách nhiệm                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Ứng dụng        | `App`, provider React Query/context, public layout, định vị focus khi đổi route                                         |
| Điều hướng      | Header/footer khách, nav khách, layout và sidebar vận hành, guard tuyến UI theo vai trò demo                            |
| UI nền          | Button, input/select, panel, trạng thái rỗng, toast/dialog và hiển thị trạng thái                                       |
| Khách hàng      | Hero/trang chủ, thẻ món, nhóm và tìm món, luồng đặt bàn, chọn món, bill tạm tính, cọc, tra cứu, tiệc, đánh giá, chatbot |
| Vận hành        | Danh sách/chi tiết đặt chỗ, sơ đồ bàn, chuẩn bị bếp, đối chiếu cọc, báo cáo, quản lý menu, tiệc và đánh giá             |
| Dữ liệu/dịch vụ | Model đặt chỗ/menu, fixtures, mock restaurant service, HTTP client và `ApiServiceError`                                 |

Các feature hiện còn tập trung nhiều màn hình trong một vài module. Chưa tách component theo từng màn hình nếu việc đó không phục vụ trực tiếp bước hiện tại; tránh refactor lớn làm lệch UI đã duyệt.

## 2. API cần Backend triển khai

Danh sách dưới đây theo API outline mục 3.1 của `IMPLEMENTATION_PLAN.md`; contract/shape request-response trong tài liệu liên kết vẫn là dự thảo. Không tạo endpoint ngoài danh sách đã thống nhất.

| Ưu tiên nghiệp vụ | Endpoint dự kiến                                 | Mục đích màn hình                         |
| ----------------- | ------------------------------------------------ | ----------------------------------------- |
| MVP               | `GET /menu`                                      | Trang chủ, danh sách món, chọn món        |
| MVP               | `GET /availability`                              | Kiểm tra ngày, giờ, số khách              |
| MVP               | `POST /reservations`                             | Gửi lượt đặt bàn                          |
| MVP               | `PUT /reservations/{id}/preorders`               | Lưu món đặt trước                         |
| MVP               | `POST /reservations/{id}/deposits`               | Tạo thông tin cọc/VietQR                  |
| MVP               | `GET /reservations/{id}/deposits/{depositId}`    | Đọc trạng thái cọc                        |
| MVP               | `GET /ops/reservations`                          | Danh sách vận hành                        |
| MVP               | `GET /ops/reservations/{id}`                     | Chi tiết lượt đặt                         |
| MVP               | `GET /ops/floorplan`                             | Sơ đồ và tình trạng bàn                   |
| MVP               | `PUT /ops/reservations/{id}/allocation`          | Ghi bố trí bàn                            |
| MVP               | `POST /ops/reservations/{id}/service-events`     | Ghi nhận kết quả phục vụ                  |
| MVP               | `GET /ops/kitchen/preparations`                  | Món cần chuẩn bị                          |
| MVP               | `POST /ops/deposits/{depositId}/reconciliations` | Đối chiếu cọc                             |
| MVP               | `GET /ops/reports`                               | Báo cáo theo bộ chỉ số được duyệt         |
| MVP               | `POST /chat/messages`                            | Chat tư vấn/thao tác qua bước xác nhận UI |

Đặt tiệc, đánh giá và một số chức năng mở rộng đã có trên Prototype nhưng chưa có endpoint trong API outline hiện tại. Cần đối chiếu BRS/phạm vi được duyệt ở T03 trước khi bổ sung hợp đồng. Không suy ra endpoint cho chúng ở giai đoạn này.

## 3. Lớp dịch vụ và contract hiện có

- HTTP transport hỗ trợ method/body/header/signal, JSON và `204 No Content`; chuyển lỗi HTTP có cấu trúc thành `ApiServiceError` gồm status, code, lỗi field, trace ID và khả năng thử lại.
- Mock service hiện triển khai `getMenu`, `getReservations`, `createReservation`, `updateReservation` và `replaceMenu`. Fixture được clone để ngăn view sửa trực tiếp dữ liệu gốc. Quy tắc tạo đặt chỗ đi qua model/use case hiện có của Prototype.
- React Query đang cung cấp cache cho menu/đặt chỗ qua mock. Trạng thái vai trò, scenario và một số tương tác mở rộng vẫn là trạng thái cục bộ của Prototype.
- Chưa có adapter HTTP nghiệp vụ nối tới NestJS; service hiện tại dùng mock. Chưa có OpenAPI sinh từ NestJS, client type sinh tự động, contract drift check hoặc cơ chế auth/idempotency thật.
- Cấu trúc `ApiClient` sẵn sàng làm transport nền; thay mock bằng API thật chỉ sau khi T03/T07 chốt schema và quyền. Không dùng bản nháp contract như nguồn xác thực.

## 4. Kiểm thử và xác minh

### Quality gates đã chạy (mốc rà soát 20/11/2026)

| Kiểm tra               | Kết quả                                  |
| ---------------------- | ---------------------------------------- |
| `npm run format:check` | Đạt                                      |
| `npm run lint`         | Đạt                                      |
| `npm run typecheck`    | Đạt cho API, Prototype và web workspaces |
| `npm run test:unit`    | Đạt: 24 test (API 9, Prototype 6, web 9) |
| `npm run build`        | Đạt cho API, Prototype và web workspaces |

### Kiểm tra trình duyệt thủ công

- 18 route được mở trực tiếp; 8 route vận hành chuyển về đăng nhập khi vai trò vẫn là khách. Không có lỗi runtime hoặc request tài nguyên local thất bại; ảnh được kiểm tra không có ảnh local bị lỗi tải.
- 28 tổ hợp của 4 trang chính (`/`, `/thuc-don`, `/dat-ban`, `/van-hanh/dang-nhap`) ở độ rộng 320, 360, 375, 414, 768, 1024 và 1368 px không có tràn ngang.
- Đã thao tác tạo đặt bàn và xác nhận trang kết quả có mã lượt mẫu; thêm món, mở hóa đơn tạm tính, kiểm tra món xuất hiện; mở/đóng chatbot.
- Đã đăng nhập mô phỏng bằng vai trò Nhân viên và Admin để kiểm tra menu vận hành tương ứng. Đây chỉ là phân quyền UI trong bộ nhớ.
- Đã xem giao diện trang chủ trực tiếp ở desktop để đối chiếu tổng thể. Chưa chạy so sánh pixel tự động giữa Prototype và web.

### Chưa kiểm chứng

- Chưa có test component/e2e tự động; thao tác trình duyệt ở trên là smoke test thủ công.
- Chưa chạy audit WCAG đầy đủ, screen reader, browser/device thật, kiểm thử touch chi tiết hoặc kiểm tra performance/Core Web Vitals.
- Chưa kiểm tra luồng với API thật, session/cookie, CSRF, quyền tại API, timeout/idempotency, VietQR, Groq hay DB.
- Lint/typecheck/build và unit test đang xác nhận code hiện tại; không thay thế kiểm thử chức năng nghiệp vụ end-to-end.

## 5. Rủi ro và việc còn lại trước production

1. **Bắt buộc trước dữ liệu/người dùng thật:** hoàn tất T03 và các quyết định BRS còn mở; T06 DB/migration; T07 auth, phân quyền server, audit; Backend theo các endpoint đã chốt.
2. Sinh OpenAPI/client type, chốt schema/errors/validation và thay mock adapter bằng HTTP adapter; giữ mock adapter chạy được cho phát triển UI.
3. Chuyển các luồng đặt món, cọc, sơ đồ bàn, bếp, đối chiếu, báo cáo, chatbot và mở rộng sang service layer theo từng task nghiệp vụ. Hiện nhiều nội dung vận hành vẫn đọc/ghi state/fixtures trong context.
4. Bổ sung test React/Testing Library và Playwright e2e cho các AC quan trọng, bao gồm luồng lỗi, quyền, breakpoint mobile/tablet và regression hình ảnh.
5. Chạy accessibility/performance review và kiểm tra môi trường triển khai theo T25 trước khi phát hành.

**Không đưa lên production ở trạng thái hiện tại:** đăng nhập vận hành, cọc/QR, nhận đặt chỗ thật và báo cáo đều là mô phỏng hoặc thiếu API. Prototype và mock data không phải nguồn dữ liệu production.

## 6. Checklist nghiệm thu giai đoạn chuẩn hóa

- [x] Tách workspace giao diện web khỏi Prototype đã duyệt và giữ Prototype làm baseline.
- [x] Tổ chức app, routes, features, shared, mocks, services và tài sản giao diện.
- [x] Thêm typed HTTP transport và service/mock layer cho các luồng menu/đặt chỗ nền.
- [x] Tạo API contract dự thảo có request/response, lỗi và các câu hỏi cần xác nhận.
- [x] Format, lint, typecheck, unit test và build đạt.
- [x] Smoke test route, luồng chính và responsive cơ bản đạt.
- [ ] Tích hợp API/OpenAPI/auth thật, component/e2e test tự động, accessibility và performance audit: phụ thuộc T03/T07 và task tiếp theo.
- [ ] Sẵn sàng production: chưa đạt cho đến khi hoàn thành các điều kiện phía Backend/bảo mật/QA nêu trên.

## 7. Cách chạy local

```sh
npm run dev --workspace=@ba-anh-em/web
```

Mở `http://127.0.0.1:5173`. Giao diện dùng mock data trong bộ nhớ; tải lại trang sẽ trở về fixtures. Workspace Prototype độc lập đã gỡ; bản lưu trữ chỉ dùng để phục hồi khi cần. Lệnh root `npm run dev` khởi chạy web và API cùng lúc.

## Cập nhật lưu trữ 26/11/2026

- Đã lưu bản ZIP kiểm tra được với 194 tệp tại `backups/approved-prototype-2026-11-26.zip`, rồi chuyển `apps/prototype` vào Recycle Bin. `apps/prototype` không còn trong workspace hay `node_modules`.
- Gỡ script `dev:prototype`, cập nhật `package-lock.json` và các hướng dẫn. `npm ls --workspaces --depth=0` chỉ còn API, web và API contract. `npm ci --dry-run` đạt.
- Sau khi gỡ: `format:check`, `lint`, `typecheck`, `test:unit` (34 test: API 25, web 9), `build` và `contract:check` đều đạt. Đường dẫn web `http://127.0.0.1:5173/van-hanh/dat-cho` trả HTTP 200.
- Bản source trong Recycle Bin có thể khôi phục bằng Windows Recycle Bin; bản ZIP dự phòng vẫn nằm trong thư mục `backups/` bị Git ignore.
