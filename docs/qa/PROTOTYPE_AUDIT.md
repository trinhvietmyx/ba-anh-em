# Báo cáo rà soát Prototype

Ngày rà soát: 20/11/2026

## 1. Tổng quan

Prototype hiện triển khai giao diện khách hàng và khu vực vận hành bằng React, React Router và dữ liệu mô phỏng trong bộ nhớ. Các luồng chính gồm xem thực đơn, tạo lượt đặt bàn, chọn món trước, xem tiền cọc, tra cứu đặt chỗ, gửi yêu cầu đặt tiệc/đánh giá, và các màn hình vận hành theo vai trò Nhân viên hoặc Quản trị viên.

Đối chiếu với `docs/design/SCREEN_LIST.md`, `docs/design/UI_UX_SPECIFICATION.md`, `docs/BRS-Nha-hang-Ba-Anh-Em.md` và `docs/IMPLEMENTATION_PLAN.md`, phạm vi màn hình MVP đang có trong ứng dụng. Prototype chưa kết nối Backend, API hay cơ sở dữ liệu; trạng thái người dùng và dữ liệu mẫu không được lưu như phiên đăng nhập thật.

## 2. Vấn đề đã phát hiện và xử lý

| Mức độ   | Vấn đề                                                                                                                                           | Trạng thái và xử lý                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | Không phát hiện lỗi nghiêm trọng chặn luồng chính trong các lượt kiểm tra đã chạy.                                                               | Đã kiểm tra các luồng thực đơn, đặt bàn, chatbot và đăng nhập vận hành.                                                                                                                 |
| High     | Các trang quản trị bị chặn bởi cờ “Mở rộng” dù người dùng đã chọn vai trò Admin.                                                                 | Đã bỏ điều kiện cờ mở rộng khỏi định tuyến và quyền truy cập các trang quản trị. Sidebar chỉ hiện các mục phù hợp với vai trò; kiểm tra quyền Admin vẫn được giữ.                       |
| High     | Một số nút bên trong các biểu mẫu chức năng mở rộng chưa khai báo loại nút, có thể vô tình gửi biểu mẫu.                                         | Đã khai báo `type="button"` hoặc `type="submit"` rõ ràng cho các nút trong `extensions.tsx`.                                                                                            |
| Medium   | Trường họ tên/số điện thoại ở biểu mẫu đặt bàn, đặt tiệc và chatbot chưa khai báo tên trường và gợi ý tự điền phù hợp.                           | Đã thêm `name`, `autoComplete` và `inputMode="tel"` cho các trường liên hệ tương ứng.                                                                                                   |
| Medium   | Việc đăng nhập và dữ liệu prototype chỉ tồn tại trong bộ nhớ trang. Làm mới trang hoặc mở đường dẫn vận hành trực tiếp sẽ yêu cầu đăng nhập lại. | Đây là giới hạn của prototype không có backend/xác thực thật; đã ghi nhận ở mục giới hạn, không thay đổi kiến trúc hoặc phạm vi nghiệp vụ.                                              |
| Low      | Lần chạy đầu trong phiên browser cũ ghi nhận cảnh báo React về mount lại root và lỗi gỡ node trong quá trình phát triển.                         | Không tái hiện sau khi mở phiên trình duyệt sạch và lặp lại thao tác; lượt kiểm tra cuối không có lỗi hoặc cảnh báo console. Chưa có bằng chứng để kết luận đây là lỗi runtime ổn định. |

Không thực hiện thay đổi giao diện lớn, đổi màu sắc, đổi nội dung nghiệp vụ hoặc tích hợp dịch vụ ngoài.

## 3. Thay đổi đã thực hiện

- `apps/prototype/src/main.tsx`: bỏ lớp chặn các trang Admin dựa trên `expanded`; các trang vẫn nằm trong layout vận hành và chịu kiểm tra vai trò.
- `apps/prototype/src/extensions.tsx`: giới hạn các màn hình quản trị theo vai trò Admin, thêm loại nút rõ ràng và cải thiện thuộc tính tự điền cho các biểu mẫu liên hệ.
- `apps/prototype/src/operations.tsx`: hiển thị mục quản trị được phân quyền trực tiếp cho Admin, không phụ thuộc cờ mở rộng.
- `apps/prototype/src/demo.tsx`: bỏ thành phần bật/tắt mở rộng không còn dùng; định dạng lại tệp theo Prettier.
- `apps/prototype/src/booking.tsx`, `apps/prototype/src/chat.tsx`: bổ sung gợi ý tự điền tên và số điện thoại.

## 4. Kiểm thử và xác minh

### Kiểm tra tự động

| Lệnh                                                 | Kết quả                                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run lint`                                       | Đạt.                                                                                |
| `npm run format:check`                               | Đạt sau khi định dạng lại `demo.tsx` và báo cáo này.                                |
| `npm run typecheck`                                  | Đạt trên các workspace API, Prototype và web.                                       |
| `npm run test:unit --workspace=@ba-anh-em/prototype` | Đạt: 6/6 bài kiểm tra, gồm phân quyền ba vai trò và quy tắc dữ liệu đặt trước.      |
| `npm run build --workspace=@ba-anh-em/prototype`     | Đạt. Vite tạo bundle JS 430.06 kB (127.63 kB gzip) và CSS 69.55 kB (14.24 kB gzip). |

> Kích thước bundle chỉ là số liệu build; chưa đo Lighthouse, Core Web Vitals hoặc hiệu năng trên thiết bị thật.

### Kiểm tra trình duyệt

- Trang chủ và thực đơn tải được; 8 ảnh trên trang chủ đã tải thành công, không thấy ảnh hỏng.
- Thêm món mở nút hóa đơn tạm tính; mở ngăn kéo hiển thị món và số lượng. Xóa hết cần xác nhận; sau xác nhận, ngăn kéo đóng và nút tạm tính được ẩn khi không còn món.
- Luồng đặt bàn đã chạy đến trang kết quả: chọn khung giờ, dùng thông tin liên hệ mẫu, xem lại và gửi yêu cầu; trang kết quả hiển thị mã tham chiếu, trạng thái và hành động tiếp theo.
- Đăng nhập vai trò Admin hiển thị các mục quản trị và mở được `/van-hanh/thuc-don`.
- Đăng nhập vai trò Nhân viên rồi truy cập trang quản trị trong cùng phiên bị từ chối với thông báo quyền truy cập; vai trò khách hàng cũng được kiểm tra trong unit test phân quyền.
- Chatbot mở dạng popup; nhấn Escape thu gọn popup, trả focus về nút mở và đặt `aria-hidden`/`inert` cho nội dung đã đóng.
- Kiểm tra đường dẫn trực tiếp của trang chủ, thực đơn, đặt bàn, chọn món, đặt cọc, kết quả, tra cứu, đặt tiệc và đánh giá. Trang chọn món/đặt cọc/kết quả khi chưa có lượt đặt hiển thị trạng thái phục hồi phù hợp.
- Đo `scrollWidth` của 18 đường dẫn màn hình khách hàng và vận hành tại 320, 375, 768 và 1368 px: không trang nào tràn ngang. Trang thực đơn cũng được đo tại 1024 px.
- Ở 375 px, danh sách đặt chỗ và sơ đồ bàn vận hành không tràn ngang; bộ lọc xếp dọc, danh sách đặt chỗ chuyển thành thẻ dữ liệu. Trang kết quả đặt bàn hiển thị đủ thông tin và thao tác chính.
- Lượt browser sạch cuối cùng không có lỗi hoặc cảnh báo console. Lỗi React xuất hiện một lần trong phiên trước không lặp lại được.

Ảnh kiểm tra: [thực đơn mobile 320 px](../../.playwright-cli/audit-menu-mobile.png), [kết quả đặt bàn mobile 375 px](../../.playwright-cli/audit-booking-mobile.png), [đặt chỗ vận hành mobile](../../.playwright-cli/audit-ops-bookings-mobile.png), [sơ đồ bàn vận hành mobile](../../.playwright-cli/audit-ops-floor-mobile.png).

## 5. Vấn đề còn tồn tại và giới hạn

- Chưa có backend, API, cơ sở dữ liệu hoặc xác thực thật. Đăng nhập vai trò chỉ mô phỏng quyền; không được xem như cơ chế bảo mật.
- Dữ liệu demo trong bộ nhớ sẽ mất khi tải lại trang. Các trạng thái thanh toán, giữ bàn, xác nhận đặt chỗ và chatbot chỉ mô phỏng.
- Chưa kiểm thử mọi nhánh lỗi và mọi tổ hợp kịch bản trên toàn bộ màn hình. Đã xác minh các luồng chính và đại diện; các tình huống còn lại cần kiểm tra trong giai đoạn QA sản phẩm.
- Chưa đo hiệu năng theo Lighthouse/Core Web Vitals, kiểm thử trình đọc màn hình hoặc kiểm thử trên thiết bị vật lý.
- Đã kiểm tra không tràn ngang ở các kích thước chính trên toàn bộ route. Chưa rà soát trực quan mọi trạng thái tương tác trên thiết bị vật lý.
- Không có baseline Git đã theo dõi trong workspace để tạo diff đáng tin cậy; báo cáo dựa trên mã hiện tại, các thay đổi trong phiên và kiểm chứng chạy thực tế.

## 6. Checklist nghiệm thu

- [x] Trang chủ và thực đơn mở được, không có ảnh lỗi trong trang chủ.
- [x] Nút thêm món, hóa đơn tạm tính và trạng thái rỗng sau khi xóa món.
- [x] Luồng đặt bàn mẫu đến trang kết quả.
- [x] Chatbot mở/đóng bằng Escape và trả lại focus.
- [x] Trang quản trị thực đơn hiển thị khi đăng nhập bằng vai trò Admin.
- [x] Trang quản trị bị từ chối với vai trò Nhân viên.
- [x] Không tràn ngang trên 18 route ở 320, 375, 768 và 1368 px.
- [x] Lint, typecheck, unit test và build đã chạy thành công.
- [x] `format:check` đạt sau khi định dạng báo cáo.
- [ ] Rà soát trực quan mọi trạng thái trên thiết bị vật lý.
- [ ] Đo Lighthouse/Core Web Vitals và kiểm thử hỗ trợ tiếp cận bằng công nghệ hỗ trợ.
- [ ] Tích hợp và kiểm thử backend/xác thực thật ở giai đoạn sau.

## 7. Mức độ sẵn sàng

Người dùng đã chốt Prototype hiện tại làm baseline giao diện cho giai đoạn chuẩn hóa Frontend. Các mục checklist còn mở là giới hạn/kiểm tra bổ sung trước khi phát hành sản phẩm thật; không thay đổi phạm vi của bản Prototype đã duyệt. Prototype chưa phải sản phẩm production vì xác thực, lưu trữ, giao dịch đặt cọc và backend chưa được triển khai; kiểm thử trên thiết bị vật lý, công nghệ hỗ trợ và hiệu năng cũng chưa xác minh.
