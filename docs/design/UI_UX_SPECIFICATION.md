# Đặc tả UI/UX — Nhà hàng Ba Anh Em

**Bản 0.1 · 19/11/2026 · Thiết kế văn bản cho T02**

Căn cứ [BRS v0.1](../../../documents/BRS-Nha-hang-Ba-Anh-Em.md), [kế hoạch triển khai](../IMPLEMENTATION_PLAN.md), [cấu trúc dự án](../PROJECT_STRUCTURE.md) và [khảo sát tham khảo](REFERENCE_ANALYSIS.md). Mã màn hình, chi tiết route và truy vết AC nằm trong [SCREEN_LIST.md](SCREEN_LIST.md). Kích thước và component CP-01–CP-16 nằm trong [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## 1. Người dùng, tác vụ ưu tiên và định hướng

- **Khách đi ăn.** Cần biết giờ nào phù hợp, đặt cho đúng số khách, xem món và biết đã xác nhận chưa. Ưu tiên đọc trên điện thoại, điền ít trường và biết cách phục hồi khi hết chỗ hoặc mất phản hồi.
- **Quản lý/người điều phối.** Cần biết lượt nào tới, bàn nào có thể dùng và xung đột ở đâu. Ưu tiên bảng theo ngày/khung, sơ đồ kèm danh sách và trạng thái có nguồn.
- **Người chuẩn bị bếp.** Cần món, số lượng, khung và thay đổi đã được phép. Quyền truy cập trực tiếp phụ thuộc Q-08.
- **Người đối chiếu cọc.** Cần tham chiếu, tiền dự kiến/thực nhận, bằng chứng được phép xem và bước xử lý ngoại lệ theo chính sách.
- **Định hướng thị giác.** Dùng bố cục hiện đại, nền kem ấm, nâu than, nút chính đỏ gạch, ảnh bàn ăn thật và một CTA rõ. Các màn hình giao dịch ưu tiên nội dung và thao tác. Khu vực vận hành ưu tiên bố cục đọc nhanh. Mọi thông tin nhà hàng, giờ, món và chính sách công khai dùng dữ liệu đã duyệt.

## 2. Sitemap, layout dùng chung và điều hướng

### 2.1. Khu vực khách

- **Trang chủ PUB-01** → **Thực đơn PUB-02** → **Chi tiết món PUB-03**.
- **Đặt bàn PUB-04** → **Chọn món PUB-05**, **Đặt cọc PUB-06**, **Kết quả PUB-07** theo trạng thái và chính sách.
- **Trợ lý AI PUB-08** mở từ nút chat nổi ở góc dưới bên phải các trang dành cho khách. Tư vấn mở chi tiết món nếu phù hợp. Đặt bàn đi qua bước xác nhận và kết quả chung. Nhánh chuyển kênh theo Q-11.
- **Tùy chọn OPT-02**, **mức Tốt ADV-01/03** chỉ xuất hiện khi phạm vi được duyệt. **ADV-05** là biến thể trong PUB-08.

Header công khai có tên nhà hàng, «Trang chủ», «Thực đơn» và CTA «Đặt bàn». Tại mobile, tên chữ và CTA đặt bàn giữ chỗ trong header, các điểm vào khác nằm trong điều hướng có nút mở được đặt tên. Footer gồm tên đơn vị, liên kết tác vụ và thông tin công khai đã duyệt. Tại luồng giao dịch, header rút gọn có đường quay lại, tiến trình dùng tên bước và tối đa một thanh hành động cố định. Tại viewport hẹp, tóm tắt đặt sau tiêu đề/gắn trên trước phần thao tác; giữ đủ khoảng để nút và trường đang focus đọc được.

### 2.2. Khu vực vận hành

- **Đăng nhập OPS-01** → **Đặt chỗ OPS-02** → **Chi tiết/Kết quả phục vụ OPS-03**.
- Từ điều hướng theo quyền → **Sơ đồ OPS-04**, **Chuẩn bị bếp OPS-05**, **Đối chiếu cọc OPS-06**, **Báo cáo OPS-07**. OPS-03 cũng có lối vào tác vụ liên quan với ngữ cảnh lượt.
- **OPT-01** xuất hiện theo quyền. **OPT-03** là thao tác trong OPS-03. **ADV-02/04** mở theo phạm vi và quyền đã duyệt.
- **SYS-01** xử lý phiên, quyền, mất kết nối hoặc trang không tìm thấy ở khu vực liên quan.

Từ 1280 px, sidebar 224 px và header nội dung có tiêu đề, ngữ cảnh ngày/khung nếu liên quan và menu phiên. Bên dưới 1280 px dùng header gọn và menu mở theo yêu cầu. Với bảng chuyển danh sách, mỗi mục có nhãn trường, mã và trạng thái. Sau khi thoát chi tiết, quay lại bộ lọc gần nhất nếu phiên còn hợp lệ.

## 3. User flow và các điểm quyết định

### F1 · Khách đặt bàn từ web

1. **Bắt đầu tại PUB-01/02 → PUB-04.** Khách nhập ngày, số khách. Cần cho phép chọn ngày trong phạm vi Q-01 và giải thích ngoại lệ. Kết quả tra cứu dùng ngày/giờ theo nhà hàng và trạng thái từ hệ thống.
2. **Chọn giờ.** Có khung khả dụng thì chọn một giờ và xem tóm tắt. Khung hết, ngoài lịch hoặc không bố trí được có lý do theo dữ liệu. Chỉ đề xuất giờ đã kiểm; khách được thay đổi ngày hoặc số khách. Tải lỗi cho thử lại dữ liệu vừa nhập.
3. **Kiểm tra và gửi.** Hiện các trường liên hệ/xác minh đã duyệt (Q-07) sau khi chọn giờ. Hiện lại ngày, giờ, số khách, thông tin liên hệ được phép và điều kiện tiếp theo. Bấm «Gửi yêu cầu đặt bàn» một lần. Khi giờ vừa hết, trả khách về phần giờ, giữ phần dữ liệu được phép và thông báo chỗ vừa thay đổi.
4. **Chuyển theo chính sách.** Nếu món phải ghi trong lúc tạo hoặc ở bước tiếp, chuyển PUB-05 theo Q-05. Nếu phát sinh cọc, chuyển PUB-06 tại mốc Q-03. Khi có kết quả, PUB-07 thể hiện đúng mã và trạng thái. Tình trạng chờ duyệt/chờ cọc có hành động tiếp theo. Chỉ hiển thị «Đã xác nhận» khi nguồn nghiệp vụ xác nhận.
5. **Phục hồi.** Khi gửi rồi mất phản hồi, thông báo «Đang kiểm tra kết quả» và dùng đường tìm lại theo Q-15 trước khi cho phép tạo ý định mới. Quyền truy cập lại qua Q-07. Bấm quay lại từ trong bước đặt giữ dữ liệu được phép khi còn ngữ cảnh; truy cập trực tiếp bước riêng xử lý qua SYS-01 hoặc quay đầu luồng nếu ngữ cảnh thiếu.

### F2 · Khách duyệt và đặt món trước

1. PUB-02 hiển thị menu công bố, nhóm món theo dữ liệu Q-09. PUB-03 mở chi tiết nếu có nội dung cần đọc. Người chưa có ngữ cảnh đặt có thể mở PUB-04 để bắt đầu.
2. PUB-05 dùng dữ liệu thực đơn trong ngữ cảnh đặt đủ điều kiện. Thay đổi số lượng, xem tóm tắt, nhập ghi chú khi cho phép. Hiển thị số tiền món nếu nghiệp vụ dùng giá và nhãn tách khỏi cọc.
3. Khi lưu, đánh dấu món hết, đổi giá, tới hạn hoặc số lượng sai ở đúng dòng. Thực hiện toàn bộ hoặc từng phần theo Q-05. Nếu một phần đã lưu, tách «Đã ghi nhận» và «Cần sửa» để khách biết chính xác danh sách có hiệu lực. Nếu hết hạn, hiển thị lý do và bước còn được phép.

### F3 · Cọc và đối chiếu

1. PUB-06 mở với khoản cọc thuộc lượt đã được xác minh quyền. Đọc số tiền, bên nhận, tham chiếu chuyển và hạn nếu có. Khi dùng cùng điện thoại, nút sao chép dữ liệu cho phép dùng kênh ngân hàng đã được chấp thuận. Phản hồi sao chép chỉ xác nhận sao chép.
2. Sau khi khách chuyển, trạng thái chờ thanh toán hoặc chờ đối chiếu lấy từ hệ thống. Hiển thị «Kiểm tra trạng thái» và hướng dẫn theo Q-04. Cơ chế xác minh thủ công hay tự động dùng cùng cách đọc kết quả. Tuyên bố đã chuyển của khách chỉ tạo dữ liệu hỗ trợ khi có quy trình đã duyệt.
3. OPS-06 đọc khoản cọc, kiểm bằng chứng và xử lý đúng quyền. Khi sai số tiền hoặc tham chiếu, ghi ngoại lệ. Nếu tiền tới sau hạn hoặc bàn đã cấp, hiển thị hai dữ kiện song song. Thông báo quyết định tiếp theo theo chính sách và đưa kết quả mới về PUB-06/07.
4. Khi UI mất kết nối hoặc hết hạn QR, giữ tình trạng đã xác minh gần nhất có thời điểm. Nếu có khả năng tiền đã chuyển, ưu tiên tìm lại kết quả theo Q-04/Q-15. Hiện lựa chọn nhận thông tin chuyển mới khi có quyền và chính sách.

### F4 · Tư vấn và đặt bàn qua chat

1. Mở PUB-08 từ bề mặt công khai. Khách hỏi món hoặc gửi ý định đặt bàn. UI thông báo đang xử lý, giữ nội dung trong ngữ cảnh đã duyệt.
2. Với tư vấn, trả thẻ món và lý do dựa trên dữ liệu công bố. Khi chưa có giá, thành phần hoặc thông tin dị ứng đã xác nhận, nêu dữ liệu còn thiếu. Có đường về thực đơn.
3. Với đặt bàn, hỏi ngày/giờ/số khách còn thiếu. Chuyển thời gian mơ hồ thành lựa chọn rõ ràng, rồi trình bày một thẻ xác nhận. Trường liên hệ khi cần lấy qua bước xác minh/form được duyệt. Hành động trang web hoặc giao diện trong chat dùng chung kiểm tra nghiệp vụ.
4. Có kết quả hệ thống thì hiện mã, trạng thái và bước tiếp theo, hoặc mở PUB-07 theo luồng. Khi hết chỗ, đưa lựa chọn đã kiểm. Khi lỗi/timeout, chuyển sang đặt bàn web theo Q-11 và áp dụng quy tắc phục hồi ý định theo Q-15. Khi chọn mức Tốt, ADV-05 bổ sung bước xác nhận thao tác được cấp và hiển thị kết quả API.

### F5 · Vận hành và báo cáo

1. OPS-01 xác thực → OPS-02 kiểm ngày/khung, danh sách lượt → OPS-03 xem chi tiết trong quyền. Kênh web và chat dùng cùng mã. Người thiếu quyền vào SYS-01, với thông báo và đường quay lại theo quyền.
2. OPS-04 đọc khung hiện hành, chọn lượt và phương án bàn. Trước lưu thấy sức chứa, bàn cũ/bàn mới và trạng thái. Nếu bị xung đột, giữ bố trí đang có và cập nhật tình trạng khả dụng. Với khách đến/không đến, OPS-03 xác định thao tác theo Q-06.
3. OPS-05 nhận món theo mốc Q-05 và quyền Q-08. Thay đổi sau chốt được đánh dấu cạnh dòng bị ảnh hưởng. OPS-06 xử lý cọc theo F3. OPS-07 cho xem các chỉ số theo Q-10, kỳ và phạm vi đã duyệt, có phân biệt không có dữ liệu, số 0 và lỗi.

### F6 · Tùy chọn và mức Tốt

- **Tùy chọn.** OPT-01 nhập dữ liệu thực đơn → rà trường được công bố → lưu hoặc xử lý xung đột. OPT-02 xác minh quyền → đọc lượt → gửi yêu cầu còn hạn. OPT-03 xem tác động tới bàn/món/cọc → quyết định → hiện kết quả riêng; nếu khung mới không phù hợp, giữ phương án hiện hành.
- **Mức Tốt.** ADV-01 tiếp nhận yêu cầu tiệc → ADV-02 xem xét và cập nhật tình trạng theo Q-12. ADV-03 kiểm tra điều kiện, gửi và hiển thị theo Q-13; ADV-04 chỉ dùng khi có kiểm duyệt. ADV-05 hiển thị bước xác nhận theo quyền và kết quả API trong PUB-08.

## 4. Layout chi tiết theo màn hình

Thứ tự trên mobile theo thứ tự khối được liệt kê, trừ khi ghi riêng. Bố cục desktop dùng lưới 12 cột từ 1024 px. Trạng thái tải, trống, lỗi, kết quả và validation áp dụng theo mục 5, với nhánh bổ sung tại từng màn hình dưới đây.

### PUB-01 · Trang chủ

- **Bố cục.** Header CP-01 → ảnh tĩnh bàn món Việt toàn chiều rộng với tên Ba Anh Em và hai nút «Đặt bàn», «Xem thực đơn» → dải món nổi bật → khối đặt bàn và ảnh bàn ăn → footer. Desktop đặt tên và nút bên trái ảnh. Mobile đặt chữ và nút ở vùng tối phía dưới ảnh. Tên, giá và nút nằm trong HTML.
- **Tương tác và trạng thái.** Dải món chỉ lấy món đã công bố. Khách vuốt hoặc dùng nút mũi tên để xem thêm, bấm ảnh hoặc tên để mở chi tiết, hoặc bấm «+» để thêm món còn bán vào hóa đơn tạm tính dùng chung với thực đơn. Nếu danh sách trống, khách vẫn có thể xem thực đơn hoặc mở đặt bàn từ đầu trang. Ảnh và khối chữ có vùng hiển thị riêng để giữ vị trí các nút khi ảnh đang tải.

### PUB-02 · Thực đơn

- **Bố cục.** H1 và ô tìm món nằm ở đầu trang. Thanh nhóm món bám dưới header khi cuộn và chuyển ngang bằng nút mũi tên hoặc vuốt. «Tất cả» chia thực đơn theo nhóm; chọn một nhóm chỉ hiển thị món thuộc nhóm đó. Lưới rộng tối đa bốn cột và dùng một cột ở 320 px.
- **Tương tác và trạng thái.** Thẻ nêu tên, giá công bố và khả năng đặt. Bấm xem mở PUB-03, hoặc dùng lối đặt bàn nếu chưa có lượt. Skeleton giữ kích thước thẻ. Phân biệt chưa công bố món và nhóm/lọc đang trống. Ảnh lỗi thay bằng bề mặt trung tính. Có «Thử lại» khi dữ liệu không tải được.

### PUB-03 · Chi tiết món

- **Bố cục.** Dialog tối đa 760 px ở desktop. Mobile dùng sheet toàn màn hình khi nội dung dài, tiêu đề/nút đóng ở đầu, nội dung cuộn bên trong. Thứ tự tên → ảnh → giá/tình trạng nếu có → mô tả công bố → hành động phù hợp.
- **Tương tác và trạng thái.** Có ngữ cảnh PUB-05 và món đủ điều kiện thì mở điều chỉnh số lượng tại đó. Trường thiếu được xử lý theo dữ liệu công bố. Món thay đổi khi đang xem thì hiển thị tình trạng mới và hành động khả dụng. Đóng trả focus về thẻ món và giữ vị trí đọc.

### PUB-04 · Đặt bàn

- **Bố cục.** H1 và tiến trình CP-05 → vùng 7 cột cho ngày/số khách, các khung CP-04, dữ liệu liên hệ và rà lại theo từng bước. Vùng 5 cột dành cho tóm tắt, trạng thái và điều kiện tiếp theo. Mobile mỗi bước một cột, tóm tắt ngày/giờ/số khách gọn trên nút tiếp tục. Nếu Q-02 duyệt chọn bàn cho khách, thêm danh sách bàn đủ quyền ở bước chọn sau khả dụng, dùng dữ liệu công bố phù hợp.
- **Tương tác và trạng thái.** Ngày ngoài lịch, số khách ngoài phạm vi và trường liên hệ sai có lỗi theo trường. Khung đang kiểm tra khác khung còn nhận, hết chỗ và dữ liệu cũ. Khi lưu, giữ nút ở trạng thái bận. Mất phản hồi áp dụng F1. Nếu có xác thực khách, dùng bước đã duyệt của Q-07 trong luồng.

### PUB-05 · Chọn món trước

- **Bố cục.** Đầu trang nhắc mã nếu đã có, hoặc thông tin nhóm đang đặt. Desktop 7 cột danh sách thẻ/nhóm và 5 cột bản tóm tắt số lượng/giá có điều kiện. Mobile dùng thẻ dọc, tóm tắt đọc được ngay trước «Lưu món» hoặc một thanh mở bản tóm tắt.
- **Tương tác và trạng thái.** Dòng món có tăng/giảm, giới hạn và lỗi riêng. Hiển thị số món dự thảo và kết quả đã ghi nhận. Lượt chưa đủ điều kiện hoặc quá hạn có thông báo rõ. Cho «Tiếp tục mà chưa chọn món» chỉ khi Q-05 cho phép.

### PUB-06 · Đặt cọc

- **Bố cục.** Đầu trang có mã lượt và trạng thái cọc. Desktop bên trái QR, bên phải thông tin thanh toán và bước tiếp theo. Mobile số tiền và bên nhận trên QR, tham chiếu, hạn và nút sao chép dưới QR. Trạng thái cọc và tóm tắt đặt chỗ hiển thị riêng.
- **Tương tác và trạng thái.** Có tải QR, QR lỗi, chờ thanh toán, chờ xác minh, đã xác minh, quá hạn và cần đối chiếu. Khi QR lỗi, hiển thị hướng thân thiện có căn cứ, giữ dữ liệu đã biết. Chỉ hiển thị nút thử lại/tạo lại được chính sách cho phép. Khi quá hạn nhưng đã chuyển, hướng tới đối chiếu thay vì thúc chuyển lần nữa.

### PUB-07 · Kết quả đặt chỗ

- **Bố cục.** Khối tối đa 760 px gồm tiêu đề theo tình trạng, mã tham chiếu khi có, gói ngày/giờ/số khách, các hàng đặt chỗ/bố trí/cọc và món trong quyền, rồi một CTA cho bước kế tiếp.
- **Tương tác và trạng thái.** Làm rõ «Đã tiếp nhận», «Chờ cọc» và «Đã xác nhận» dựa trên dữ liệu. Khi kiểm kết quả chậm, dùng nhãn đang xác minh và thời điểm cập nhật. Khi phiên không hợp lệ dùng SYS-01. Lối tra cứu ngoài phiên hoặc đổi/hủy theo OPT-02 nếu duyệt.

### PUB-08 · Trợ lý AI

- **Bố cục.** Cửa sổ chat nổi ngay trên nút mở, rộng tối đa 410 px. Trên mobile, cửa sổ co theo chiều rộng và chiều cao khả dụng, chừa vùng an toàn và giữ ô nhập trong tầm thao tác. Nội dung gồm tiêu đề, nút đóng, lịch sử cuộn, hai gợi ý mở đầu và ô nhập có nhãn.
- **Mở và thu gọn.** Nút chat mở hoặc thu gọn cửa sổ. Nút đóng và phím Escape khi đang thao tác trong cửa sổ đưa focus về nút chat. Prototype giữ hội thoại và bước đang thực hiện khi thu gọn. Mở chi tiết món, biểu mẫu web hoặc kết quả đặt bàn sẽ thu gọn chat để hiển thị trang đích.
- **Tương tác và trạng thái.** Có trạng thái gửi, đang xử lý, gửi lỗi, phản hồi thiếu dữ liệu, món được gợi ý, thẻ xác nhận đặt và thẻ kết quả. Giữ thứ tự thông tin theo hội thoại. Nếu quota/lỗi AI, cung cấp đường sang web. Chỉ khôi phục bản nháp/hội thoại theo Q-07/Q-11/Q-15.

### OPS-01 · Đăng nhập và khôi phục phiên

- **Bố cục.** Màn hình gọn, khối rộng tối đa 420 px. Tên nhà hàng, tiêu đề vận hành, một nút đi tới IdP hoặc phương thức được duyệt, vùng phản hồi. Đích quay lại được kiểm theo quyền.
- **Tương tác và trạng thái.** Có đang chuyển hướng, lỗi xác thực, phiên hết hạn và thiếu quyền. Phân biệt phiên hết hạn với tài khoản chưa được cấp quyền. Thông tin khách của luồng đặt không xuất hiện ở đây.

### OPS-02 · Danh sách đặt chỗ

- **Bố cục.** Header → bộ chọn ngày/khung và tra mã theo quyền → bảng. Cột ưu tiên mã, thời điểm dùng bữa, số khách, trạng thái, kênh và bố trí nếu có quyền. Tablet/mobile dùng danh sách nhãn–giá trị; có lối mở OPS-03.
- **Tương tác và trạng thái.** Bộ lọc có nút đặt lại. Skeleton giữ cấu trúc bảng. Trống trong kỳ hiển thị gợi ý đổi khung, còn lỗi cho thử lại. Khi trở về từ chi tiết, giữ bộ lọc hợp lệ. Quyền được kiểm lại khi mở bản ghi.

### OPS-03 · Chi tiết và kết quả phục vụ

- **Bố cục.** Header mã lượt và trạng thái. Desktop 8 cột cho thông tin lượt, món và lịch sử, 4 cột cho bàn/cọc và thao tác được cấp. Mobile ưu tiên mã, giờ, số khách và tác vụ hiện hành trước các khối dài.
- **Tương tác và trạng thái.** Xác nhận nhận khách/hoàn thành/không đến theo Q-06. Trước ghi nhận không đến hiển thị điều kiện và tác động được phép. Cảnh báo phiên hoặc phiên bản cũ; nếu xung đột, tải lại tình trạng hiện hành. Kết quả lưu có trạng thái và dấu vết. Tính năng đổi/hủy ở OPT-03 khi duyệt.

### OPS-04 · Sơ đồ và phân bàn

- **Bố cục.** Điều khiển ngày/khung/khu nếu có và chú giải → từ 1280 px, sơ đồ bên trái, chi tiết bàn/lượt bên phải. Màn nhỏ mặc định danh sách bàn, có chuyển sang sơ đồ. Hai cách xem dùng chung chú giải và hỗ trợ chọn cùng phương án.
- **Tương tác và trạng thái.** Bàn cho thấy mã, sức chứa, còn nhận, đã giữ/đã cam kết hoặc ngừng dùng theo dữ liệu. Tách phương án đang sửa với bố trí hiện hành. Xung đột hoặc thiếu sức chứa hiển thị lý do và bảo toàn bố trí. Nếu thiếu sơ đồ, hiện danh sách nếu dữ liệu đủ; trạng thái thiếu dữ liệu có thông báo riêng.

### OPS-05 · Chuẩn bị bếp

- **Bố cục.** Bộ chọn ngày và khung → nhóm theo giờ → mã lượt, món/số lượng và ghi chú đã cấp quyền. Bản tối giản nằm trong OPS-03 nếu quản lý chuyển cho bếp theo chính sách.
- **Tương tác và trạng thái.** Ít nhãn, ưu tiên «Cần chuẩn bị» và thay đổi sau chốt khi có. Trống nếu khung chưa có món đủ điều kiện, lỗi nếu dữ liệu tải thất bại. Nhận biết thay đổi mới và bản đã chuyển khi Q-05 yêu cầu. Thông tin cọc/liên hệ theo quyền Q-08.

### OPS-06 · Đối chiếu cọc

- **Bố cục.** Danh sách theo tình trạng chờ/sai lệch đã duyệt. Cột mã, số tiền dự kiến/thực nhận và thời điểm. Mở panel chi tiết có giao dịch, nguồn/bằng chứng, tình trạng bàn và quyết định. Trên mobile, panel toàn màn hình.
- **Tương tác và trạng thái.** Ghi kết quả theo đúng quyền, kiểm dữ liệu bắt buộc và xác nhận hệ quả. Thấy trạng thái trùng, sai số tiền/mã, tới trễ, đang kiểm hoặc đã xử lý trong dữ liệu được phép. Nếu kết quả thao tác chưa rõ, kiểm tra lại cùng giao dịch. Bản ghi đã xác minh có audit.

### OPS-07 · Báo cáo

- **Bố cục.** Đầu trang có kỳ và phạm vi chỉ số → tóm tắt các chỉ số đã duyệt → bảng cho kết quả chính xác với đơn vị và thông tin mốc kỳ. Tablet/mobile giữ kỳ hiển thị ngay trước số liệu, dùng danh sách nhóm nếu bảng quá rộng.
- **Tương tác và trạng thái.** Phân biệt kỳ chưa có dữ liệu, số 0 hợp lệ, tỷ lệ chưa tính được vì mẫu số 0 và tải lỗi. Dữ liệu có dấu thời điểm nếu hiển thị bản gần nhất. Biểu đồ hoặc xuất chỉ dùng khi Q-10 thống nhất.

### SYS-01 · Phục hồi và quyền truy cập

- **Bố cục.** Inline khi chỉ một component lỗi. Với mất phiên hoặc trang không thể hiển thị, dùng khối giữa trang, tiêu đề cụ thể, lý do được phép công bố và một nút khôi phục.
- **Tương tác và trạng thái.** Phiên hết dẫn sang xác thực phù hợp, lỗi mạng đọc cho thử lại, giao dịch ghi chưa rõ cho kiểm kết quả. Thiếu quyền giữ giới hạn dữ liệu. Route sai cho quay về trang khả dụng. Thông báo giữ dữ liệu vừa nhập trong phạm vi được duyệt.

### OPT-01 · Quản trị thực đơn

- **Phạm vi.** Dùng màn hình `/van-hanh/thuc-don` hiện có trong MVP theo quyết định ngày 25/11/2026. Mã OPT-01 phục vụ truy vết prototype. [Ánh xạ tích hợp](FRONTEND_BACKEND_MAPPING.md)
- **Bố cục.** Bảng trạng thái công bố và nút mở form tạo/cập nhật theo quyền. Form có nhóm nhận diện, trường công bố và trạng thái, mobile mở thành trang con hoặc sheet.
- **Tương tác và trạng thái.** Xét thiếu trường, thay đổi đồng thời, tải lỗi, lưu thành công và quyền thay dữ liệu. Quy tắc giá và món cũ theo Q-05/Q-09; thông báo nếu thay đổi tác động khả dụng.

### OPT-02 · Tra cứu và yêu cầu thay đổi

- **Bố cục.** Khối xác minh rồi bản tóm tắt lượt. Vùng yêu cầu xuất hiện khi còn điều kiện. CTA dùng «Gửi yêu cầu» và xác nhận tiếp nhận theo chính sách.
- **Tương tác và trạng thái.** Xử lý sai xác minh, quá hạn, dữ liệu không đủ và gửi lặp. Kết quả chỉ nêu đã tiếp nhận yêu cầu cho tới khi có quyết định.

### OPT-03 · Quyết định đổi/hủy

- **Bố cục.** Panel trong OPS-03. Tình trạng hiện hành, giá trị đề xuất, tác động bàn/món/cọc, lý do nếu cần và hành động xác nhận theo quyền.
- **Tương tác và trạng thái.** Với đổi khung, kiểm lại khả dụng. Nếu thất bại, hiện bố trí cũ. Khi cọc chưa xử lý xong, hiện phần chờ và bước phụ trách; trạng thái thành công dựa trên quyết định đã lưu.

### ADV-01 · Đặt tiệc/sự kiện

- **Bố cục.** Đề xuất form một cột trên mobile, desktop 7 cột form và 5 cột tóm tắt. Nhóm ngày/giờ, số khách, nhu cầu và liên hệ theo Q-12. Kết quả cùng trang, hiển thị mã và bước theo dõi được duyệt.
- **Tương tác và trạng thái.** Hiển thị lỗi trường, không đủ khả năng tiếp nhận theo dữ liệu, đang gửi và tình trạng tiếp nhận. Trạng thái cam kết tài nguyên chỉ hiện nếu nghiệp vụ xác nhận.

### ADV-02 · Xử lý yêu cầu tiệc

- **Bố cục.** Danh sách yêu cầu và panel chi tiết với nhu cầu, ngày giờ/số khách, khả năng bố trí và thao tác được cấp. Mobile mở chi tiết riêng theo cùng ngữ cảnh.
- **Tương tác và trạng thái.** Có trống, tải lỗi, chờ xử lý và xung đột với lượt đặt khác khi dùng chung tài nguyên. Ghi quyết định và trạng thái theo Q-12.

### ADV-03 · Đánh giá nhà hàng

- **Bố cục.** Kiểm điều kiện gửi → ô điểm/nội dung theo Q-13 → phản hồi tiếp nhận. Phần đánh giá công bố nếu chính sách có, nằm dưới form hoặc tại điểm vào được duyệt.
- **Tương tác và trạng thái.** Nhãn rõ cho từng mức điểm. Xử lý người thiếu điều kiện, gửi lặp, nội dung không đạt và đang chờ duyệt. Chỉ phản ánh trạng thái hiển thị thực tế.

### ADV-04 · Quản lý đánh giá

- **Bố cục.** Nếu có kiểm duyệt, danh sách theo tình trạng và panel nội dung trong quyền người duyệt. Vùng hành động có hệ quả của từng quyết định.
- **Tương tác và trạng thái.** Có trống, lỗi cập nhật, quyền bị thu hồi, và kết quả đã duyệt. Nhật ký/định danh theo Q-13 và quyền đã chốt.

### ADV-05 · Thao tác API trong chat

- **Bố cục.** Dùng PUB-08, thêm thẻ tên thao tác, dữ liệu đã kiểm và hệ quả trước khi xác nhận ghi. Kết quả API hiển thị ngay dưới thẻ có tham chiếu nếu phát sinh.
- **Tương tác và trạng thái.** Xử lý thiếu quyền, từ chối, timeout, phản hồi không hợp lệ và phục hồi kết quả theo Q-15. Chỉ cung cấp thao tác trong danh sách Q-11 đã duyệt.

## 5. Ma trận trạng thái dùng chung

| Trạng thái UI                                     | Hiển thị và hành động                                                                                                                             | Kiểm tra trước bàn giao                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Tải lần đầu                                       | Skeleton khớp layout dữ liệu. Giữ tiêu đề/điều hướng sẵn sàng nếu an toàn.                                                                        | Không xê dịch vùng giữ ảnh và CTA chính. Phần mềm đọc màn hình nhận biết vùng bận.      |
| Đang gửi/đang ghi                                 | Thông báo tại nút và giữ vị trí. Một thao tác hiệu lực trên mỗi ý định nhận diện được.                                                            | Nhấn lặp, quay lại và gửi lại đều có kết quả rõ theo BR-10.                             |
| Trống                                             | Mô tả theo ngữ cảnh, ví dụ «Khung này chưa có lượt đặt» hoặc «Chưa có món phù hợp».                                                               | Kỳ trống khác số 0 đã tính. Dữ liệu chưa tải và thiếu quyền có trạng thái riêng.        |
| Lỗi đọc hoặc offline                              | Inline alert có «Thử lại» khi thích hợp. Dữ liệu cũ nếu được dùng có mốc cập nhật và hạn chế thao tác cần độ mới.                                 | Lỗi mạng không giả kết quả. Trạng thái có thể phục hồi bằng bàn phím.                   |
| Lỗi validation                                    | Nhãn bền vững, lỗi theo trường và tóm tắt sau submit khi cần. Giữ dữ liệu hợp lệ.                                                                 | Lỗi đọc được, focus tới vị trí cần sửa, địa chỉ lỗi và bước phục hồi rõ.                |
| Xung đột hoặc dữ liệu thay đổi                    | Mô tả khung/món/bàn nào thay đổi, đưa kết quả hiện hành và phương án hợp lệ nếu có.                                                               | Thử hết bàn giữa hai thao tác, món ngừng nhận, đổi bàn xung đột.                        |
| Thành công                                        | Hiển thị đặt chỗ, món, cọc hoặc tác vụ đúng kết quả nguồn. Hiện mã/chi tiết và bước kế tiếp trong quyền.                                          | Bản ghi web, chat, bàn và cọc đối chiếu được. Toast phụ chỉ dùng cho thao tác ngắn.     |
| Chờ xác minh, từng phần hoặc mất phản hồi sau ghi | Dùng trạng thái chờ và nêu dữ liệu đã biết. Tách món đã lưu/phần lỗi, hoặc tiền thực nhận/quyền bàn còn hiệu lực. Kiểm kết quả trước khi ghi lại. | Có ca thử lấy lại ý định, đối chiếu trùng và cọc đến sau khi đã cấp bàn.                |
| Hết thời hạn/thiếu quyền/phiên hết                | Giải thích trong giới hạn được phép. Đưa hành động quay lại hoặc xác minh lại phù hợp.                                                            | Truy cập trực tiếp theo mã không làm lộ dữ liệu. Phương án phù hợp vẫn có thể tiếp tục. |

## 6. Chuẩn trình bày dữ liệu và hợp đồng bàn giao

- **Thông tin đặt.** Tách ngày dùng bữa khỏi thời điểm tạo. Định dạng tiếng Việt và múi giờ nhà hàng theo Q-01. Nhãn giữ bàn, gán bàn và xác nhận lượt độc lập. Nếu chưa phân bàn, dùng nhãn rõ khi được phép hiển thị, còn khách chỉ thấy thông tin bố trí được quyền xem.
- **Tiền và món.** Luôn ghi đơn vị đúng hợp đồng. Khoản cọc có bên nhận và tham chiếu, hiển thị độc lập với giá trị món. Trạng thái cọc đến từ bằng chứng và quy trình đối chiếu. Ghi chú món và thông tin liên hệ chỉ hiển thị ở vai trò được cấp.
- **Điều hướng và quyền.** Route công khai thuộc `apps/web/src/routes/public/`, route vận hành thuộc `routes/ops/`. Các phần có hành vi cùng miền giữ ở `features/`, token/component chung giữ ở `shared/`. Ranh giới API ở kế hoạch T03/T08. UI dùng kết quả đã kiểm quyền và quy tắc nghiệp vụ phía server.
- **Khả năng tiếp cận.** Dùng nhãn form và heading theo thứ tự. Tab, Shift+Tab, Escape và focus return hoạt động đúng vai trò modal. Sơ đồ có chọn bàn tương đương từ danh sách. QR có thông tin dạng chữ. Kiểm zoom và nội dung dài trước nghiệm thu. [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [W3C APG Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## 7. Các điểm cần nhà hàng xác nhận

| Nhóm       | Ảnh hưởng UI và điều kiện chốt                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q-01–Q-02  | Lịch, số khách, thời gian sử dụng, ghép bàn, sơ đồ, khách có được chọn bàn và dữ liệu nào được xem. Chốt PUB-04 và OPS-04.                                         |
| Q-03–Q-04  | Khi giữ/cam kết, có cần cọc không, số tiền/hạn, VietQR, bằng chứng và bước đối chiếu. Chốt PUB-04/06/07 và OPS-06.                                                 |
| Q-05–Q-06  | Thời điểm chọn/khóa món, thay đổi giá, ghi từng phần, mốc bếp, quyền xử lý đến trễ hoặc không đến và chính sách đổi/hủy/cọc. Chốt PUB-05, OPS-03/05/06, OPT-02/03. |
| Q-07–Q-08  | Xác minh khách, kênh kết quả, thời hạn phiên/dữ liệu, phân vai và công việc bếp. Chốt các cửa vào theo quyền và UX xác minh.                                       |
| Q-09–Q-10  | Bộ trường thực đơn, nhóm món, giá, ảnh, tình trạng, nhu cầu lọc/tìm trong thực đơn, chỉ số và cách đọc báo cáo. Chốt PUB-02/03, OPT-01, OPS-07.                    |
| Q-11, Q-15 | Mốc chuyển kênh, kết quả bàn từ chat, dữ liệu gửi AI, tool mức Tốt, cách nhận diện cùng ý định sau lỗi. Chốt PUB-04/07/08 và ADV-05.                               |
| Q-12–Q-13  | Điều kiện tiệc, tài nguyên và đánh giá/kiểm duyệt. Chốt ADV-01 đến ADV-04 nếu chọn mức Tốt.                                                                        |
| Q-14       | Thiết bị/trình duyệt, chất lượng và cách dùng thử. Chốt ma trận thử trên thiết bị, số liệu tải và bằng chứng AC-17/19.                                             |

## 8. Checklist nghiệm thu thiết kế và điều kiện chuyển giai đoạn

### Kịch bản cần chạy trên prototype và bản triển khai

| Kịch bản                       | Thao tác và tín hiệu đạt                                                                                                                                                                 | Đối chiếu                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Đặt ngoài giờ và khung vừa hết | Mở PUB-04 ngoài giờ phục vụ, kiểm một khung hợp lệ. Mô phỏng khung vừa được người khác nhận khi gửi, kiểm lý do và khả năng đổi khung.                                                   | AC-02, AC-03, AC-04        |
| Món thay đổi                   | Ở PUB-05, lưu danh sách có một món vừa ngừng nhận. Đọc phần ghi thành công hoặc phần cần sửa đúng chính sách. Nếu món đã chuyển bếp và thay đổi được phép, thấy điểm khác biệt ở OPS-05. | AC-05, AC-06               |
| VietQR và tiền đến trễ         | Ở PUB-06, đọc hoặc sao chép thông tin khi cùng điện thoại. Hiện chờ cho tới khi xác minh. Kiểm ngoại lệ tiền tới sau khi bàn đã cấp và so trạng thái ở PUB-07, OPS-04, OPS-06.           | AC-07, AC-08, AC-09        |
| Đặt qua chat và mất phản hồi   | Làm rõ câu giờ mơ hồ tại PUB-08, xem thông tin xác nhận, sau đó đối chiếu cùng mã với OPS-03. Mô phỏng mất phản hồi sau ghi và xác minh cách dùng lại cùng ý định.                       | AC-15, AC-16, AC-17, AC-18 |
| Điều phối và đọc báo cáo       | Từ OPS-02 mở OPS-03/04 bằng bàn phím. Chọn bàn từ danh sách. Thử xung đột, giữ bố trí có hiệu lực, sau đó đối chiếu kết quả phục vụ và chỉ số báo cáo.                                   | AC-10 đến AC-14            |
| Luồng trọn vẹn tại đơn vị      | Chạy web, chat, đặt món và cọc bằng dữ liệu được phép. Quản lý thao tác sơ đồ, bếp, đối chiếu và báo cáo trên thiết bị đã chọn.                                                          | AC-19                      |

### Hoàn tất ở mức đặc tả văn bản

- [x] Khảo sát website bằng màn hình thực, ghi các bước đã thử và phần chưa xác minh.
- [x] Có đối chiếu toàn bộ 21 use case, với màn hình tương ứng và phạm vi MVP, tùy chọn hoặc mức Tốt.
- [x] Có sitemap, luồng chính và ngoại lệ, layout desktop/mobile và trạng thái cho tất cả mã màn hình trong danh sách.
- [x] Có design system, cặp màu đã tính tương phản và quy tắc focus, responsive, quyền truy cập.
- [x] Có liên kết đủ các mã AC từ BRS trong danh sách màn hình và ghi rõ 15 nhóm câu hỏi tác động.

### Bằng chứng cần có trước khi chốt T02 hoặc kiểm thử T08/T22/T27

- [ ] Duyệt quyết định áp dụng cho từng luồng với nhà hàng, nhất là mốc giữ bàn/cọc, dữ liệu liên hệ, giao bếp và phạm vi chat.
- [ ] Trên prototype đã duyệt, đi qua đặt web, đặt qua chat, hết chỗ, lỗi gửi lại, cọc đến trễ và đổi bàn xung đột. Đối chiếu người xem, quyền, nội dung và bước tiếp theo.
- [ ] Kiểm viewport 320/390/768/1024/1440, zoom, focus, đọc bằng bàn phím và thiết bị thật theo Q-14. Kiểm dữ liệu tiếng Việt dài, bước QR, lỗi/empty và trạng thái bận.
- [ ] Khi có bản chạy, ghi kết quả smoke/AC và bằng chứng dùng thử. Bảng trạng thái ở mục 5 dùng làm đầu vào cho T08, T22 và T27.
