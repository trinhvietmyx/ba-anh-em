# Danh sách màn hình — Nhà hàng Ba Anh Em

**Bản 0.1 · 19/11/2026 · Đề xuất thiết kế**

Mã màn hình dùng xuyên suốt bộ thiết kế. Route là địa chỉ frontend đề xuất, panel dùng chung route của màn hình cha. Đặc tả bố cục và hành vi chi tiết nằm ở [UI_UX_SPECIFICATION.md](UI_UX_SPECIFICATION.md). Nguồn truy vết là [BRS](../../../documents/BRS-Nha-hang-Ba-Anh-Em.md) và [kế hoạch triển khai](../IMPLEMENTATION_PLAN.md).

## 1. Màn hình MVP

| Mã · Màn hình                         | Tác nhân và điểm vào                                                               | Hành động chính                                                       | BRS · Nghiệm thu                                                            | Task                      |
| ------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------- |
| PUB-01 · Trang chủ                    | Khách · `/`                                                                        | Mở đặt bàn hoặc mở thực đơn.                                          | NV-01, NV-03, NV-06 · AC-19                                                 | T02, T08, T27             |
| PUB-02 · Thực đơn                     | Khách · `/thuc-don`                                                                | Duyệt món và tình trạng nhận đặt.                                     | UC-01 · AC-01                                                               | T09                       |
| PUB-03 · Chi tiết món                 | Khách · panel từ PUB-02, PUB-05 hoặc thẻ món chat khi có dữ liệu                   | Đọc dữ liệu công bố và quay lại đúng ngữ cảnh.                        | UC-01, UC-06, UC-17 · AC-01, AC-05, AC-15                                   | T09, T13, T20             |
| PUB-04 · Đặt bàn                      | Khách · `/dat-ban`, mở từ header, thực đơn hoặc chat theo Q-11                     | Chọn khung, cung cấp dữ liệu bắt buộc, gửi yêu cầu.                   | UC-03, UC-04, UC-18 · AC-02, AC-03, AC-04, AC-16, AC-18                     | T10–T12, T21–T22          |
| PUB-05 · Chọn món trước               | Khách trong ngữ cảnh lượt/dự thảo đã được phép · `/dat-ban/chon-mon`               | Chọn số lượng, kiểm tra và lưu món.                                   | UC-06 · AC-05                                                               | T13, T22                  |
| PUB-06 · Đặt cọc                      | Khách được phép · `/dat-ban/dat-coc`                                               | Đọc hoặc sao chép thông tin VietQR và xem tình trạng cọc có hiệu lực. | UC-08–UC-10 · AC-07, AC-08, AC-09, AC-17, AC-18                             | T17–T18, T22              |
| PUB-07 · Kết quả đặt chỗ              | Khách được phép · `/dat-ban/ket-qua`, từ web, cọc hoặc chat                        | Đối chiếu mã, tình trạng riêng và bước tiếp theo.                     | UC-04, UC-06, UC-08–UC-10, UC-18 · AC-03, AC-05, AC-08, AC-09, AC-16, AC-18 | T11–T13, T17–T18, T21–T22 |
| PUB-08 · Trợ lý AI                    | Khách · cửa sổ mở từ nút chat nổi trên các trang công khai                         | Tư vấn món hoặc thu thập, xác nhận ý định đặt bàn.                    | UC-17, UC-18 · AC-04, AC-15, AC-16, AC-17, AC-18                            | T20–T22                   |
| OPS-01 · Đăng nhập và khôi phục phiên | Nhân sự · `/van-hanh/dang-nhap`, mở khi cần phiên theo T07                         | Xác thực theo phương án đã duyệt và quay lại đích đủ quyền.           | NFR-04, UC-13 · AC-12, AC-17                                                | T07–T08, T23              |
| OPS-02 · Danh sách đặt chỗ            | Quản lý/nhân sự được giao · `/van-hanh/dat-cho`                                    | Tìm theo ngày/khung hoặc mã trong phạm vi và mở chi tiết.             | UC-13, UC-18 · AC-03, AC-12, AC-16                                          | T15, T21–T22              |
| OPS-03 · Chi tiết và kết quả phục vụ  | Quản lý/nhân sự được giao · `/van-hanh/dat-cho/:id`                                | Xem tình trạng, ghi nhận khách đến/kết quả hoặc mở tác vụ liên quan.  | UC-07, UC-13, UC-14 · AC-06, AC-12, AC-13                                   | T15–T16, T18, T22         |
| OPS-04 · Sơ đồ và phân bàn            | Quản lý/người điều phối · `/van-hanh/so-do-ban`, có thể mở từ OPS-03               | Chọn khung, đối chiếu khả dụng và lưu phương án bàn.                  | UC-11, UC-12 · AC-04, AC-10, AC-11                                          | T14, T22                  |
| OPS-05 · Chuẩn bị bếp                 | Quản lý hoặc bếp theo Q-08 · `/van-hanh/chuan-bi-bep` hoặc vùng trong OPS-03       | Xem món cần chuẩn bị và thay đổi sau chốt nếu có.                     | UC-07 · AC-06                                                               | T16, T22                  |
| OPS-06 · Đối chiếu cọc                | Người đối chiếu được phân quyền · `/van-hanh/dat-coc`, danh sách và panel chi tiết | Kiểm bằng chứng, xử lý sai lệch và kết quả cọc.                       | UC-09, UC-10 · AC-08, AC-09, AC-13, AC-17, AC-18                            | T18, T22–T24              |
| OPS-07 · Báo cáo                      | Quản lý/người có quyền · `/van-hanh/bao-cao`                                       | Chọn kỳ và đọc chỉ số được duyệt.                                     | UC-16 · AC-14                                                               | T19, T22                  |
| SYS-01 · Phục hồi và quyền truy cập   | Khách/nhân sự · trạng thái dùng chung trong route có liên quan                     | Thử lại phù hợp, đăng nhập lại hoặc trở về màn hình đủ quyền.         | NFR-02, NFR-04, NFR-08 · AC-12, AC-17, AC-18                                | T07–T08, T22–T24          |

## 2. Màn hình tùy chọn

Chỉ đưa vào sitemap vận hành khi use case tương ứng được duyệt. Xác minh phiên khi xem lại một lượt theo Q-07. Quyền gửi yêu cầu và quyền quyết định thay đổi được chốt riêng.

| Mã · Màn hình                        | Tác nhân và điểm vào                   | Hành động chính                                                | BRS · Nghiệm thu | Task |
| ------------------------------------ | -------------------------------------- | -------------------------------------------------------------- | ---------------- | ---- |
| OPT-01 · Quản trị thực đơn           | Người được giao · `/van-hanh/thuc-don` | Cập nhật dữ liệu công bố theo quyền.                           | UC-02 · AC-20a   | T29  |
| OPT-02 · Tra cứu và yêu cầu thay đổi | Khách đã xác minh · `/tra-cuu-dat-cho` | Truy cập đúng lượt và gửi yêu cầu trong điều kiện cho phép.    | UC-05 · AC-20b   | T30  |
| OPT-03 · Quyết định đổi/hủy          | Người có quyền · panel trong OPS-03    | Kiểm tác động, áp dụng quyết định và xem trạng thái sau xử lý. | UC-15 · AC-20c   | T31  |

## 3. Màn hình mức Tốt

Nếu chọn mục tiêu mức Tốt, ba use case đều được kiểm thử. Một số màn hình dưới đây là biến thể hiển thị theo chính sách đã chốt.

| Mã · Màn hình                                   | Tác nhân và điểm vào                                                          | Hành động chính                                                        | BRS · Nghiệm thu | Task     |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------- | -------- |
| ADV-01 · Đặt tiệc/sự kiện                       | Khách · `/dat-tiec`                                                           | Gửi nhu cầu và đọc kết quả tiếp nhận theo Q-12.                        | UC-20 · AC-21a   | T32, T35 |
| ADV-02 · Xử lý yêu cầu tiệc                     | Nhân sự được giao · `/van-hanh/dat-tiec`                                      | Xem nhu cầu, xét khả năng và cập nhật quyết định.                      | UC-20 · AC-21a   | T32, T35 |
| ADV-03 · Đánh giá nhà hàng                      | Khách đủ điều kiện theo Q-13 · `/danh-gia` hoặc điểm vào sau phục vụ đã duyệt | Gửi đánh giá và đọc tình trạng. Chỉ hiển thị đánh giá theo chính sách. | UC-21 · AC-21b   | T33, T35 |
| ADV-04 · Quản lý nội dung đánh giá              | Người có quyền · `/van-hanh/danh-gia` nếu cần duyệt                           | Xử lý và xác minh trạng thái hiển thị.                                 | UC-21 · AC-21b   | T33, T35 |
| ADV-05 · Biến thể thao tác nghiệp vụ trong chat | Khách · trong PUB-08                                                          | Xác nhận thao tác đủ quyền và đọc kết quả từ API.                      | UC-19 · AC-21c   | T34, T35 |

## 4. Quy tắc dùng danh mục

- **Tổng số thiết kế.** 15 màn hình/biến thể MVP, một nhóm phục hồi dùng chung, ba màn hình tùy chọn và năm màn hình/biến thể mức Tốt. Tiêu chí AC-19 chạy xuyên các màn hình MVP theo kịch bản T27.
- **URL và dữ liệu.** Route theo lượt đặt chỉ hiển thị dữ liệu sau kiểm tra quyền. Mã tham chiếu dùng để đối chiếu. Thông tin liên hệ, chi tiết giao dịch và thông điệp chat nằm ngoài URL. Việc mở lại, xác minh hoặc chuyển kênh dùng Q-07, Q-11 và Q-15.
- **Trạng thái điều kiện.** PUB-05, PUB-06 và PUB-07 có thứ tự tùy chính sách Q-03/Q-05. OPS-05 có thể dùng phần giao bếp trong OPS-03. ADV-04 phụ thuộc kiểm duyệt Q-13. ADV-05 là biến thể của chat hiện có.
- **Bàn giao.** Khi thêm màn hình trong phạm vi đã duyệt, cập nhật mã, tác nhân, điểm vào, use case, AC, task và layout tương ứng. Đối chiếu bộ trạng thái trước khi chuyển T08.
