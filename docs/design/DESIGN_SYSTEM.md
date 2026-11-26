# Design system — Nhà hàng Ba Anh Em

**Bản 0.2 · 19/11/2026 · Bảng màu áp dụng trong prototype**

Áp dụng cho [đặc tả UI/UX](UI_UX_SPECIFICATION.md) và [danh sách màn hình](SCREEN_LIST.md). Tên token và component phục vụ bàn giao thiết kế. Các nhãn trạng thái cần đối chiếu chính sách và hợp đồng đã duyệt ở T03–T04.

## 1. Định hướng thị giác

- **Trải nghiệm khách.** Nền kem ấm, chữ nâu đậm và hành động chính màu đỏ gạch. Header, footer và phần giới thiệu trang chủ dùng nền nâu than với chữ kem và điểm nhấn cam mật ong. Trang chủ dùng ảnh tĩnh bàn món Việt toàn chiều rộng với lớp phủ tối sau chữ. Thực đơn dùng ảnh thật, tên, giá công bố và khả năng đặt trước. Trang đặt bàn, món và cọc dành phần lớn không gian cho dữ liệu, trạng thái và hành động.
- **Trải nghiệm vận hành.** Nền sáng, bảng trắng ngà, đường phân cách nhẹ và nhãn có chữ. Dùng đỏ gạch cho điều hướng hiện tại và hành động chính. Bố cục ưu tiên tìm theo ngày/khung, đọc mã lượt và xử lý ngoại lệ.
- **Nhận diện và hình ảnh.** Header và footer công khai dùng biểu tượng lửa trong vòng tròn, tên chữ «Ba Anh Em» và dòng «Nhà hàng món Việt». Hero dùng ảnh WebP 3:2 do người dùng cung cấp. Ảnh cắt theo viewport, lớp phủ tối theo chiều ngang trên desktop và chiều dọc trên mobile để chữ dễ đọc. Thẻ món 4:3, ảnh chi tiết giữ bố cục ổn định lúc tải. Ảnh thiếu có nền trung tính và tên món vẫn đọc được. Nội dung chữ được hiển thị riêng khỏi tài sản ảnh.
- **Giọng điệu.** Tiếng Việt rõ và ngắn. Nút mô tả công việc như «Kiểm tra khung giờ», «Gửi yêu cầu đặt bàn», «Lưu món» hoặc «Kiểm tra trạng thái». Dùng nhãn trạng thái đầy đủ ở các điểm có tiền, giữ bàn hoặc xử lý vận hành.

## 2. Màu sắc và token

Token theo ba lớp. Giá trị gốc xác định bảng màu. Token ngữ nghĩa định nghĩa vai trò. Token component quy định cách dùng ở một nhóm điều khiển. Ví dụ nút chính lấy nền từ action.primary và chữ từ text.inverse.

### 2.1 Giá trị màu gốc

Bảng màu lấy từ ảnh giao diện Ba Anh Em do người dùng cung cấp. Các biến CSS đang áp dụng trong Frontend nằm trong [styles.css](../../apps/web/src/shared/styles.css). Source Prototype trước chuyển đổi được lưu trong bản ZIP cục bộ, không phải workspace đang chạy.

| Vai trò                  | Giá trị | Vai trò                             | Giá trị |
| ------------------------ | ------- | ----------------------------------- | ------- |
| Nền trang                | #F7F2E9 | Nền thẻ và form                     | #FFFDF8 |
| Nền ô nhập, chữ trên CTA | #FFFEFA | Nền nhấn nhẹ                        | #F6E7DC |
| Nền đang chọn            | #EDDBCC | Nền nút vô hiệu                     | #EAE1D6 |
| Nền khung giờ hết chỗ    | #EEE8DF | Đường phân cách                     | #E3D9CA |
| Chữ chính                | #241C17 | Chữ phụ                             | #6D5B4D |
| Viền điều khiển          | #8A7463 | Nền header, footer, phần giới thiệu | #201A16 |
| Nền tối phụ              | #2D231D | Chữ kem trên nền tối                | #FFF4E7 |
| Cam mật ong              | #EFAB74 | Đỏ gạch chính                       | #A73C27 |
| Nút đặt bàn ở header     | #BA4E32 | Đỏ sẫm cho trợ lý và bước đang chọn | #983A28 |
| Nút chính hover          | #8A301F | Nút chính khi nhấn                  | #702719 |
| Chữ thành công           | #1E5D45 | Nền thành công                      | #EAF5EF |
| Chữ cảnh báo             | #744A0C | Nền cảnh báo                        | #FFF2D6 |
| Chữ lỗi                  | #922F34 | Nền lỗi                             | #FBEDEE |
| Chữ thông tin            | #2F536E | Nền thông tin                       | #EAF2F8 |

### 2.2 Màu ngữ nghĩa

| Nhóm token                                                 | Vai trò và ánh xạ                                                                                                                             |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| surface.page, surface.panel, surface.subtle                | Kem ấm cho nền trang, trắng ngà cho thẻ và form, kem pha đỏ cho vùng nhấn nhẹ.                                                                |
| text.primary, text.secondary, text.inverse                 | Nâu đậm, nâu trung tính và kem sáng. Giá món và tổng tiền trong danh sách đặt trước dùng đỏ gạch.                                             |
| action.primary, action.hover, action.pressed               | Đỏ gạch với chữ trắng ấm. Dùng đỏ sẫm dần khi rê chuột và nhấn. Nút ở header dùng #BA4E32.                                                    |
| action.secondary, action.link                              | Đỏ gạch trên nền sáng. Phần giới thiệu dùng chữ kem và viền cam mật ong cho nút phụ. Liên kết trong nội dung có gạch chân.                    |
| accent.text, accent.surface                                | Cam mật ong trên nền tối. Dùng đỏ gạch trên nền sáng và màu kem pha đỏ cho vùng nhấn nhẹ.                                                     |
| border.divider, border.control                             | Viền sáng để phân cách nội dung. Viền nâu đậm hơn để nhận ra điều khiển và ô nhập.                                                            |
| state.focus, state.focus.inverse                           | Vòng focus 2 px. Dùng đỏ gạch trên nền sáng và cam mật ong trên nền tối.                                                                      |
| state.selected, state.disabled                             | Bộ lọc đang chọn dùng nền nâu than. Bước và giờ đang chọn dùng nền #EDDBCC. Nút vô hiệu và giờ hết chỗ có nền riêng, chữ phụ và nhãn khi cần. |
| status.success, status.warning, status.danger, status.info | Dùng cặp chữ và nền tương ứng trong bảng màu. Trạng thái trung tính dùng chữ phụ trên nền nhấn nhẹ.                                           |
| surface.overlay                                            | Lớp phủ modal dùng nâu than với độ đục 56%.                                                                                                   |

### 2.3 Cặp tương phản đã tính

| Cặp                                               | Tỷ lệ                            |
| ------------------------------------------------- | -------------------------------- |
| Chữ chính / nền trang, nền thẻ                    | 15,02:1 và 16,48:1               |
| Chữ phụ / nền trang, nút vô hiệu, giờ hết chỗ     | 5,79:1, 4,99:1 và 5,30:1         |
| Chữ CTA / đỏ gạch, nút hover, nút khi nhấn        | 6,27:1, 8,25:1 và 10,44:1        |
| Chữ CTA / nút đặt bàn ở header                    | 4,93:1                           |
| Chữ kem, cam mật ong / nâu than                   | 15,85:1 và 8,80:1                |
| Viền điều khiển / nền ô nhập, nền trang           | 4,37:1 và 3,96:1                 |
| Focus đỏ gạch / nền trang, nền thẻ                | 5,67:1 và 6,22:1                 |
| Chữ của bước đang chọn / nền đang chọn            | 5,25:1                           |
| Success, warning, danger, info trên nền tương ứng | 6,95:1, 6,94:1, 6,89:1 và 7,18:1 |

Mục tiêu WCAG 2.2 AA khi triển khai gồm 4,5:1 cho chữ thường, 3:1 cho chữ lớn và thành phần phi văn bản theo tiêu chí áp dụng. Các tỷ lệ trên tính từ màu thiết kế. Focus thực tế, ảnh nền và các trạng thái kết hợp cần đo lại trên giao diện chạy được. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## 3. Typography

| Token              | Mobile, cỡ/line-height | Desktop, cỡ/line-height | Font và độ đậm                                               |
| ------------------ | ---------------------- | ----------------------- | ------------------------------------------------------------ |
| type.display       | 32/42 px               | 52/64 px                | Lora 600. H1 trang chủ và tiêu đề giới thiệu ngắn.           |
| type.page-title    | 26/36 px               | 36/48 px                | Be Vietnam Pro 700. Tiêu đề thao tác và vận hành.            |
| type.section-title | 20/28 px               | 24/34 px                | Be Vietnam Pro 700.                                          |
| type.item-title    | 16/24 px               | 18/26 px                | Be Vietnam Pro 600. Tên món, tên khu, tiêu đề card.          |
| type.body          | 16/26 px               | 16/26 px                | Be Vietnam Pro 400.                                          |
| type.ui            | 14/22 px               | 14/22 px                | Be Vietnam Pro 400/600. Tab, nhãn, chú giải và dữ liệu bảng. |
| type.caption       | 13/20 px               | 13/20 px                | Be Vietnam Pro 400/600. Metadata phụ.                        |
| type.input         | 16/24 px               | 16/24 px                | Be Vietnam Pro 400.                                          |

- **Fallback.** Lora dùng Georgia rồi serif. Be Vietnam Pro dùng system-ui rồi sans-serif. Chỉ chuẩn bị weight thực sự dùng. Khi biên dịch font, kiểm thử dấu tiếng Việt và gói subset trước khi duyệt. [Metadata Be Vietnam Pro](https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/METADATA.pb), [Metadata Lora](https://raw.githubusercontent.com/google/fonts/main/ofl/lora/METADATA.pb).
- **Số và xuống dòng.** Căn phải giá và số liệu cùng cột, căn trái ngày giờ và nhãn. Giữ dấu tiếng Việt, dùng số có cùng độ rộng khi font hỗ trợ. Giá dùng định dạng vi-VN và đơn vị đã xác nhận. Tên món dài có thể xuống dòng, thao tác và giá giữ thứ tự đọc ổn định.
- **Tiêu đề và mô tả.** Một H1 trên màn hình chính. Nhãn form và lỗi giữ nguyên nghĩa khi phóng to; nội dung dài được bọc dòng.

## 4. Spacing, lưới và responsive

- **Spacing.** Dùng 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px. Mặc định 8 px giữa nhãn và nội dung, 16 px giữa các trường, 24 px giữa nhóm, 40–64 px giữa phần lớn trên trang công khai.
- **Shape.** Bán kính 8 px cho điều khiển, 12 px cho khối nội dung, 16 px cho modal/sheet. Chip thời gian và nhãn trạng thái dùng 8 px. Đổ bóng nhẹ chỉ ở lớp nổi và khi cần phân biệt chiều sâu.
- **Kích thước.** Cỡ chạm thiết kế tối thiểu 44 × 44 px cho nút, ô thời gian, tăng/giảm, đóng và điều hướng. Input tiêu chuẩn cao tối thiểu 48 px. Hàng dữ liệu tương tác tối thiểu 48 px, có thể cao hơn vì chữ dài.

| Rộng viewport | Lưới và mép trang                                                          | Quy tắc hành vi                                                                                                                |
| ------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 320–767 px    | 4 cột, mép 16 px, gutter 12 px.                                            | Form một cột, nút chính toàn chiều rộng ô. Menu danh sách một cột ở 320; hai cột chỉ khi thẻ, hành động và tên món vẫn đủ chỗ. |
| 768–1023 px   | 8 cột, mép 24 px, gutter 20 px.                                            | Hai vùng nội dung nếu đọc được. Form hoặc tóm tắt có thể xếp chồng. Điều hướng vận hành gọn.                                   |
| Từ 1024 px    | 12 cột, mép tối thiểu 32 px, gutter 24 px. Khung công khai tối đa 1200 px. | Luồng giao dịch 7/5 cột. Màn hình vận hành tận dụng chiều rộng, sidebar rộng 224 px từ 1280 px.                                |

Header công khai cao tối thiểu 60 px trên mobile và 72 px trên desktop. Thanh hành động nếu cố định cần chừa safe area và khoảng cuối trang. Một màn hình dùng tối đa một thanh hành động cố định. Khi chat hoặc modal mở, kiểm thứ tự focus, nút đóng và bàn phím ảo. Test ở 320, 390, 768, 1024 và 1440 px. Ở 320 và khi zoom, trang không cuộn ngang toàn cục. Sơ đồ cần hai chiều có cuộn vùng riêng và danh sách thay thế.

## 5. Thư viện component

| ID    | Component                            | Cấu tạo, token và trạng thái                                                                                                                                                                                                                                                                        |
| ----- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CP-01 | Header, điều hướng, footer           | Tên chữ, lối vào thực đơn và đặt bàn. Header và footer nền nâu than. Nav hiện tại có nhãn và vạch cam mật ong trên desktop, nền nhấn nhẹ trong menu mobile. Vùng footer hiển thị thông tin đơn vị đã duyệt và lối về thực đơn/đặt bàn. Nav mobile có nút mở và đóng có tên.                         |
| CP-02 | Button và link                       | Primary dùng đỏ gạch với chữ trắng ấm và màu hover/pressed theo bảng. Secondary nền panel, viền control, chữ đỏ gạch. Tertiary chữ đỏ gạch. Destructive dùng danger với chữ tương phản. Có default, hover, focus, pressed, disabled và busy. Busy giữ kích thước và chỉ một hành động ghi hiệu lực. |
| CP-03 | Form field                           | Nhãn luôn hiển thị, mô tả ràng buộc, input, trợ giúp và lỗi theo trường. Viền control mặc định, focus ring, danger text + chỉ báo chữ khi sai. Ghi rõ trường bắt buộc. Dùng cấu hình đã duyệt cho tự điền.                                                                                          |
| CP-04 | Chọn ngày, số khách và khung         | Dùng điều khiển ngày phù hợp thiết bị, bộ chọn số khách có nhãn, nhóm giờ có selected, còn nhận, hết chỗ và ngoài lịch nếu hiển thị. Ghi lý do bằng chữ. Khi dữ liệu cũ, bỏ xác nhận khung cho tới khi có kết quả mới.                                                                              |
| CP-05 | Tiến trình và tóm tắt                | Các bước được đặt tên theo nghiệp vụ. Bước hiện tại có chữ/đánh dấu. Tóm tắt hiển thị ngày, khung, số khách và khoản liên quan được cung cấp, có lối sửa bước đủ quyền.                                                                                                                             |
| CP-06 | Thẻ món, nhóm món, chi tiết          | Ảnh 4:3, tên, giá nếu có, nhãn khả dụng theo Q-09. Chế độ xem và chọn có hành động khác nhau. Chi tiết và thông tin thành phần chỉ hiển thị dữ liệu công bố.                                                                                                                                        |
| CP-07 | Điều chỉnh số lượng và danh sách món | Nút tăng/giảm có tên món, giá trị số, thông báo giới hạn và bản tóm tắt. Dòng lỗi giữ dữ liệu để sửa. Nút «Lưu món» phản ánh danh sách có hiệu lực sau trả kết quả.                                                                                                                                 |
| CP-08 | Nhãn và nhóm trạng thái              | Chip có chữ kèm biểu tượng khi cần. Tình trạng đặt chỗ, bố trí, món và cọc theo nguồn tương ứng. Dùng info cho chờ xác minh, warning cho cần đối chiếu, success cho kết quả đã xác minh, danger cho lỗi cần xử lý.                                                                                  |
| CP-09 | Thông báo, empty, error và skeleton  | Inline alert gần hành động liên quan. Skeleton khớp khối sau tải. Empty phân biệt thiếu dữ liệu với thiếu quyền và lỗi. Thông báo sao chép hoặc lưu ngắn dùng vùng trạng thái, kết quả giao dịch quan trọng giữ tại màn hình.                                                                       |
| CP-10 | VietQR và thông tin chuyển           | QR có vùng trắng, kích thước đề xuất từ 200 × 200 px khi chỗ cho phép, giữ vùng yên theo định dạng QR được cấp. Bên cạnh có số tiền, bên nhận, tham chiếu, thời hạn nếu có. Dùng nút sao chép từng trường được phép. Có tải, QR lỗi, hết hiệu lực, chờ, cần đối chiếu, đã xác minh.                 |
| CP-11 | Modal, drawer và sheet               | Nền panel và lớp phủ với modal. Có heading, nút đóng, điều khiển theo thứ tự đọc và vùng cuộn bên trong nếu cần. Modal chuyển focus vào, đóng bằng Escape và trả focus. Xác nhận cần nội dung và hệ quả cụ thể.                                                                                     |
| CP-12 | Chat, tin nhắn, gợi ý và kết quả     | Nút chat đỏ sẫm cố định ở góc dưới bên phải. Popup dùng header nâu than, lịch sử cuộn và ô nhập có nút gửi từ 44 px. Có trạng thái đang xử lý, lỗi gửi lại, thẻ món và thẻ xác nhận ngày/khung/số khách. Chỉ công bố mã và trạng thái từ kết quả nghiệp vụ.                                         |
| CP-13 | Bảng, danh sách và bộ lọc vận hành   | Header cột rõ, ngày/giờ theo cùng múi giờ. Cột mã, tới lúc, số khách và trạng thái theo nghiệp vụ. Mobile dùng danh sách có cặp nhãn–giá trị. Phạm vi bộ lọc theo BRS và dữ liệu đã duyệt.                                                                                                          |
| CP-14 | Sơ đồ và danh sách bàn               | Bàn có mã, sức chứa và nhãn trạng thái. Có chọn tương đương qua danh sách và bàn phím. Nổi rõ bàn đang chọn, bàn cũ và mới. UI giữ bố trí có hiệu lực nếu thao tác thất bại.                                                                                                                        |
| CP-15 | Báo cáo và số liệu                   | Tên chỉ số, kỳ, đơn vị, mốc và bộ lọc áp dụng. Bảng dùng cho giá trị chính xác. Chỉ dùng biểu đồ nếu chỉ số và nhu cầu đối chiếu đã chốt. Có cách đọc giá trị bằng chữ hoặc bảng tương đương.                                                                                                       |
| CP-16 | Menu hành động theo quyền            | Chỉ hiện tác vụ hợp lệ với quyền/trạng thái. Khi trạng thái có thể thay đổi trong khi mở, kiểm lại lúc thao tác. Hiển thị kết quả từ chối và trạng thái hiện hành, phòng vệ ở API.                                                                                                                  |

## 6. Hành vi dùng chung

- **Focus và thông báo.** Thứ tự Tab theo thứ tự đọc. Focus nhìn thấy rõ và không bị sticky bar che. Khi có lỗi submit, đưa focus tới tóm tắt lỗi hoặc trường đầu tiên cần sửa, vẫn giữ giá trị nhập hợp lệ. Dùng thông báo trạng thái có thể đọc cho lưu, tải xong hoặc thay đổi giờ. Chat chỉ đọc tin mới có ý nghĩa, bộ đếm hạn tránh đọc liên tục. Dùng dialog đúng ngữ nghĩa cho lớp modal. [W3C APG Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- **Chuyển động.** 120–180 ms cho chuyển trạng thái, tối đa 220 ms cho mở panel. Khi giảm chuyển động, bỏ dịch chuyển, chuyển cảnh tức thì hoặc dùng fade rất nhẹ. Skeleton có phương án tĩnh. Không phụ thuộc carousel để truy cập món.
- **Biểu tượng.** Một bộ nét nhìn nhất quán, 16 px cho mật độ cao và 20–24 px cho điều khiển. Icon hành động có nhãn đọc được. Màu, icon và nhãn phối hợp thông báo tình trạng.
- **Hiệu năng thiết kế.** Giữ kích thước ảnh trước khi tải. Hero dùng một ảnh ưu tiên, các ảnh dưới nếp gấp tải theo nhu cầu. Trang nghiệp vụ dùng ít ảnh. Báo cáo và sơ đồ vẫn trình bày dữ liệu hữu ích khi ảnh/biểu đồ chưa tải. Mục tiêu định lượng lấy từ Q-14.
