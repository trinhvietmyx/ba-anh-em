# API Contract Frontend — Bản dự thảo

**Trạng thái:** Dự thảo dùng để tách giao diện khỏi nguồn dữ liệu. Chưa phải OpenAPI đã duyệt và chưa thay thế hợp đồng T03. Backend hiện chưa triển khai các route nghiệp vụ.

**Căn cứ:** API outline trong `docs/IMPLEMENTATION_PLAN.md` mục 3.1, BRS, `UI_UX_SPECIFICATION.md` và màn hình đã duyệt. Chính sách Q-01 đến Q-15 còn mở tiếp tục được giữ nguyên; các trường hoặc điều kiện phụ thuộc Q được ghi là cần xác nhận.

## Quy ước giao tiếp

- Base path dự kiến: `/api/v1`; frontend và API cùng origin ở production. Dev server chuyển tiếp `/api/v1` theo cấu hình Vite hiện có.
- Request và response có body dùng JSON UTF-8. Ngày/giờ, múi giờ, đơn vị tiền, phân trang, cache và quyền truy cập theo đối tượng cần chốt ở T03.
- `apps/web/src/services/http-client.ts` là transport layer: dựng URL, mã hóa JSON, đọc JSON và chuyển lỗi HTTP sang `ApiServiceError`. Nó không xác thực quyền thay Backend.
- Lỗi có cấu trúc dự kiến: `{ "code": "...", "message": "...", "fields": { "field": "..." }, "traceId": "...", "retryable": false }`. `fields`, `traceId` và `retryable` có thể vắng mặt. Lỗi không phải JSON được chuyển thành thông báo an toàn `INVALID_RESPONSE`.
- Các mã dự kiến trong kế hoạch: `401` chưa xác thực, `403` không đủ quyền, `404` khi chính sách cho phép công khai sự tồn tại, `409` xung đột trạng thái/thao tác, `422` vi phạm quy tắc nghiệp vụ, `429` giới hạn và `503` dịch vụ tạm thời không sẵn sàng. API phải trả `code` ổn định; câu chữ hiển thị được xử lý ở giao diện.
- Frontend kiểm tra định dạng và tính đầy đủ để hỗ trợ nhập liệu. Backend vẫn là nơi quyết định trạng thái, quyền, khả dụng, tiền và kết quả giao dịch. Quy tắc dữ liệu cá nhân phụ thuộc Q-07/Q-11/Q-15.
- Request có thể làm thay đổi trạng thái cần cơ chế gửi lại an toàn theo T03/T11. `Idempotency-Key` được dự kiến cho thao tác tạo/chuyển trạng thái khi T03 chốt phạm vi; không gửi header này đồng loạt cho mọi route.
- `204 No Content` được chấp nhận cho thao tác không trả dữ liệu. Các response còn lại phải có body JSON đúng schema đã duyệt.

## Màn hình, dữ liệu và endpoint dự kiến

| Màn hình / use case                | Đầu vào từ giao diện                                  | Request dự kiến                                                                   | Kết quả dùng để hiển thị                                                        | Trạng thái cần xử lý                                   |
| ---------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| PUB-01 Trang chủ                   | Không có; nội dung món nổi bật                        | `GET /menu`                                                                       | Món công bố, giá và khả dụng                                                    | Tải, trống, lỗi đọc                                    |
| PUB-02/03 Thực đơn và chi tiết món | Từ khóa, nhóm món, món đang chọn                      | `GET /menu`                                                                       | Danh sách món và thuộc tính được công bố                                        | Tải, trống, không còn nhận đặt, lỗi                    |
| PUB-04 Đặt bàn                     | Ngày, khung giờ, số khách                             | `GET /availability`                                                               | Còn nhận, lý do, lựa chọn thay thế đã xác minh                                  | Đang tra cứu, khung hết, lỗi                           |
| PUB-04 Gửi yêu cầu                 | Khung đã chọn và thông tin liên hệ được Q-07 cho phép | `POST /reservations`                                                              | Mã tham chiếu, trạng thái đặt chỗ, bước tiếp theo được phép                     | Đang gửi, đã nhận, xung đột, lỗi, mất phản hồi         |
| PUB-05 Đặt món trước               | Mã lượt, danh sách `{ dishId, quantity }`             | `PUT /reservations/{id}/preorders`                                                | Các dòng được ghi nhận và dòng cần xử lý                                        | Đang lưu, toàn phần/một phần theo Q-05, hết hạn, lỗi   |
| PUB-06 Đặt cọc                     | Mã lượt và yêu cầu đọc/trạng thái cọc                 | `POST /reservations/{id}/deposits`; `GET /reservations/{id}/deposits/{depositId}` | Nội dung VietQR được cấp, số tiền/tham chiếu và trạng thái do hệ thống xác nhận | Đang tạo/đọc, chờ, đã xác minh, ngoại lệ, hết hạn, lỗi |
| PUB-08 Chatbot                     | Thông điệp và ngữ cảnh hội thoại được phép            | `POST /chat/messages`                                                             | Tin nhắn, gợi ý món hoặc bước xác nhận thao tác                                 | Đang gửi, lỗi/giới hạn, phản hồi thiếu căn cứ          |
| OPS-02 Danh sách đặt chỗ           | Ngày, giờ, trạng thái, mã                             | `GET /ops/reservations`                                                           | Danh sách trong phạm vi quyền                                                   | Tải, trống, không đủ quyền, lỗi                        |
| OPS-03 Chi tiết lượt               | Mã lượt                                               | `GET /ops/reservations/{id}`                                                      | Dữ liệu được phép xem, trạng thái, lịch sử                                      | Tải, không tìm thấy/không được tiết lộ, lỗi            |
| OPS-03 Kết quả phục vụ             | Mã lượt, loại sự kiện và dữ liệu xác nhận             | `POST /ops/reservations/{id}/service-events`                                      | Trạng thái mới và dấu vết thao tác                                              | Đang lưu, xung đột, bị từ chối, lỗi                    |
| OPS-04 Sơ đồ và phân bàn           | Ngày, giờ, khu, lượt đặt; mã bàn đề xuất              | `GET /ops/floorplan`; `PUT /ops/reservations/{id}/allocation`                     | Bàn/trạng thái hiện hành; kết quả bố trí                                        | Tải, trống, xung đột sức chứa, quyền, lỗi              |
| OPS-05 Chuẩn bị bếp                | Ngày, giờ và bộ lọc đã duyệt                          | `GET /ops/kitchen/preparations`                                                   | Món cần chuẩn bị, số lượng, thay đổi sau chốt nếu được phép                     | Tải, không có món, thay đổi, lỗi                       |
| OPS-06 Đối chiếu cọc               | Mã khoản cọc, bằng chứng được phép, kết quả xử lý     | `POST /ops/deposits/{depositId}/reconciliations`                                  | Trạng thái đối chiếu và dấu vết                                                 | Chờ, khớp, lệch, gửi trùng, thiếu quyền, lỗi           |
| OPS-07 Báo cáo                     | Kỳ và chỉ số/bộ lọc đã được Q-10 chốt                 | `GET /ops/reports`                                                                | Giá trị, đơn vị, kỳ và mốc dữ liệu                                              | Không có dữ liệu, giá trị 0, không tính được, lỗi      |

## Hợp đồng dữ liệu nháp

Các shape dưới đây ghi nhận dữ liệu hiện cần cho UI. Tên/kiểu trường, trường bắt buộc, enum, envelope và điều kiện phản hồi cần được chốt trong T03 cùng Backend; không coi đây là schema đã được duyệt.

### Đọc menu

```json
{
  "items": [
    {
      "id": "ga-nuong-la-chanh",
      "name": "Gà nướng lá chanh",
      "category": "Món nướng",
      "price": 329000,
      "description": "",
      "image": "/images/menu/ga.webp",
      "available": true,
      "published": true
    }
  ]
}
```

Chốt ở T03/T09 xem response có pagination hay không và API khách có nhận `published` hoặc trường vận hành hay chỉ trả dữ liệu công bố.

### Tra cứu khả dụng

```json
{
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "guests": 4
}
```

Response cần cho UI biết kết quả nhận đặt, mã lý do ổn định và các lựa chọn thay thế đã được kiểm tra. Giới hạn ngày, số khách, khung giờ, buffer, múi giờ và thuật toán bàn chờ Q-01/Q-02/Q-09; không sao chép các giá trị fixture sang luật production.

### Tạo lượt đặt

Request dự kiến gồm ngày, giờ, số khách và các trường liên hệ đã được Q-07 duyệt. `Idempotency-Key` chỉ dùng sau khi T03 chốt. Kênh web/chat nên được xác định từ ngữ cảnh tin cậy hoặc theo hợp đồng được duyệt, không dựa vào một giá trị role do client tự khai.

```json
{
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "guests": 4,
  "contact": {
    "name": "...",
    "phone": "..."
  },
  "note": "..."
}
```

Response cần có mã lượt, trạng thái hiện hành, thông tin tối thiểu được phép trả lại và bước tiếp theo. Không chốt trạng thái mặc định, thời hạn giữ bàn, đặt cọc hoặc cách khách truy cập lại trước các quyết định Q tương ứng.

### Ghi món trước

Request dự kiến gửi danh sách `{ "dishId": string, "quantity": number }` cùng thông tin phiên bản nếu T03 yêu cầu. Response cần phân biệt rõ dòng đã ghi, dòng không ghi và lý do; xử lý toàn phần/một phần theo Q-05.

### Hoạt động vận hành và kết quả chat

- `GET /ops/floorplan` nhận tiêu chí ngày/giờ/khu vực đã duyệt; response gồm các bàn và tình trạng trong phạm vi quyền.
- `PUT /ops/reservations/{id}/allocation` ghi phương án bàn; response phản ánh trạng thái hiện hành sau kiểm tra xung đột.
- `POST /ops/reservations/{id}/service-events` nhận sự kiện vận hành được phép, không dùng patch trạng thái tùy ý từ client.
- `GET /ops/kitchen/preparations` trả danh sách chuẩn bị theo mốc chốt món Q-05.
- Các endpoint cọc trả dữ liệu tối thiểu theo quyền; nội dung QR, tài khoản nhận và nguồn đối chiếu phải được cấp/kiểm tra theo cấu hình thật đã duyệt.
- `POST /chat/messages` không được trả lời dựa trên dữ liệu không có căn cứ; thao tác tạo lượt dùng cùng use case `POST /reservations` qua bước xác nhận của UI.

## Validation và lỗi hiển thị

- Lỗi trường dùng khóa tương ứng với tên trường API và nội dung ngắn, không xóa các trường hợp lệ khi người dùng sửa.
- `409` giữ dữ liệu nhập và yêu cầu tải lại khả dụng/trạng thái trước khi gửi lại.
- `401` chuyển qua luồng xác thực được T07 duyệt; `403` hiện trang không đủ quyền; `404` không tiết lộ tài nguyên nếu chính sách yêu cầu che tồn tại.
- `422` cho biết quy tắc nghiệp vụ không thỏa; `429`/`503` đưa ra cách thử lại an toàn theo `retryable`; timeout sau thao tác ghi phải tra cứu kết quả trước khi tạo lại theo Q-15.
- Không hiển thị stack trace, dữ liệu thanh toán thô, số điện thoại đầy đủ hoặc nội dung nội bộ trong log giao diện.

## Điều kiện hoàn tất hợp đồng

- T03 duyệt `operationId`, schema request/response, status, pagination, quy tắc authn/authz, field validation, idempotency và error code cho từng endpoint.
- NestJS xuất OpenAPI; client types sinh từ OpenAPI trong `packages/api-contract/` và CI phát hiện contract drift ở T08.
- Các policy Q liên quan được chốt trước khi điền enum/ràng buộc phụ thuộc chúng. Bộ mock hiện tại chỉ phục vụ local và không được dùng làm dữ liệu production.
