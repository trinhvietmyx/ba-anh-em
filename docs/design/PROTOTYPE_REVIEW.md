# Kiểm tra giao diện Ba Anh Em

**Bản Prototype đã chốt · 20/11/2026**

Prototype được dựng bằng React, TypeScript, React Router và Vite. Sau khi chuyển giao diện sang `apps/web`, workspace Prototype đã được gỡ ngày 26/11/2026; source trước chuyển đổi được lưu ở `backups/approved-prototype-2026-11-26.zip` trên máy tạo archive. Giao diện áp dụng bảng màu từ ảnh Ba Anh Em, gồm nền kem ấm, nâu than, đỏ gạch và cam mật ong. Font chữ là Lora và Be Vietnam Pro. Các căn cứ thiết kế gồm [đặc tả UI/UX](UI_UX_SPECIFICATION.md), [design system](DESIGN_SYSTEM.md) và [danh sách màn hình](SCREEN_LIST.md).

**Trạng thái:** Người dùng đã chốt giao diện Prototype hiện tại làm baseline cho giai đoạn chuẩn hóa Frontend. Nội dung tài liệu này ghi lại phạm vi và giới hạn của bản đã duyệt; các checklist nghiệp vụ và production bên dưới vẫn cần xử lý ở giai đoạn tương ứng.

Xem [báo cáo audit và kiểm thử Prototype](../qa/PROTOTYPE_AUDIT.md) để biết các luồng đã xác minh và giới hạn còn lại.

## 1. Mở prototype

Workspace Prototype không còn chạy trực tiếp. Giao diện hiện tại chạy trong [apps/web](../../apps/web/) tại `http://127.0.0.1:5173/`. Để phục hồi bản cũ, giải nén ZIP dự phòng vào `apps/prototype`, cài lại workspace bằng `npm install`, rồi khởi động workspace đó.

```sh
npm install
npm run dev --workspace=@ba-anh-em/prototype
```

Trên trang khách, bấm **Mở rộng** trong thanh điều hướng để mở danh sách **Tra cứu đặt chỗ**, **Đặt tiệc** và **Đánh giá**. Trên điện thoại, mục này nằm trong menu thu gọn. Bấm **Khu vực nhân viên** ở chân trang để vào vận hành trong cùng tab và đối chiếu dữ liệu vừa tạo. Admin thấy các mục quản trị trực tiếp trong sidebar; Nhân viên chỉ thấy các mục vận hành được phân quyền. Tải lại trang để bắt đầu lại với dữ liệu mẫu.

- **Khách hàng** mở trực tiếp trang nhà hàng để xem thực đơn, đặt bàn, đặt món trước, đặt cọc, dùng trợ lý AI và gửi đánh giá từ mục **Mở rộng**. Luồng đặt bàn có nút điền thông tin mẫu.
- **Trang chủ** dùng ảnh tĩnh bàn món Việt. Kiểm tra phần món ăn trong ảnh và độ rõ của chữ trên desktop và mobile. Trên màn hình nhỏ, thử bấm hai nút đầu trang, vuốt dải món và mở chi tiết món. Dùng bàn phím để kiểm tra điều hướng dải món.
- **Trợ lý AI** mở từ nút chat đỏ ở góc dưới bên phải trang khách. Bấm lại nút nổi, bấm nút đóng hoặc nhấn Escape trong chat để thu gọn. Mở lại để tiếp tục hội thoại và bước đặt bàn đang làm.
- **Nhân viên** vào **Khu vực nhân viên** để quản lý lượt đặt, điều phối bàn, theo dõi món và đối chiếu cọc. Chi tiết lượt đặt có lối sang chuẩn bị bếp và đối chiếu cọc.
- **Quản trị viên (Admin)** có đầy đủ quyền vận hành, xem lịch sử và báo cáo. Sidebar hiển thị trực tiếp các mục quản lý thực đơn, xử lý đổi/hủy, yêu cầu đặt tiệc và duyệt đánh giá. Dùng **Đổi vai trò** trong sidebar để quay về màn hình đăng nhập và chọn **Nhân viên** hoặc **Quản trị viên (Admin)**. Chọn **Về trang nhà hàng** để mở trang công khai.
- **Tra cứu đặt chỗ** có dữ liệu mẫu `BAE-1042` và `0900000042`. **Đánh giá** có dữ liệu mẫu `BAE-1038` và `0900000038`.
- **Thực đơn** dùng 60 ảnh từ bộ ảnh được cung cấp và giữ bốn ảnh minh họa ban đầu. Dùng dấu **+** ở thẻ món trên trang chủ hoặc thực đơn để chọn món. Hóa đơn tạm tính xuất hiện khi có món, cập nhật số phần và tổng tiền, rồi chuyển lựa chọn sang bước đặt bàn. Giá và tình trạng phục vụ là dữ liệu mẫu. “Sườn nướng” và “Trà trái cây” là tên tạm cho ảnh có tên tệp rút gọn.

### Trạng thái ngoại lệ đã duyệt

Các kịch bản dưới đây ghi lại những trạng thái từng có trong bản Prototype. Liên kết localhost cổng `5180` không còn hoạt động sau khi gỡ workspace. Để thử các kịch bản được hỗ trợ ở Frontend hiện tại, xem phần môi trường dev trong [README](../../README.md); một số trạng thái chỉ có trong bản lưu trữ.

## 2. Màn hình và chức năng đã mô phỏng

Phạm vi gồm 23 màn hình và biến thể nghiệp vụ trong `SCREEN_LIST.md`, cùng các trạng thái dùng chung của SYS-01.

| Mã màn hình            | Nội dung có thể thử                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| PUB-01                 | Trang chủ, ảnh món, điều hướng desktop/mobile và các điểm vào đặt bàn.                                                                          |
| PUB-02, PUB-03         | Danh sách món, tìm có hoặc không dấu, lọc nhóm, tải lại khi lỗi, trạng thái trống/hết món, hóa đơn tạm tính và cửa sổ chi tiết.                 |
| PUB-04                 | Chọn ngày/số khách, kiểm tra khung, nhập thông tin, xem lại và gửi yêu cầu. Có validation, loading, khung vừa hết và phục hồi sau mất phản hồi. |
| PUB-05                 | Chọn số lượng và lưu món gắn với lượt đặt. Thấy giá trị món và trạng thái ghi nhận.                                                             |
| PUB-06, PUB-07         | Đọc và tải lại QR mẫu, sao chép tham chiếu, báo đã chuyển và kiểm tra kết quả mẫu. Xem riêng tình trạng đặt chỗ, bố trí bàn và cọc.             |
| PUB-08                 | Hỏi món, làm rõ thời gian, chọn khung và đặt qua hội thoại mô phỏng. Khi trợ lý gián đoạn, có đường sang form web.                              |
| OPS-01, OPS-02         | Đăng nhập bằng vai trò mẫu, thử lại khi lỗi hoặc hết phiên, tìm mã và lọc lượt đặt.                                                             |
| OPS-03                 | Chi tiết lượt, món, trạng thái phục vụ và các lối vào công việc liên quan.                                                                      |
| OPS-04                 | Xem sơ đồ hoặc danh sách bàn theo khung, chọn bố trí và thử xung đột.                                                                           |
| OPS-05                 | Chuẩn bị bếp theo lượt và nhận biết thay đổi trên danh sách món.                                                                                |
| OPS-06                 | Xem giao dịch cọc, đối chiếu thông tin, xử lý sai lệch và xem ca tiền đến sau hạn.                                                              |
| OPS-07                 | Báo cáo theo ngày với dữ liệu và trạng thái kỳ trống.                                                                                           |
| SYS-01                 | Route không tìm thấy, lượt đặt ngoài phiên và phản hồi khi vai trò thiếu quyền.                                                                 |
| OPT-01, OPT-02, OPT-03 | Quản trị thực đơn, xác minh để tra cứu lượt và gửi yêu cầu, xử lý đổi hoặc hủy trong vận hành.                                                  |
| ADV-01, ADV-02         | Gửi yêu cầu tiệc và xem xử lý ở khu vận hành, gồm đánh giá khả thi theo ngày, giờ và dữ liệu bàn mẫu.                                           |
| ADV-03, ADV-04         | Gửi đánh giá theo lượt đã phục vụ, chờ duyệt và thao tác trên hàng đợi vận hành.                                                                |
| ADV-05                 | Thẻ xác nhận tác vụ trong chat, kết quả API mô phỏng và ca mất phản hồi có khôi phục. Bật **Mở rộng** để xem.                                   |

## 3. Kịch bản review

| Hạng mục             | Cách thử                                                                                                                                                                                | Điều cần đánh giá                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Đặt bàn trọn luồng   | Đặt bàn ngày 21/11/2026, thử khung 17:00, dùng thông tin mẫu. Chọn món, mô phỏng cọc và xem kết quả. Mở **Khu vực nhân viên** để tìm mã vừa tạo.                                        | Có dễ hiểu thứ tự bước và đối chiếu được cùng một mã ở hai khu vực không?     |
| Khung giờ đặt bàn    | Đổi ngày hoặc số khách, rồi kiểm tra khung giờ lần nữa.                                                                                                                                 | Có dễ phân biệt giờ còn chỗ và tìm giờ khác không?                            |
| Cọc đến muộn         | Mở **Khu vực nhân viên → Đối chiếu cọc** và tìm lượt mẫu `BAE-1039`.                                                                                                                    | Có phân biệt được tiền đã tới, cọc cần đối chiếu và trạng thái giữ bàn không? |
| Trợ lý AI            | Mở trợ lý để hỏi món hoặc bắt đầu đặt bàn.                                                                                                                                              | Có hiểu bước tiếp theo và thông tin cần nhập không?                           |
| Bộ lọc và phân quyền | Vào vận hành với vai trò **Nhân viên** để thử đặt chỗ, sơ đồ, bếp và cọc. Mở trực tiếp báo cáo để thử trạng thái thiếu quyền. Đổi sang **Admin** để xem báo cáo và các tác vụ quản trị. | Quyền trên menu, thao tác và khi mở thẳng đường dẫn có nhất quán không?       |
| Màn hình mở rộng     | Mở menu **Mở rộng** trên trang khách để thử tra cứu, yêu cầu đổi/hủy, đặt tiệc và đánh giá. Vào vận hành để xử lý các yêu cầu vừa tạo.                                                  | Khách và nhân viên có theo dõi được kết quả của từng yêu cầu không?           |
| Thiết bị và bàn phím | Trên màn hình hẹp, mở menu và dialog món. Dùng Tab, Escape, thao tác chọn giờ và kiểm tra việc quay lại vị trí focus.                                                                   | Có điểm nào khó chạm, khó đọc hoặc che nội dung chính không?                  |

## 4. Giới hạn và các quyết định cần duyệt

- Toàn bộ dữ liệu và phiên nhân sự nằm trong bộ nhớ của tab. AI, phân quyền, kết quả API và trạng thái thanh toán do kịch bản frontend mô phỏng. QR chỉ chứa lưu ý minh họa. Chỉ nhập dữ liệu mẫu khi review.
- Prototype áp dụng ba vai trò cố định. Quản lý bàn hiện có gồm sơ đồ và phân bàn. Danh mục bàn, hồ sơ nhân viên, cấu hình nghiệp vụ và chỉnh quyền theo tài khoản hiện nằm ngoài các màn hình prototype đã thiết kế.
- Ngày 21/11/2026, quy tắc chọn bàn theo sức chứa, 90 phút sử dụng bàn, thời hạn giữ bàn hiển thị 15 phút và cọc mẫu 200.000 đồng phục vụ thử giao diện. Các giá trị và hành vi này cần đối chiếu Q-01 đến Q-06 trước khi dùng ở hệ thống thật.
- Khách mở trực tiếp tra cứu, đặt tiệc và đánh giá từ menu **Mở rộng**. Tác vụ quản trị và biến thể thao tác qua chat dùng tùy chọn mở rộng trong phiên. Cần xác nhận phạm vi với nhà hàng trước khi đưa vào sản phẩm.
- Giao diện đã được kiểm tra trên Chrome ở các viewport thử nghiệm. Kiểm tra thiết bị thật và trình duyệt khác thuộc đợt review hoặc nghiệm thu tiếp theo.

## 5. Ghi nhận phản hồi

Với mỗi góp ý, ghi mã màn hình, kịch bản, kích thước thiết bị, bước thao tác, vấn đề nhìn thấy và thay đổi mong muốn.

| Mã màn hình và bước                 | Vấn đề hoặc điều cần xác nhận                            | Điều chỉnh mong muốn |
| ----------------------------------- | -------------------------------------------------------- | -------------------- |
| PUB-04 · Chọn khung và kiểm tra lại | Luồng chọn giờ, tên trường và thông báo hết chỗ          |                      |
| PUB-06/07 · Đặt cọc và kết quả      | Cách phân biệt trạng thái cọc, giữ bàn và bước tiếp theo |                      |
| PUB-08 · Đặt bàn qua hội thoại      | Mốc xác nhận, thông báo lỗi và chuyển sang web           |                      |
| OPS-04/06 · Sơ đồ và đối chiếu      | Tổ chức thông tin bàn, tiền và ngoại lệ                  |                      |
| OPT/ADV                             | Phạm vi màn hình cần đưa vào bản chính thức              |                      |

### Checklist bàn giao

- [x] Có prototype chạy local và có lệnh khởi động lại.
- [x] Kiểm tra luồng đặt web, món, cọc, khung vừa hết và phục hồi sau mất phản hồi.
- [x] Đối chiếu lượt đặt mới trong cùng phiên vận hành, thử báo cáo trống và ca cọc tới sau hạn.
- [x] Thử tư vấn và đặt qua chat, chuyển sang form web khi trợ lý gián đoạn, và phục hồi kết quả API mẫu khi mất phản hồi.
- [x] Bật Mở rộng, gửi yêu cầu tiệc và ghi nhận quyết định, gửi và công bố đánh giá, tra cứu và chuyển yêu cầu đổi/hủy tới vận hành, mở form sửa món.
- [x] Kiểm tra 30 màn hình và trạng thái trên Chrome ở 16 kích thước từ 320 đến 1920 px, gồm hai khung điện thoại xoay ngang. Kiểm tra tràn ngang, dialog và vị trí của các thanh cố định. Kiểm tra riêng liên kết chân trang khi nút chat hiện và khi hóa đơn tạm tính có món.
- [x] Kiểm tra lint, định dạng, TypeScript, build workspace prototype và các kiểm thử dữ liệu món, giữ bàn, xung đột khung và phân quyền.
- [x] Kiểm tra Khách hàng gửi đánh giá, Nhân viên lưu phương án bàn và xác minh cọc, Admin mở các tác vụ quản trị, và Nhân viên bị từ chối khi mở trực tiếp trang dành riêng cho Admin.
- [x] Người dùng đã chốt giao diện Prototype hiện tại làm baseline ngày 20/11/2026.
- [ ] Nhà hàng xác nhận các giả định nghiệp vụ liên quan trước khi chốt T02 và chuyển sang triển khai chính thức.
