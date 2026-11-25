# Đặc tả nghiệp vụ — Website đặt bàn và đặt món trước nhà hàng Ba Anh Em

**Phiên bản 0.1 · 19/11/2026 · Bản dự thảo để rà soát nghiệp vụ**

## 1. Căn cứ và cách đọc

Nguồn yêu cầu là [Tên Đề Tài - Yêu Cầu - Chuẩn Đầu Ra.txt](<01-tai-lieu/Tên Đề Tài - Yêu Cầu - Chuẩn Đầu Ra.txt>). Các số dòng bên dưới dùng để đối chiếu với tệp này. Mã NV, M, UC, BR, NFR, AC và Q do bản đặc tả đặt để lần lượt truy vết yêu cầu nguồn, module, use case, quy tắc nghiệp vụ, yêu cầu phi chức năng, tiêu chí nghiệm thu và câu hỏi nghiệp vụ.

- **MVP — Bắt buộc** gồm các năng lực đề bài liệt kê cho MVP và chatbot AI đặt bàn, tư vấn món. Các kiểm soát dẫn xuất phục vụ MVP được đánh dấu riêng trong nội dung.
- **Tốt — Tùy chọn theo mục tiêu đánh giá** gồm đặt tiệc/sự kiện, đánh giá nhà hàng và chatbot thao tác nghiệp vụ qua API. Nếu chọn mục tiêu Tốt, đưa cả ba vào phạm vi nghiệm thu theo đề bài.
- **Tùy chọn — Chờ quyết định** là năng lực đề xuất hỗ trợ vận hành, có thể được duyệt riêng. **Mở rộng** là ý tưởng cho giai đoạn sau.
- **Đề bài** chỉ nội dung được ghi trực tiếp. **Dẫn xuất** chỉ hành vi hoặc kiểm soát cần đặc tả để thực hiện, kiểm thử yêu cầu nguồn. **Cần chốt** chỉ chính sách, trường dữ liệu hoặc cách vận hành còn cần xác nhận. Các bước có điều kiện trong use case áp dụng theo phương án được duyệt.

## 2. Mục tiêu và phạm vi

### 2.1. Mục tiêu

1. Cho phép khách xem thực đơn và gửi yêu cầu đặt bàn trực tuyến 24/7 theo thời điểm dùng bữa và số khách, kể cả ngoài giờ phục vụ. Khung được nhận đặt phụ thuộc lịch phục vụ và khả năng bố trí.
2. Cho phép khách đặt món trước và thực hiện đặt cọc liên quan đến lượt đặt. Nhà hàng có thông tin để chuẩn bị bếp và dùng đặt cọc nhằm giảm tình trạng khách đặt rồi không đến.
3. Cho phép nhà hàng theo dõi đặt chỗ, bố trí bàn theo khung giờ, giảm trùng bàn và theo dõi hoạt động qua báo cáo.
4. Cung cấp kênh chatbot AI để khách đặt bàn và được tư vấn theo thực đơn.

### 2.2. Phạm vi đã nêu trong đề bài

- **NV-01 · Nền tảng Web.** Website có front-end và back-end API. Dòng 4–6.
- **NV-02 · Chatbot AI.** Đặt bàn và tư vấn món qua chat. Dòng 8 và 13.
- **NV-03 · Bối cảnh và mục tiêu vận hành.** Nhà hàng phục vụ tại bàn, nhận đặt 24/7. Khách chọn khung giờ, đặt món và cọc trước. Quản lý bố trí bàn và chuẩn bị bếp. Dòng 9–10.
- **NV-04 · MVP.** Thực đơn, đặt bàn theo khung giờ và số khách, đặt món trước và đặt cọc, sơ đồ bàn, quản lý đặt chỗ, báo cáo. Dòng 11.
- **NV-05 · Mức Tốt.** Đặt tiệc/sự kiện, đánh giá nhà hàng, chatbot thao tác nghiệp vụ qua API bằng tool calling. Dòng 12.
- **NV-06 · Demo hoàn thiện.** Đường dẫn web công khai, đầy đủ MVP và chatbot AI, dùng thử tại đơn vị. Dòng 13.
- **NV-07 · Định hướng tích hợp.** Đề bài chọn dịch vụ LLM dùng API key của Groq free và tích hợp VietQR cho đặt cọc. Khả năng sử dụng, hạn mức và cơ chế xác minh giao dịch của cấu hình thực tế cần được kiểm tra khi triển khai. Dòng 15.
- **NV-08 · Rủi ro trọng tâm.** Khách đặt nhưng không đến và trùng bàn. Dòng 16.
- **NV-09 · Quản lý đồ án và chuẩn đầu ra học phần.** Mốc giữa kỳ và cuối kỳ, GitHub, Jira, MS Project, D01–D27, CLO2 và CLO3. Dòng 1–2, 14 và 17–19. Xem mục 12.

Phạm vi khách hàng là đặt chỗ dùng tại nhà hàng Ba Anh Em. Các nghiệp vụ giao hàng, bán mang đi, POS, quản lý kho và thanh toán toàn bộ hóa đơn nằm ngoài phạm vi xác nhận. Đặt món trước trong tài liệu này gắn với một lượt đặt chỗ.

### 2.3. Danh mục module

1. **M01 · Thực đơn** — UC-01, UC-02.
2. **M02 · Khung giờ và đặt bàn** — UC-03 đến UC-05.
3. **M03 · Đặt món trước và chuẩn bị bếp** — UC-06, UC-07.
4. **M04 · Đặt cọc và xác minh giao dịch** — UC-08 đến UC-10.
5. **M05 · Sơ đồ bàn và bố trí bàn** — UC-11, UC-12.
6. **M06 · Quản lý đặt chỗ** — UC-13 đến UC-15.
7. **M07 · Báo cáo** — UC-16.
8. **M08 · Chatbot AI** — UC-17 đến UC-19.
9. **M09 · Đặt tiệc và sự kiện** — UC-20.
10. **M10 · Đánh giá nhà hàng** — UC-21.

## 3. Đối tượng sử dụng, vai trò và quyền hạn

Các quyền dưới đây là phân công nghiệp vụ dự thảo. Đề bài nêu khách và quản lý. Việc tách nhân sự lễ tân, bếp, người đối chiếu cọc hoặc người quản trị thành các tài khoản riêng thuộc Q-08. Một người có thể kiêm nhiệm theo phân công của nhà hàng.

- **Khách đặt chỗ.** Xem thực đơn, tra cứu khả năng nhận đặt, đặt bàn qua web hoặc chat, đặt món trước và thực hiện đặt cọc cho lượt đặt của mình. Việc truy cập lại, đổi hoặc hủy phụ thuộc cách xác minh và chính sách đã duyệt. Tham chiếu UC-01, UC-03 đến UC-06, UC-08, UC-17, UC-18 và Q-03, Q-07.
- **Quản lý nhà hàng.** Theo dõi lượt đặt, xem sơ đồ bàn, điều phối bố trí bàn, theo dõi món đặt trước để chuẩn bị bếp, xem báo cáo. Quyền xác minh cọc, cập nhật thực đơn hoặc xử lý đổi/hủy có thể giao theo phân công. Tham chiếu UC-07, UC-09 đến UC-16 và Q-08.
- **Nhân sự tiếp nhận và điều phối bàn, nếu phân quyền riêng.** Xem lượt đặt thuộc phạm vi công việc, bố trí bàn và ghi nhận kết quả phục vụ theo quyền được giao. Quyền thay đổi trạng thái cọc cần được cấp riêng. Tham chiếu UC-11 đến UC-15.
- **Nhân sự chuẩn bị món, nếu truy cập trực tiếp.** Xem thông tin chuẩn bị gồm khung phục vụ, món, số lượng và ghi chú món nếu có. Thông tin liên hệ và giao dịch chỉ được tiếp cận nếu cần theo nhiệm vụ đã duyệt. Quản lý có thể chuyển thông tin chuẩn bị cho bếp trong phương án MVP. Tham chiếu UC-07.
- **Người phụ trách đối chiếu cọc.** Kiểm tra bằng chứng giao dịch, cập nhật kết quả đối chiếu và xử lý sai lệch trong quyền được giao. Tham chiếu UC-09, UC-10.
- **Người phụ trách dữ liệu nghiệp vụ, nếu có.** Quản lý dữ liệu thực đơn, bàn, lịch phục vụ theo phạm vi được giao. Xác nhận việc duy trì dữ liệu qua màn hình riêng hoặc qua quy trình vận hành khác. Tham chiếu UC-02 và Q-01, Q-02, Q-08, Q-09.
- **Chatbot AI và hệ thống thanh toán.** Là tác nhân hỗ trợ. Hành động do chatbot khởi tạo tuân theo quyền của khách và cùng quy tắc đặt chỗ. Kết quả thanh toán chỉ được công nhận theo nguồn xác minh đã duyệt. Tham chiếu BR-03, BR-05, BR-08.

## 4. Luồng nghiệp vụ xuyên module

### 4.1. Đặt bàn và đặt món qua web

1. Khách chọn ngày, khung giờ và nhập số khách. Hệ thống kiểm tra lịch và khả năng nhận đặt (UC-03).
2. Khách gửi lượt đặt với thông tin cần thiết. Hệ thống kiểm tra lại khả năng nhận đặt và trả mã tham chiếu cùng trạng thái hiện hành khi ghi nhận thành công (UC-04). Nếu khung vừa hết chỗ, khách nhận thông báo và có thể chọn khung khác còn nhận đặt.
3. Khách đặt trước món cho lượt đặt khi nghiệp vụ cho phép (UC-06). Các món không khả dụng được nêu rõ để khách chọn lại.
4. Khách thực hiện cọc qua VietQR theo chính sách áp dụng. Kết quả được xác minh và gắn với lượt đặt (UC-08 đến UC-10). Bước cọc có thể nằm trước hoặc sau việc chấp nhận lượt đặt, tùy Q-03 và Q-04.
5. Quản lý theo dõi lượt đặt, bố trí bàn và chuyển thông tin món đủ điều kiện cho bếp (UC-07, UC-11 đến UC-14). Điểm chốt giữ bàn và điểm chốt giao thông tin cho bếp cần được nhà hàng quyết định.
6. Kết quả lượt đặt và khoản cọc cung cấp dữ liệu cho báo cáo đã được thống nhất (UC-16).

### 4.2. Đặt bàn qua chatbot

1. Khách nêu nhu cầu đặt bàn bằng chat. Chatbot lấy thông tin còn thiếu, làm rõ diễn đạt như «tối mai» và trình bày lại dữ liệu dùng để đặt (UC-18).
2. Luồng đặt bàn qua chat dùng chung điều kiện nhận đặt với web. Khi có kết quả nghiệp vụ, khách nhận mã và trạng thái thực tế. Khi còn bước xác nhận hoặc cọc, khách được thông báo bước tiếp theo.
3. Ở mức Tốt, chatbot gọi các thao tác nghiệp vụ qua API trong danh sách được duyệt và phản hồi theo kết quả API (UC-19). Phạm vi các bước thực hiện trong cuộc chat ở MVP, điểm chuyển kênh nếu có và các thao tác API ở mức Tốt cần chốt tại Q-11. Kịch bản nghiệm thu MVP phải đi từ ý định đặt bàn trong chat đến kết quả đặt chỗ có thể đối chiếu trong quản lý đặt chỗ.

### 4.3. Điều phối bàn và chuẩn bị phục vụ

1. Quản lý xem lượt đặt và sơ đồ tại khung cần phục vụ.
2. Quản lý chọn bàn hoặc phương án bàn theo sức chứa và quy tắc vận hành. Khi có điều chỉnh, kiểm tra lại hiệu lực của phương án và xung đột trên cùng nguồn dữ liệu (UC-12).
3. Quản lý chuyển món và số lượng hợp lệ cho bếp theo thời điểm chốt. Nếu lượt đặt đổi, hủy hoặc có thay đổi món sau khi bếp đã nhận thông tin, người phụ trách nhận biết được nội dung bị ảnh hưởng, theo quy trình đã duyệt (UC-07).
4. Quản lý ghi nhận khách đến, kết quả phục vụ hoặc trường hợp không đến theo chính sách nhà hàng (UC-14). Cách xử lý bàn, món và cọc sau thay đổi vận hành áp dụng theo quy tắc đã duyệt.

## 5. Đặc tả chức năng và use case

### M01 · Thực đơn

#### UC-01 · Xem thực đơn — MVP, đề bài

- **Tác nhân và tiền điều kiện.** Khách hoặc chatbot đọc thực đơn từ nguồn dữ liệu đã công bố.
- **Đầu vào.** Yêu cầu xem thực đơn hoặc phạm vi món đang quan tâm. Trường hiển thị và cách phân nhóm thuộc Q-09.
- **Xử lý.** Lấy danh sách món được phép hiển thị, thể hiện tình trạng khả dụng theo dữ liệu quản lý. Dùng dữ liệu này khi khách chọn món hoặc chatbot tư vấn.
- **Đầu ra.** Thông tin nhận biết món và khả năng đặt trước. Hiển thị giá và mô tả theo dữ liệu được duyệt.
- **Ngoại lệ và ràng buộc.** Khi món ngừng nhận đặt hoặc dữ liệu thực đơn không truy cập được, nêu đúng tình trạng. Giá, thành phần và thông tin dị ứng chỉ dùng khi có nguồn dữ liệu nhà hàng xác nhận. Tham chiếu BR-06, BR-08 và AC-01.

#### UC-02 · Cập nhật thực đơn qua màn hình quản lý — MVP

- **Tác nhân và tiền điều kiện.** Nhân sự được cấp quyền duy trì thực đơn của nhà hàng. Chủ dự án duyệt dùng màn hình `/van-hanh/thuc-don` hiện có cho MVP ngày 25/11/2026.
- **Đầu vào.** Món cần tạo hoặc sửa và nội dung được phép công bố, bao gồm tình trạng nhận đặt.
- **Xử lý.** Kiểm tra quyền và tính đầy đủ theo bộ trường đã duyệt, sau đó công bố thay đổi hợp lệ.
- **Đầu ra.** Thực đơn cập nhật cho các giao dịch mới và dữ liệu tư vấn.
- **Ngoại lệ và ràng buộc.** Kiểm quyền và dữ liệu ở server. Nếu hai người sửa cùng phiên bản, lần lưu sau nhận xung đột và có thể mở lại dữ liệu. Giữ tên và giá đã ghi của món trong lượt đặt. Cách xử lý dòng món đang sửa sau khi thay giá hoặc ngừng món thuộc Q-05 và Q-09. Tham chiếu AC-20a.

### M02 · Khung giờ và đặt bàn

#### UC-03 · Kiểm tra khung giờ theo số khách — MVP, đề bài

- **Tác nhân và tiền điều kiện.** Khách qua web hoặc chat. Lịch phục vụ và nguyên tắc nhận đặt đã có hiệu lực.
- **Đầu vào.** Ngày dùng bữa, khung giờ mong muốn và số khách.
- **Xử lý.** Kiểm tra tính hợp lệ của ngày, giờ, số khách và khả năng bố trí theo lịch, sức chứa và các cam kết đã ghi nhận.
- **Đầu ra.** Kết quả còn nhận đặt hoặc lý do không thể nhận. Có thể chỉ ra các khung phù hợp mà hệ thống đã kiểm tra.
- **Ngoại lệ và ràng buộc.** Ngày đã qua, ngoài lịch, chạm giới hạn nhận đặt hoặc hết chỗ đều trả kết quả tương ứng. Khả dụng tại thời điểm tra cứu cần được kiểm tra lại trước khi cam kết chỗ. Tham chiếu BR-01 đến BR-03, Q-01 đến Q-03 và AC-02.

#### UC-04 · Ghi nhận lượt đặt bàn — MVP, đề bài

- **Tác nhân và tiền điều kiện.** Khách đã chọn khung và cung cấp dữ liệu theo yêu cầu.
- **Đầu vào.** Khung giờ, số khách, thông tin liên hệ theo Q-07, ghi chú nếu được thu thập và tham chiếu món/cọc nếu luồng được thiết kế thu nhận cùng lượt đặt.
- **Xử lý.** Kiểm tra dữ liệu và khả năng nhận đặt tại thời điểm có hiệu lực. Ghi nhận một lượt đặt và xác định trạng thái theo chính sách giữ bàn, duyệt và cọc.
- **Đầu ra.** Mã lượt đặt, khung giờ, số khách, trạng thái thực tế và bước cần thực hiện tiếp theo, nếu có. Quản lý có thể tìm thấy lượt đặt đã ghi nhận.
- **Ngoại lệ và ràng buộc.** Nếu cùng lúc có yêu cầu cạnh tranh cho chỗ cuối, kết quả tuân thủ sức chứa và tránh hai cam kết xung đột. Khi khách gửi lại do thao tác lặp hoặc mất phản hồi, cần phân biệt gửi lại cùng yêu cầu với ý định tạo lượt đặt khác. Cách nhận diện thuộc Q-15. Tham chiếu BR-02, BR-03, BR-10 và AC-03, AC-04, AC-18.

#### UC-05 · Khách truy cập lại lượt đặt và gửi yêu cầu thay đổi — Tùy chọn

- **Tác nhân và tiền điều kiện.** Khách có lượt đặt và xác minh được quyền truy cập theo phương thức đã duyệt.
- **Đầu vào.** Tham chiếu lượt đặt, thông tin xác minh và nội dung yêu cầu đổi hoặc hủy, nếu có.
- **Xử lý.** Kiểm tra quyền, trả thông tin thuộc lượt đặt và chuyển yêu cầu thay đổi theo chính sách xử lý.
- **Đầu ra.** Thông tin hiện hành của lượt đặt hoặc xác nhận đã tiếp nhận yêu cầu thay đổi. Kết quả đổi/hủy theo UC-15 nếu tính năng được duyệt.
- **Ngoại lệ và ràng buộc.** Sai mã hoặc thiếu quyền được xử lý mà không lộ dữ liệu khách khác. Yêu cầu quá thời hạn hoặc thiếu thông tin được giải thích theo chính sách. Tham chiếu Q-06 đến Q-08 và AC-20b.

### M03 · Đặt món trước và chuẩn bị bếp

#### UC-06 · Đặt món trước theo lượt đặt — MVP, đề bài

- **Tác nhân và tiền điều kiện.** Khách có lượt đặt hoặc đang tạo lượt đặt trong luồng cho phép chọn món. Lượt đó đủ điều kiện nhận món trước.
- **Đầu vào.** Tham chiếu lượt đặt, danh sách món, số lượng và ghi chú món nếu được phép.
- **Xử lý.** Kiểm tra món có thể đặt, số lượng hợp lệ và thời hạn nhận món trước. Ghi nhận các dòng món vào đúng lượt đặt. Nếu hiển thị giá trị món, tính theo quy tắc giá đã chốt và trình bày rõ khoản cọc liên quan, nếu có.
- **Đầu ra.** Danh sách món đã ghi nhận, món và số lượng cần điều chỉnh, cùng giá trị áp dụng nếu nghiệp vụ có tính giá.
- **Ngoại lệ và ràng buộc.** Món hết, số lượng sai, giá thay đổi trong khi khách đang chọn hoặc lượt đã hết thời hạn cần có kết quả rõ ràng. Cách xử lý khi một phần danh sách hợp lệ cần chốt tại Q-05. Tham chiếu BR-06 và AC-05.

#### UC-07 · Chuẩn bị thông tin món cho bếp — MVP, dẫn xuất

- **Tác nhân và tiền điều kiện.** Quản lý hoặc nhân sự bếp được giao nhiệm vụ. Có lượt đặt và danh sách món đủ điều kiện chuẩn bị.
- **Đầu vào.** Ngày/khung phục vụ, dữ liệu lượt đặt, món, số lượng và ghi chú món nếu có.
- **Xử lý.** Lấy các món thuộc lượt đủ điều kiện và trình bày theo khung phục vụ. Khi thay đổi ảnh hưởng đến danh sách đã chuyển, xác định phần chênh lệch để người phụ trách cập nhật kế hoạch chuẩn bị.
- **Đầu ra.** Danh sách món chuẩn bị và thông tin thay đổi cần xử lý. Phương thức chuyển cho bếp theo Q-05 và Q-08.
- **Ngoại lệ và ràng buộc.** Nếu chưa đến thời điểm chốt hoặc lượt đổi/hủy sau khi bếp nhận thông tin, xử lý theo quy trình đã duyệt. Quyền bếp giới hạn vào dữ liệu cần cho công việc. Tham chiếu BR-06, BR-07 và AC-06.

### M04 · Đặt cọc và xác minh giao dịch

#### UC-08 · Cung cấp thông tin đặt cọc VietQR — MVP, đề bài

- **Tác nhân và tiền điều kiện.** Khách có lượt đặt đủ điều kiện đặt cọc. Chính sách tính cọc và thông tin nhận tiền đã được nhà hàng xác nhận.
- **Đầu vào.** Tham chiếu lượt đặt, cơ sở tính khoản cọc đã duyệt và thông tin nhận tiền.
- **Xử lý.** Xác định số tiền phải cọc theo quy tắc áp dụng, cung cấp thông tin thanh toán qua VietQR và tham chiếu để đối chiếu lượt đặt.
- **Đầu ra.** Hướng dẫn thanh toán, số tiền, tham chiếu, thời hạn nếu có và tình trạng chờ xác minh.
- **Ngoại lệ và ràng buộc.** Khi không nhận được thông tin thanh toán hợp lệ hoặc yêu cầu cọc hết hiệu lực, trả tình trạng và bước xử lý theo chính sách. Việc hiển thị QR chỉ thể hiện thông tin thanh toán. Tham chiếu Q-03, Q-04, BR-04, BR-05 và AC-07.

#### UC-09 · Xác minh và ghi nhận khoản cọc — MVP, dẫn xuất

- **Tác nhân và tiền điều kiện.** Nguồn xác minh giao dịch hoặc người có quyền đối chiếu theo phương án đã duyệt.
- **Đầu vào.** Tham chiếu giao dịch, giá trị thực nhận, thời điểm, bằng chứng và tham chiếu khoản cọc/lượt đặt.
- **Xử lý.** Đối chiếu giao dịch và điều kiện xác nhận. Nếu hợp lệ, cập nhật kết quả cọc, cập nhật trạng thái đặt chỗ theo chính sách và lưu dấu vết đối chiếu.
- **Đầu ra.** Trạng thái cọc đã xác minh hoặc cần đối chiếu thêm, trạng thái lượt đặt tương ứng và dấu vết giao dịch.
- **Ngoại lệ và ràng buộc.** Một giao dịch được gửi lại cần tránh ghi nhận hai lần. Giao dịch chưa khớp chuyển UC-10. Xác nhận qua nguồn và hình thức cụ thể thuộc Q-04. Tham chiếu BR-04, BR-05, BR-10 và AC-08.

#### UC-10 · Xử lý sai lệch hoặc hết hạn cọc — MVP, dẫn xuất

- **Tác nhân và tiền điều kiện.** Quản lý hoặc người đối chiếu có quyền. Có khoản cọc quá hạn hoặc giao dịch cần xử lý ngoại lệ.
- **Đầu vào.** Lượt đặt, khoản dự kiến, dữ liệu thực nhận nếu có, loại sai lệch và thông tin tình trạng bàn liên quan.
- **Xử lý.** Xác định nguyên nhân như sai mã, thiếu/thừa tiền, trùng giao dịch, cọc đến sau hạn hoặc đến sau khi bàn đã được cấp. Áp dụng quyết định theo chính sách về cọc và quyền xử lý tình huống. Nếu cân nhắc tái lập giữ bàn, kiểm tra lại khả năng bố trí.
- **Đầu ra.** Kết quả xử lý có căn cứ hoặc tình trạng chờ quyết định, tình trạng khoản cọc và lượt đặt có thể đối chiếu.
- **Ngoại lệ và ràng buộc.** Hành động hoàn, chuyển, bù trừ hoặc giữ cọc phụ thuộc chính sách Q-03, Q-04, Q-06. Tiền đến trễ cần được đối chiếu với tình trạng mới của bàn trước khi công nhận chỗ. Tham chiếu BR-03 đến BR-05 và AC-09.

### M05 · Sơ đồ bàn và bố trí bàn

#### UC-11 · Xem sơ đồ và tình trạng bàn theo khung — MVP, đề bài

- **Tác nhân và tiền điều kiện.** Quản lý hoặc người được giao điều phối. Có dữ liệu bàn và sơ đồ.
- **Đầu vào.** Ngày, khung giờ và khu vực nếu nhà hàng chia khu.
- **Xử lý.** Trình bày các bàn cùng sức chứa, đặc điểm bố trí và tình trạng theo khung được chọn, dựa trên các lượt đặt và điều kiện khai thác bàn.
- **Đầu ra.** Sơ đồ giúp nhận biết phương án bàn khả dụng và bàn đã có cam kết trong thời gian tương ứng.
- **Ngoại lệ và ràng buộc.** Nếu dữ liệu bàn chưa đầy đủ, cần thể hiện tình trạng thiếu dữ liệu để người điều phối xử lý. Việc hiển thị sơ đồ cho khách hoặc cho khách tự chọn bàn thuộc Q-02. Tham chiếu BR-02, BR-03 và AC-10.

#### UC-12 · Phân bàn và điều chỉnh bố trí — MVP, dẫn xuất

- **Tác nhân và tiền điều kiện.** Quản lý hoặc người được giao điều phối. Lượt đặt ở trạng thái cho phép bố trí và có dữ liệu bàn hợp lệ.
- **Đầu vào.** Mã lượt đặt, khoảng sử dụng, số khách, bàn hiện tại nếu có và phương án bàn mới.
- **Xử lý.** Kiểm tra sức chứa, điều kiện ghép bàn nếu được phép và xung đột trên khoảng hiệu lực. Áp dụng thay đổi khi phương án mới hợp lệ, đồng bộ kết quả với sơ đồ và lượt đặt.
- **Đầu ra.** Bố trí bàn đã ghi nhận hoặc lý do từ chối và bố trí còn hiệu lực.
- **Ngoại lệ và ràng buộc.** Khi bàn vừa bị phân cho lượt khác hoặc phương án mới không chứa đủ khách, kết quả cần phản ánh xung đột. Nếu điều chỉnh thất bại, bố trí hiệu lực trước đó được bảo toàn. Tham chiếu BR-02, BR-03, BR-10 và AC-11.

### M06 · Quản lý đặt chỗ

#### UC-13 · Theo dõi danh sách và chi tiết lượt đặt — MVP, đề bài

- **Tác nhân và tiền điều kiện.** Quản lý hoặc nhân sự có quyền theo dõi.
- **Đầu vào.** Ngày hoặc khung giờ cần xem. Có thể dùng mã lượt đặt để đối chiếu khi xử lý một trường hợp.
- **Xử lý.** Tra cứu lượt đặt từ các kênh trong phạm vi và trình bày tình trạng đặt chỗ, bố trí, món và cọc theo quyền.
- **Đầu ra.** Danh sách phục vụ việc tiếp nhận và chi tiết đủ cho người phụ trách xử lý lượt đặt.
- **Ngoại lệ và ràng buộc.** Phân biệt khung không có lượt đặt, lỗi lấy dữ liệu và trường hợp thiếu quyền. Tham chiếu BR-07 và AC-12.

#### UC-14 · Ghi nhận kết quả phục vụ — MVP, dẫn xuất

- **Tác nhân và tiền điều kiện.** Quản lý hoặc nhân sự được phép cập nhật. Lượt đặt ở trạng thái cho phép ghi nhận.
- **Đầu vào.** Lượt đặt, kết quả vận hành như khách đã đến, đã phục vụ xong hoặc không đến, và thời điểm thực tế khi có.
- **Xử lý.** Kiểm tra điều kiện chuyển trạng thái và ghi nhận kết quả. Áp dụng quy tắc sử dụng bàn, chuẩn bị món và xử lý cọc phù hợp với kết quả.
- **Đầu ra.** Trạng thái hiện hành và lịch sử phục vụ phục vụ điều phối và báo cáo.
- **Ngoại lệ và ràng buộc.** Điều kiện kết luận không đến, xử lý khách đến trễ và quyền sửa nhầm cần được chốt tại Q-06, Q-08. Khoản cọc được xử lý theo chính sách đã duyệt. Tham chiếu BR-04, BR-07, BR-09 và AC-13.

#### UC-15 · Xử lý đổi hoặc hủy lượt đặt — Tùy chọn

- **Tác nhân và tiền điều kiện.** Người có quyền xử lý yêu cầu từ khách hoặc nhà hàng, nếu duyệt chức năng. Lượt đặt trong trạng thái cho phép đổi/hủy theo chính sách.
- **Đầu vào.** Lượt đặt, nội dung và lý do thay đổi nếu cần, giá trị mới về khung giờ/số khách khi đổi, và tình trạng món, bàn, cọc.
- **Xử lý.** Kiểm tra chính sách và khả năng bố trí khi đổi. Xử lý phần bị ảnh hưởng của bàn, món và cọc theo quy tắc để phản ánh cùng một kết quả nghiệp vụ.
- **Đầu ra.** Quyết định chấp nhận hoặc từ chối có lý do và tình trạng liên quan sau khi xử lý.
- **Ngoại lệ và ràng buộc.** Khung mới hết chỗ thì lượt hiện hữu giữ nguyên. Khi cọc chưa đối chiếu xong hoặc bếp đã chuẩn bị, chuyển người phụ trách nếu chính sách quy định. Phân biệt việc khách được yêu cầu đổi/hủy và việc nhà hàng thực hiện thay đổi. Tham chiếu Q-05, Q-06, BR-07 và AC-20c.

### M07 · Báo cáo

#### UC-16 · Xem báo cáo hoạt động đặt chỗ — MVP, đề bài

- **Tác nhân và tiền điều kiện.** Quản lý hoặc người có quyền báo cáo. Chỉ số, kỳ báo cáo và cách tính đã được duyệt.
- **Đầu vào.** Kỳ cần xem, chỉ số đã duyệt và bộ lọc được hỗ trợ.
- **Xử lý.** Tổng hợp từ lượt đặt, kết quả phục vụ và khoản cọc tương ứng. Áp dụng định nghĩa ngày phân kỳ, trạng thái được tính và cách chống đếm lặp.
- **Đầu ra.** Số liệu tổng hợp có tên chỉ số, khoảng thời gian, đơn vị và phạm vi dữ liệu đủ để đối chiếu.
- **Ngoại lệ và ràng buộc.** Phân biệt kỳ không có dữ liệu với lỗi tổng hợp. Nếu dùng tỷ lệ, hiển thị phù hợp khi mẫu số bằng 0 theo định nghĩa chỉ số. Cách phân kỳ và các chỉ số thuộc Q-10. Tham chiếu BR-11 và AC-14.

Các chỉ số ứng viên để chốt với nhà hàng gồm số lượt đặt theo ngày dự kiến phục vụ và trạng thái, số khách dự kiến, số lượt không đến, giá trị cọc đã xác minh. Nếu chọn tỷ lệ không đến, cần xác nhận cả tử số, tập lượt đặt hợp lệ làm mẫu số, cách xử lý lượt hủy và cách phân kỳ. Nếu chọn tổng cọc, cần xác nhận phân kỳ theo thời điểm thực nhận hay xác minh và cách hiển thị khoản hoàn, nếu nghiệp vụ có hoàn.

### M08 · Chatbot AI

#### UC-17 · Tư vấn món qua chat — MVP, đề bài

- **Tác nhân và tiền điều kiện.** Khách mở chat. Chatbot truy cập được thực đơn đã công bố cho kịch bản tư vấn.
- **Đầu vào.** Câu hỏi và sở thích hoặc nhu cầu khách cung cấp, ví dụ loại món hoặc số người dùng bữa.
- **Xử lý.** Làm rõ thông tin khi cần, chọn món từ thực đơn và giải thích gợi ý dựa trên dữ liệu có.
- **Đầu ra.** Gợi ý món phù hợp và thông tin liên quan có căn cứ. Khi thiếu dữ liệu, nêu rõ giới hạn và chỉ ra bước kiểm tra tiếp theo nếu có.
- **Ngoại lệ và ràng buộc.** Với giá, tình trạng món, thành phần hoặc dị ứng chưa có dữ liệu xác nhận, chatbot thông báo tình trạng chưa xác thực. Nếu dịch vụ AI gặp lỗi, khách được thông báo và vẫn có thể tiếp tục qua chức năng web tương ứng. Tham chiếu BR-06, BR-08, NFR-02 và AC-15.

#### UC-18 · Đặt bàn qua chat — MVP, đề bài

- **Tác nhân và tiền điều kiện.** Khách truy cập chat. Lịch phục vụ và chính sách nhận đặt có hiệu lực.
- **Đầu vào.** Ý định đặt bàn, ngày/giờ, số khách, dữ liệu liên hệ khi cần và xác nhận nội dung đặt theo luồng đã duyệt.
- **Xử lý.** Hỏi phần còn thiếu hoặc mơ hồ, trình bày lại thông tin, rồi đưa yêu cầu qua luồng đặt chỗ đã duyệt. Khả dụng và kết quả đặt lấy từ nghiệp vụ chung (UC-03, UC-04).
- **Đầu ra.** Kết quả đặt chỗ có thể đối chiếu, gồm mã, trạng thái hiện hành và bước tiếp theo nếu cần hoàn tất. Nếu xử lý chưa thành công, khách nhận tình trạng thực tế.
- **Ngoại lệ và ràng buộc.** Khi khung hết chỗ, dữ liệu còn thiếu hoặc hệ thống trả lỗi, chatbot hỗ trợ chọn lại hoặc tiếp tục theo luồng được duyệt. Khung giờ cụ thể và trạng thái đặt được xác nhận dựa trên kết quả nghiệp vụ. Phạm vi tương tác trong chat ở MVP thuộc Q-11. Tham chiếu BR-03, BR-08, BR-10 và AC-16.

#### UC-19 · Chatbot thao tác nghiệp vụ qua API — Tốt

- **Tác nhân và tiền điều kiện.** Khách và chatbot. Danh sách thao tác được cấp quyền và điều kiện xác nhận đã duyệt.
- **Đầu vào.** Dữ liệu thu được từ hội thoại và xác nhận của khách đối với thao tác ghi, theo Q-11.
- **Xử lý.** Chatbot chọn công cụ nghiệp vụ phù hợp và gọi API. API kiểm tra quyền, dữ liệu và quy tắc của cùng use case nghiệp vụ. Chatbot trả lời theo kết quả được hệ thống ghi nhận.
- **Đầu ra.** Kết quả thực của thao tác được cấp, có tham chiếu đối chiếu khi phát sinh lượt đặt hoặc thay đổi.
- **Ngoại lệ và ràng buộc.** Khi công cụ trả lỗi, mất phản hồi hoặc khách yêu cầu hành động vượt quyền, trạng thái phải phản ánh kết quả có thể xác minh. Kiểm tra kết quả cũ trước khi thử lại thao tác ghi có nguy cơ tạo trùng. Tham chiếu BR-08, BR-10 và AC-21c.

### M09 · Đặt tiệc và sự kiện

#### UC-20 · Tiếp nhận và xử lý yêu cầu đặt tiệc — Tốt

- **Tác nhân và tiền điều kiện.** Khách có nhu cầu đặt tiệc/sự kiện và người phụ trách tiếp nhận. Nhà hàng đã xác định các loại sự kiện đủ điều kiện.
- **Đầu vào.** Dự thảo tối thiểu gồm ngày/giờ dự kiến, số khách, nhu cầu sự kiện và thông tin liên hệ. Bộ trường thuộc Q-12.
- **Xử lý.** Ghi nhận yêu cầu, xem xét khả năng tổ chức theo quy trình đã duyệt và cập nhật kết quả xử lý. Khi có cam kết sử dụng bàn hoặc khu vực, áp dụng quy tắc tránh xung đột với các lượt đặt liên quan.
- **Đầu ra.** Tham chiếu yêu cầu, trạng thái tiếp nhận hoặc quyết định và bước tiếp theo.
- **Ngoại lệ và ràng buộc.** Khi thiếu thông tin, vượt khả năng phục vụ hoặc xung đột lịch, báo tình trạng theo quy trình. Phạm vi báo giá, thực đơn tiệc, bố trí riêng và cọc tiệc cần chốt tại Q-12. Tham chiếu AC-21a.

### M10 · Đánh giá nhà hàng

#### UC-21 · Gửi và hiển thị đánh giá — Tốt

- **Tác nhân và tiền điều kiện.** Người đánh giá đủ điều kiện theo chính sách. Người quản lý nội dung tham gia nếu có duyệt nội dung.
- **Đầu vào.** Nội dung/điểm đánh giá theo định dạng đã duyệt và thông tin xác minh điều kiện gửi nếu áp dụng.
- **Xử lý.** Kiểm tra nội dung, quyền gửi và giới hạn gửi. Ghi nhận đánh giá và áp dụng quy tắc hiển thị hoặc kiểm duyệt.
- **Đầu ra.** Kết quả tiếp nhận và tình trạng hiển thị theo chính sách.
- **Ngoại lệ và ràng buộc.** Gửi trùng, thiếu quyền hoặc không phù hợp quy tắc nội dung được xử lý theo Q-13. Tham chiếu AC-21b.

## 6. Quy tắc nghiệp vụ

Các quy tắc dưới đây diễn giải hành vi cần có để vận hành các yêu cầu nguồn. Nhà hàng cần xác nhận thông số và quyết định chính sách tương ứng.

1. **BR-01 · Tách giờ tiếp nhận và giờ phục vụ.** Website nhận yêu cầu 24/7. Ngày và giờ dùng bữa được kiểm tra theo lịch, ngày nghỉ và giới hạn nhận đặt đã công bố. Số khách là số nguyên dương và phải nằm trong phạm vi được nhận đặt. Tham chiếu NV-03, Q-01.
2. **BR-02 · Tính khả dụng theo thời gian và sức chứa.** Khả dụng phụ thuộc khung giờ, khoảng sử dụng, sức chứa và các lượt đang giữ hoặc đã cam kết chỗ theo chính sách. Ghép bàn và khoảng đệm chỉ tham gia tính toán khi đã được duyệt. Tham chiếu NV-04, NV-08, Q-01 đến Q-03.
3. **BR-03 · Ngăn trùng bàn trên khoảng xung đột.** Tại thời điểm ghi nhận cam kết hoặc sửa bố trí, kiểm tra lại dữ liệu có hiệu lực. Một bàn không được cam kết cho hai lượt đặt có khoảng sử dụng xung đột. Nếu lưu lượt đặt trước khi chọn bàn cụ thể, chính sách nhận đặt phải kiểm soát khả năng bố trí thực tế, kể cả khi số chỗ cộng gộp đủ nhưng cấu hình bàn không phù hợp. Áp dụng giữa các kênh web, chat và thao tác quản lý. Tham chiếu NV-08, Q-02, Q-03, Q-15.
4. **BR-04 · Cọc và đặt chỗ có tình trạng riêng.** Quy tắc đã duyệt quyết định khi nào cần cọc, mức cọc, thời hạn, điều kiện giữ/xác nhận bàn và hệ quả khi đổi, hủy hoặc không đến. Khi trạng thái cọc thay đổi, chỉ chuyển trạng thái đặt chỗ nếu điều kiện nhận đặt tương ứng vẫn thỏa. Tham chiếu NV-03, NV-07, Q-03, Q-04, Q-06.
5. **BR-05 · Xác minh cọc dựa trên bằng chứng.** Chỉ ghi nhận đã xác minh sau khi có dữ liệu hợp lệ từ nguồn được duyệt. QR, ảnh chứng từ do khách cung cấp hoặc lời báo đã chuyển được xử lý theo quy trình đối chiếu. Giữ khả năng truy ngược từ khoản cọc đến lượt đặt và bằng chứng giao dịch. Tham chiếu NV-07, Q-04.
6. **BR-06 · Kiểm tra món vào thời điểm ghi nhận.** Chỉ ghi nhận số lượng hợp lệ và món thỏa tình trạng nhận đặt trước. Quy tắc món hết, thời điểm khóa danh sách, thay đổi món và giá cuối cùng cần được duyệt trước khi dùng để xác nhận kết quả. Tham chiếu NV-04, Q-05, Q-09.
7. **BR-07 · Thay đổi theo quyền và trạng thái.** Thao tác quản lý phải kiểm tra quyền và trạng thái nguồn. Sau thao tác, dữ liệu bàn, món, cọc phản ánh cùng kết quả hoặc thể hiện rõ phần đang chờ xử lý. Những thay đổi quan trọng cần có thời điểm, người/nguồn thực hiện và kết quả để đối chiếu. Tham chiếu NV-03, NV-04, Q-06, Q-08.
8. **BR-08 · Chatbot sử dụng dữ liệu có căn cứ.** Chatbot làm rõ dữ liệu mơ hồ, dựa vào thực đơn và nghiệp vụ đặt chỗ đã công bố, chỉ công bố trạng thái lượt đặt và cọc khi đã được xác minh. Mọi thao tác ghi tuân theo quyền và quy tắc đặt chỗ chung. Tham chiếu NV-02, NV-05, Q-11.
9. **BR-09 · Xác định khách không đến theo điều kiện đã duyệt.** Cần thống nhất mốc ghi nhận, cách xử lý khách đến trễ, người quyết định và quyền sửa trạng thái. Ghi nhận không đến là dữ liệu đầu vào cho quyết định xử lý cọc theo chính sách. Tham chiếu NV-03, NV-08, Q-06.
10. **BR-10 · Gửi lại giữ nguyên hiệu lực một giao dịch.** Yêu cầu lặp xác định được là cùng lần đặt, hoặc dữ liệu đối chiếu được gửi lại cho cùng giao dịch, chỉ tạo một kết quả nghiệp vụ hiệu lực. Mất phản hồi sau khi đã ghi nhận cần có cách tìm lại kết quả. Cách nhận diện trường hợp lặp và lượt đặt độc lập thuộc Q-15.
11. **BR-11 · Báo cáo có quy tắc đếm nhất quán.** Mỗi chỉ số dùng nguồn, mốc thời gian và trạng thái đã duyệt. Dữ liệu từ nhiều kênh hoặc nhiều bản ghi cập nhật cùng tham chiếu được tổng hợp theo đơn vị nghiệp vụ đã chọn. Tham chiếu NV-04, Q-10.

## 7. Trạng thái và điều kiện chuyển

Đây là mô hình khái niệm để thống nhất nghiệp vụ. Tên trạng thái, thời điểm, quyền chuyển và quy tắc chuyển tự động cần chốt tại Q-03, Q-04, Q-06, Q-08.

- **Lượt đặt.** Từ yêu cầu hợp lệ, lượt đặt có thể chờ cọc/chờ nhà hàng duyệt hoặc được xác nhận theo quy trình đã chọn. Sau xác nhận, có thể ghi nhận khách đã đến và kết quả phục vụ, hoặc không đến khi đủ điều kiện. Hết hạn và hủy là các kết quả riêng nếu chính sách tương ứng được duyệt.
- **Quyền sử dụng bàn.** Phân biệt khả dụng, đã giữ tạm nếu có chính sách giữ tạm, đã cam kết và ngừng sử dụng. Tình trạng có hiệu lực theo khoảng thời gian. Việc giải phóng sau hết hạn/hủy hoặc đổi bàn phụ thuộc trạng thái đặt và chính sách hiện hành.
- **Cọc.** Có thể gồm không phát sinh cọc theo chính sách, chờ thanh toán/xác minh, đã xác minh, cần đối chiếu hoặc hết hạn. Nếu chính sách có hoàn, chuyển hoặc giữ cọc, phân biệt các kết quả xử lý tương ứng và liên kết chúng với giao dịch gốc.
- **Món đặt trước.** Ghi nhận danh sách món hiện hành của lượt đặt. Nếu quy trình phân biệt đã chuyển bếp hay đã thay đổi sau khi chuyển, cần có dữ liệu để người phụ trách nhận ra khác biệt.

Một lượt đặt có thể đã ghi nhận nhưng vẫn chờ xử lý cọc hoặc chưa được gán bàn cụ thể. Khi thông báo kết quả, cần trình bày rõ ba tình trạng độc lập gồm đặt chỗ, bố trí và cọc, trong phạm vi dữ liệu người xem được phép truy cập.

## 8. Dữ liệu nghiệp vụ

Các nhóm trường dưới đây là mô tả nghiệp vụ. Trường phụ thuộc chính sách, danh mục giá trị và tính bắt buộc cần được xác nhận cùng các câu hỏi liên quan.

- **Lượt đặt chỗ.** Mã tham chiếu, kênh tiếp nhận, thời điểm tạo, ngày/khung dùng bữa, số khách, tình trạng đặt, ghi chú nếu được duyệt. Liên kết với thông tin liên hệ, món, bố trí bàn và khoản cọc nếu phát sinh. Dùng để đối chiếu cùng một lượt qua web, chat và quản lý.
- **Thông tin liên hệ.** Dữ liệu đủ để nhà hàng nhận biết hoặc liên hệ người đặt theo Q-07. Phương thức xác minh, việc dùng tài khoản và thời hạn lưu theo chính sách. Một lần đặt cần liên kết được với người liên hệ tương ứng trong phạm vi được phép.
- **Lịch và khung phục vụ.** Ngày/giờ hoạt động, khung được đặt, khoảng sử dụng để tính chồng lấn và ngoại lệ lịch nghỉ. Lịch kiểm soát cả tra cứu khả dụng lẫn ghi nhận đặt. Tham chiếu Q-01.
- **Bàn và bố trí.** Mã bàn, vị trí sơ đồ, sức chứa, khu vực nếu có, tình trạng khai thác. Bố trí liên kết bàn với lượt đặt theo khoảng sử dụng hiệu lực. Số bàn cho một lượt và quy tắc ghép thuộc Q-02.
- **Món trên thực đơn.** Mã món, tên, tình trạng nhận đặt, giá, phân nhóm, mô tả và thông tin thành phần nếu nhà hàng quản lý. Nguồn công bố và bộ trường thuộc Q-09.
- **Món đặt trước.** Mã tham chiếu lượt đặt và món, số lượng, ghi chú và thông tin giá được áp dụng nếu có. Mỗi lượt có thể phát sinh nhiều dòng món. Giữ đủ thông tin đối chiếu khi thực đơn thay đổi.
- **Yêu cầu cọc và giao dịch đối chiếu.** Tham chiếu lượt đặt/yêu cầu cọc, số tiền dự kiến, số thực nhận, tham chiếu giao dịch, thời điểm, trạng thái, nguồn xác minh và lý do sai lệch nếu có. Số giao dịch có thể liên kết với một khoản cọc phụ thuộc chính sách xử lý thiếu, thừa hoặc nhiều lần chuyển.
- **Lịch sử nghiệp vụ.** Lượt hoặc giao dịch liên quan, thời điểm, nguồn/người thực hiện và kết quả thay đổi quan trọng. Dùng để phân biệt sai lệch, thao tác lặp và tình huống cần can thiệp.
- **Dữ liệu chatbot.** Thông tin cần hiển thị hoặc dùng để chuyển yêu cầu đặt chỗ, tham chiếu kết quả nghiệp vụ và dữ liệu tư vấn công bố. Phạm vi lưu hội thoại và dữ liệu được phép gửi sang LLM thuộc Q-07, Q-11.
- **Yêu cầu tiệc, đánh giá.** Áp dụng khi chọn mức Tốt. Yêu cầu tiệc có tham chiếu, nhu cầu, thông tin liên hệ và kết quả xử lý theo Q-12. Đánh giá có nội dung, điểm nếu dùng, tình trạng hiển thị và tham chiếu lượt đặt nếu cần theo Q-13.

## 9. Yêu cầu phi chức năng

NFR-01 xuất phát trực tiếp từ mục tiêu tiếp nhận 24/7 và điều kiện demo. Các yêu cầu còn lại là kiểm soát dẫn xuất hoặc đề xuất để thỏa mục tiêu nghiệp vụ. Chỉ tiêu định lượng và phạm vi kiểm thử cần chốt tại Q-14.

1. **NFR-01 · Khả dụng của kênh tiếp nhận.** Website demo truy cập được qua đường dẫn công khai. Luồng đặt có thể tiếp nhận ngoài giờ phục vụ theo lịch được công bố. Kiểm tra bằng kịch bản đặt ngoài giờ cho một khung phục vụ hợp lệ. Cần chốt mục tiêu thời gian hoạt động nếu nhà hàng yêu cầu cam kết định lượng. Tham chiếu AC-02, AC-19.
2. **NFR-02 · Khả năng tiếp tục khi tích hợp lỗi.** Khi LLM gặp lỗi hoặc hết hạn mức, khách nhận được thông báo rõ và có thể dùng luồng đặt bàn trên web. Khi thanh toán hoặc đối chiếu gián đoạn, hiển thị tình trạng đang chờ hoặc yêu cầu kiểm tra theo quy trình. Kiểm tra bằng tình huống thử lỗi có kiểm soát. Tham chiếu AC-17.
3. **NFR-03 · Toàn vẹn và nhất quán.** Cùng lượt đặt, bảng bố trí bàn và trạng thái cọc cho kết quả đối chiếu được giữa web, chat và quản lý. Xử lý cạnh tranh chỗ cuối, gửi lại sau lỗi và ghi nhận thanh toán lặp mà không sinh cam kết hoặc khoản cọc trùng. Tham chiếu AC-04, AC-08, AC-11, AC-18.
4. **NFR-04 · Phân quyền và bảo vệ dữ liệu.** Bảo vệ liên hệ khách, dữ liệu giao dịch và thông tin xác thực tích hợp. Giới hạn truy cập, hiển thị và chia sẻ dữ liệu theo vai trò, mục đích sử dụng và chính sách được duyệt. Kiểm tra bằng thử thao tác với quyền không phù hợp, tra cứu lượt của khách khác và kiểm tra dữ liệu công khai. Tham chiếu AC-12, AC-17.
5. **NFR-05 · Truy vết nghiệp vụ.** Người có quyền đối chiếu được thao tác đã ảnh hưởng đến tình trạng bàn, cọc và lượt đặt dựa trên mã tham chiếu, thời điểm và nguồn thực hiện. Kiểm tra bằng một lượt đặt qua nhiều bước có thay đổi trạng thái. Tham chiếu AC-08, AC-11, AC-13.
6. **NFR-06 · Dễ sử dụng.** Khách nhận biết thông tin bắt buộc, trạng thái và bước tiếp theo trong luồng đặt bàn, đặt món, cọc và chat. Cảnh báo nhập sai hoặc kết quả thất bại chỉ rõ phần cần sửa khi có thể. Đo bằng kịch bản dùng thử tại đơn vị và bộ thiết bị/trình duyệt được thống nhất. Tham chiếu AC-19.
7. **NFR-07 · Hiệu năng.** Kiểm tra thời gian phản hồi cho xem menu, tra cứu khung, nộp đặt chỗ và chat với tải đã duyệt. Mục tiêu định lượng, cách đo từng chức năng và tải dự kiến thuộc Q-14. Tham chiếu AC-17.
8. **NFR-08 · Khôi phục nghiệp vụ.** Sau gián đoạn, người phụ trách cần truy lại được kết quả đã ghi nhận và xác định các giao dịch còn chờ, nhất là khi đã có tiền thực nhận. Cách sao lưu, mục tiêu khôi phục và thời hạn lưu dữ liệu thuộc Q-14. Tham chiếu AC-17, AC-18.

## 10. Tiêu chí nghiệm thu

Các tình huống dưới đây quy định kết quả cần quan sát trong bản demo hoặc bộ kiểm thử nghiệp vụ. Dữ liệu theo lịch, mức cọc, thời hạn, quyền và định nghĩa báo cáo lấy từ chính sách đã duyệt. Tiêu chí có điều kiện được áp dụng khi lựa chọn tương ứng đã được chốt.

### 10.1. MVP và kiểm soát vận hành

- **AC-01 · Thực đơn (UC-01).** Với thực đơn mẫu có món nhận đặt và món ngừng nhận đặt, khách xem được nội dung đã công bố và nhận biết món nào có thể đặt trước. Kết quả khớp nguồn dữ liệu.
- **AC-02 · Khả dụng theo giờ và số khách (UC-03).** Với lịch và dữ liệu bàn có khung còn chỗ, khung hết chỗ và khung ngoài lịch, khách nhận kết quả đúng cho từng trường hợp. Khi thử ngoài giờ phục vụ, website vẫn tiếp nhận thao tác đặt cho khung phục vụ hợp lệ.
- **AC-03 · Đặt bàn hợp lệ (UC-04).** Khi gửi đủ thông tin cho khung còn nhận đặt, khách nhận mã và trạng thái đúng chính sách, quản lý thấy cùng mã với cùng ngày/giờ và số khách. Với thông tin thiếu hoặc không hợp lệ, khách nhận chỉ dẫn để sửa.
- **AC-04 · Tranh chỗ cuối (UC-04, UC-12, UC-18).** Gửi gần đồng thời hai yêu cầu cạnh tranh cho bàn cuối từ cùng kênh hoặc từ web và chat, rồi đưa cả hai đến bước quyết định cam kết theo chính sách. Kết quả cuối chỉ có một cam kết cho bàn trong khoảng bị trùng. Yêu cầu còn lại biết tình trạng thực tế hoặc được đề xuất khung hợp lệ khác. Thử cả trường hợp khung có giờ bắt đầu khác nhau nhưng khoảng sử dụng chồng lấn.
- **AC-05 · Đặt món trước (UC-06).** Khi lưu món và số lượng hợp lệ, danh sách được gắn đúng lượt đặt. Khi món hết hoặc số lượng sai, khách nhận kết quả đúng theo chính sách xử lý từng dòng hoặc cả danh sách. Các món thực sự ghi nhận có thể đối chiếu tại quản lý.
- **AC-06 · Chuẩn bị bếp (UC-07).** Với lượt đủ điều kiện, người phụ trách xem được khung, món, số lượng và ghi chú đã thu thập. Khi một thay đổi được phép ảnh hưởng tới dữ liệu bếp đã nhận, người phụ trách xác định được nội dung cần điều chỉnh.
- **AC-07 · Thông tin VietQR (UC-08).** Khi phát sinh khoản cọc theo chính sách, thông tin thanh toán hiển thị đúng người nhận, số tiền và tham chiếu dùng đối chiếu. Sau khi hiển thị QR, trạng thái thể hiện đang chờ nếu chưa có xác minh.
- **AC-08 · Xác minh cọc (UC-09).** Khi nhận giao dịch đúng qua nguồn đã duyệt, quản lý đối chiếu được giao dịch với lượt đặt, thấy đúng trạng thái cọc và trạng thái đặt. Gửi lại dữ liệu của cùng giao dịch vẫn chỉ có một kết quả cọc hiệu lực.
- **AC-09 · Ngoại lệ cọc (UC-10).** Với tình huống tiền sai, không khớp tham chiếu hoặc đến sau hạn, hệ thống thể hiện tình trạng và bước xử lý đúng chính sách. Nếu bàn đã cấp cho lượt khác, xử lý tiền đến trễ vẫn duy trì bố trí có hiệu lực và ghi nhận căn cứ xử lý khoản cọc.
- **AC-10 · Sơ đồ bàn (UC-11).** Cùng một bàn có thể có tình trạng khác nhau tại hai khung. Khi chuyển khung trên sơ đồ, người điều phối thấy tình trạng khớp với các lượt liên quan và nhận biết bàn, sức chứa.
- **AC-11 · Bố trí bàn (UC-12).** Bố trí đủ sức chứa vào bàn hợp lệ cập nhật cả sơ đồ và lượt đặt. Thử phương án trùng khoảng sử dụng hoặc thiếu sức chứa và kiểm tra bố trí trước đó vẫn có hiệu lực sau lần điều chỉnh thất bại.
- **AC-12 · Quản lý và quyền truy cập (UC-13).** Người có quyền xem được lượt từ web và chat cùng chi tiết trong phạm vi công việc. Người thiếu quyền nhận kết quả từ chối phù hợp khi truy cập danh sách hoặc chi tiết, kể cả khi đã biết mã tham chiếu.
- **AC-13 · Kết quả phục vụ (UC-14).** Người có quyền ghi nhận khách đến và kết quả của các lượt mẫu. Với trường hợp không đến, kết quả chỉ được ghi nhận khi đủ điều kiện đã duyệt và có dấu vết để đối chiếu. Trạng thái cọc thể hiện đúng quyết định theo chính sách.
- **AC-14 · Báo cáo (UC-16).** Với tập đặt chỗ và giao dịch mẫu đã tính tay, đối chiếu các chỉ số đã duyệt theo đúng kỳ và trạng thái. Thử kỳ trống và mẫu số bằng 0 nếu có chỉ số tỷ lệ.
- **AC-15 · Tư vấn món bằng AI (UC-17).** Với câu hỏi có dữ liệu thực đơn, chatbot đưa gợi ý có căn cứ. Với câu hỏi về thành phần, giá hoặc dị ứng chưa xác nhận, phản hồi nêu phần chưa có dữ liệu.
- **AC-16 · Đặt bàn bằng AI (UC-18).** Kịch bản khách bắt đầu bằng ý định đặt bàn trong chat, bổ sung thông tin còn thiếu rồi hoàn thành các bước theo phạm vi MVP đã duyệt. Đối chiếu mã, khung giờ, số khách, trạng thái trên kết quả khách nhận với quản lý. Với khung vừa hết hoặc lỗi ghi nhận, phản hồi thể hiện tình trạng thực tế.
- **AC-17 · Vận hành khi lỗi, bảo vệ dữ liệu và chất lượng (NFR-02, NFR-04, NFR-07, NFR-08).** Thử gián đoạn chatbot hoặc thanh toán và kiểm tra thông báo, kênh tiếp tục, trạng thái giao dịch và khả năng đối chiếu sau khôi phục. Kiểm tra dữ liệu riêng tư và thông tin xác thực tích hợp theo phạm vi đã duyệt. Đo hiệu năng và khôi phục theo ngưỡng đã chốt tại Q-14.
- **AC-18 · Gửi lại sau mất phản hồi (UC-04, UC-09, UC-18, BR-10).** Với thao tác đặt đã ghi nhận nhưng phản hồi bị mất, lần gửi lại được nhận diện là cùng yêu cầu và trả kết quả xác minh được. Hai ý định độc lập được xét theo chính sách nhận đặt và còn chỗ. Thử thêm giao dịch cọc đã ghi nhận bị gửi lại.
- **AC-19 · Demo và dùng thử tại đơn vị (NV-06).** Mở được đường dẫn công khai. Khách thử thực đơn, đặt bàn, đặt món, cọc và chatbot. Nhân sự đúng quyền thử cập nhật thực đơn. Quản lý thử sơ đồ, xử lý đặt chỗ, xem thông tin chuẩn bị bếp và báo cáo. Lưu kết quả dùng thử tại đơn vị và bằng chứng cho các bước chính với dữ liệu được phép sử dụng.

- **AC-20a · Quản lý thực đơn (UC-02).** Người đúng quyền tạo, sửa, công bố, ẩn và đổi khả năng nhận đặt trên trang quản lý. Khách và chatbot đọc đúng danh mục mới. Giá và tên món của lượt đã lưu vẫn đối chiếu được. Thử thiếu quyền, lưu từ hai phiên bản giống nhau và gửi lại sau mất phản hồi.

### 10.2. Tùy chọn và mức Tốt

- **AC-20b · Khách tra cứu và yêu cầu thay đổi (UC-05).** Nếu được duyệt, khách xác minh quyền và truy cập đúng lượt, gửi được một yêu cầu còn hạn và nhận tình trạng tiếp nhận.
- **AC-20c · Đổi/hủy từ quản lý (UC-15).** Nếu được duyệt, một yêu cầu hợp lệ cập nhật tình trạng bàn, món và cọc theo chính sách. Kịch bản khung mới hết chỗ giữ nguyên bố trí hiện hữu.
- **AC-21a · Tiệc/sự kiện (UC-20).** Gửi một yêu cầu với dữ liệu hợp lệ, quản lý xem được và xử lý theo quy trình đã duyệt. Thử tình huống xung đột với lượt có cam kết nếu chức năng có bố trí tài nguyên dùng chung.
- **AC-21b · Đánh giá (UC-21).** Người đủ điều kiện gửi được đánh giá, kết quả hiển thị đúng chính sách. Thử một tình huống gửi trùng hoặc sai quyền theo chính sách đã duyệt.
- **AC-21c · Chatbot gọi API nghiệp vụ (UC-19).** Chạy một kịch bản thao tác được duyệt và đối chiếu lượt gọi công cụ, phản hồi nghiệp vụ, lời trả lời của chatbot và kết quả thực tế. Thử tình huống công cụ từ chối hoặc trả lỗi để kiểm tra trạng thái trả cho khách.

## 11. Các điểm cần xác nhận

Ưu tiên chốt Q-01 đến Q-08, Q-10, Q-11, Q-14 và Q-15 cho luồng MVP và nghiệm thu. Q-09 cần có câu trả lời trước khi chuẩn bị thực đơn dùng thử. Q-12 và Q-13 áp dụng khi chọn mục tiêu mức Tốt.

1. **Q-01 · Lịch, khung và giới hạn nhận đặt.** Giờ mở cửa, ngày nghỉ, lịch ngoại lệ, múi giờ, độ dài khung chọn và khoảng sử dụng thực tế là gì? Đặt trước tối thiểu/tối đa bao lâu, nhận bao nhiêu khách mỗi lượt, xử lý giờ liền kề và khoảng đệm thế nào? Ảnh hưởng UC-03, UC-04, UC-11 và BR-01 đến BR-03.
2. **Q-02 · Sức chứa và phân bàn.** Nhà hàng có những bàn, sơ đồ, khu và sức chứa nào? Có ghép bàn, khóa bàn, khách tự chọn bàn hay quản lý bố trí? Bàn được gán tại lúc đặt, lúc xác nhận hay khi điều phối? Nếu chưa gán bàn, nhà hàng cam kết chỗ dựa trên quy tắc khả năng bố trí nào? Ảnh hưởng UC-03, UC-04, UC-11, UC-12.
3. **Q-03 · Giữ bàn, xác nhận và chính sách đặt cọc.** Trường hợp nào bắt buộc cọc? Mức cọc được tính thế nào và khách có bao lâu để chuyển tiền? Có giữ tạm trước cọc, giữ bao lâu và khi nào giải phóng bàn? Lượt đặt được cam kết ngay, sau đối chiếu cọc hay sau quản lý duyệt? Ảnh hưởng UC-04, UC-08 đến UC-12 và mục 7.
4. **Q-04 · VietQR và đối chiếu.** Cấu hình VietQR và tài khoản nhận nào được dùng? Chứng cứ xác minh nào đủ, ai đối chiếu và trong thời gian nào? Có nguồn kết quả tự động khả dụng hay dùng đối chiếu thủ công? Quy tắc khớp giao dịch, nhiều lần chuyển, sai mã, thiếu/thừa và tiền đến trễ là gì? Ảnh hưởng UC-08 đến UC-10 và AC-07 đến AC-09.
5. **Q-05 · Món đặt trước và chuẩn bị bếp.** Có bắt buộc chọn món trong một số trường hợp? Chọn món trước hay sau xác nhận/cọc? Có giới hạn số lượng, thời điểm khóa, quy tắc thay giá, hết món, sửa món và ghi nhận một phần danh sách? Mốc nào chuyển bếp, qua kênh nào và ai xử lý thay đổi sau mốc? Ảnh hưởng UC-06, UC-07, UC-15.
6. **Q-06 · Đổi/hủy, đến trễ và không đến.** Trường hợp nào được đổi/hủy, ai yêu cầu và ai quyết định? Mốc ghi nhận không đến, quyền sửa trạng thái và xử lý lại bàn/món là gì? Hoàn, bù trừ, chuyển hoặc giữ cọc trong trường hợp nào và ai phê duyệt? Ảnh hưởng UC-05, UC-10, UC-14, UC-15, BR-09.
7. **Q-07 · Nhận diện, thông báo và dữ liệu khách.** Khách đặt nhanh hay cần tài khoản? Dùng trường liên hệ và cơ chế xác minh nào? Kết quả được hiển thị trong phiên, tra cứu lại hay gửi qua kênh thông báo nào? Dữ liệu liên hệ hoặc hội thoại nào cần lưu và trong thời hạn nào? Ảnh hưởng UC-04, UC-05, UC-18 và NFR-04.
8. **Q-08 · Phân công và quyền vận hành.** Ai quản lý thực đơn, lịch, bàn, đặt chỗ, bếp, giao dịch cọc và báo cáo? Vai trò nào cần tài khoản riêng, được xem dữ liệu nào, được sửa trạng thái nào và có cần phê duyệt hoặc đối chiếu chéo? Ảnh hưởng mục 3, M03 đến M07 và AC-12.
9. **Q-09 · Bộ dữ liệu thực đơn.** Nhà hàng cung cấp bộ dữ liệu ban đầu nào, gồm giá, mô tả, ảnh, nhóm món, thành phần và thông tin dị ứng nếu có? Món hết được ẩn hay hiển thị trạng thái? Màn hình quản lý đã được duyệt cho MVP. Cần chốt nguồn nhập và chính sách công bố. Ảnh hưởng UC-01, UC-02, UC-06, UC-17.
10. **Q-10 · Chỉ số báo cáo.** Quản lý cần chỉ số, kỳ, bộ lọc và mức chi tiết nào? Từng chỉ số tính theo mốc thời gian, đơn vị và trạng thái nào? Có cần xem chi tiết theo lượt hoặc xuất báo cáo? Ảnh hưởng UC-16 và AC-14.
11. **Q-11 · Ranh giới thao tác chatbot.** Trong MVP, các bước nào hoàn thành trong chat, cách xác nhận và trả kết quả ra sao, điểm chuyển kênh nào được chấp nhận nếu có? Ở mức Tốt, cấp công cụ nào, điều kiện xác nhận trước thao tác ghi và phạm vi dữ liệu chia sẻ với LLM là gì? Có dùng chatbot để đặt món, cọc, đổi hoặc hủy hay chỉ đặt bàn và tư vấn? Ảnh hưởng UC-17 đến UC-19 và AC-15, AC-16, AC-21c.
12. **Q-12 · Mức Tốt, đặt tiệc.** Loại tiệc phục vụ, dữ liệu, quy trình phản hồi, thời điểm cam kết tài nguyên, chính sách báo giá và cọc nếu có là gì? Ảnh hưởng UC-20.
13. **Q-13 · Mức Tốt, đánh giá.** Ai được gửi, có cần lượt đã phục vụ, số lần gửi, thang điểm và quy tắc công khai/kiểm duyệt là gì? Ảnh hưởng UC-21.
14. **Q-14 · Chất lượng và dùng thử.** Thiết bị, trình duyệt, mức tải, thời gian phản hồi, mục tiêu khả dụng và mục tiêu khôi phục nào cần kiểm? Ai duyệt dùng thử, dùng dữ liệu/giao dịch thật hay thử, và ghi nhận bằng chứng theo hình thức nào? Cần chốt quyền truy cập, thời hạn lưu, sao lưu dữ liệu cá nhân, lịch sử nghiệp vụ và giao dịch. Ảnh hưởng mục 9, AC-17 đến AC-19.
15. **Q-15 · Nhận diện thao tác lặp.** Khi khách gửi lại từ một phiên hoặc chuyển kênh sau mất phản hồi, thông tin nào giúp nhận ra cùng lần đặt và tra được kết quả? Khi một người muốn đặt nhiều lượt hợp lệ, xử lý ra sao? Tham chiếu giao dịch dùng để phát hiện dữ liệu đối chiếu lặp do Q-04 xác định. Ảnh hưởng UC-04, UC-09, UC-18, UC-19 và AC-18.

### Đề xuất mở rộng sau phạm vi đánh giá

- Nhắc lịch theo kênh khách đồng ý. Có thể hỗ trợ mục tiêu giảm tình trạng không đến.
- Danh sách chờ cho khung hết chỗ và thông báo khi có suất phù hợp.
- Phân tích mức sử dụng bàn theo khung giờ từ dữ liệu vận hành đã đủ chất lượng.

## 12. Điều kiện đồ án và chuẩn đầu ra

- **Mốc đồ án.** Giữa kỳ hạn 14/12/2026. Cuối kỳ hạn 14/01/2027. Đề bài nêu các hạn này cho bài nộp và chưa phân bổ hạng mục BRS hay từng module theo kỳ.
- **Quản lý dự án.** Đề bài nêu GitHub, Jira, MS Project và 27 sản phẩm bàn giao ký hiệu D01–D27. Cần danh mục chính thức để gán BRS hoặc nội dung liên quan vào mã bàn giao.
- **CLO2, bài 2–6.** Bao gồm phạm vi, thời gian, chi phí, chất lượng và nhân sự. Danh mục module và use case hỗ trợ quản lý phạm vi, phần vai trò hỗ trợ xác định trách nhiệm, phần tiêu chí hỗ trợ quản lý chất lượng. Kế hoạch thời gian và chi phí cần tài liệu kế hoạch tương ứng.
- **CLO3, bài 7–9.** Bao gồm truyền thông, rủi ro, mua sắm và tích hợp. Các câu hỏi vận hành và dùng thử hỗ trợ chốt thông tin với đơn vị. Rủi ro không đến và trùng bàn gắn với cọc, kết quả phục vụ và kiểm soát bố trí. Định hướng làm hay mua và tích hợp lấy từ NV-07 để đưa vào tài liệu quản lý dự án tương ứng.

## 13. Truy vết từ đề bài đến nghiệm thu

- **NV-01 →** M01 đến M08 trên nền tảng Web, NFR-01, AC-19.
- **NV-02 →** UC-17, UC-18, BR-08, AC-15, AC-16.
- **NV-03 →** UC-03, UC-04, UC-06 đến UC-08, UC-12, UC-14, BR-01, BR-04, BR-09, AC-02, AC-03, AC-05 đến AC-07, AC-11, AC-13.
- **NV-04 →** UC-01, UC-03, UC-04, UC-06 đến UC-14, UC-16, AC-01 đến AC-14 theo từng use case.
- **NV-05 →** UC-19, UC-20, UC-21, AC-21a đến AC-21c.
- **NV-06 →** NFR-01, NFR-06, AC-19.
- **NV-07 →** M04 và M08, AC-07 đến AC-09, AC-15 đến AC-17. Bằng chứng demo cần đối chiếu lựa chọn VietQR và Groq với cấu hình tích hợp thực tế.
- **NV-08 →** BR-02 đến BR-05 và BR-09, AC-04, AC-09, AC-11, AC-13.
- **NV-09 →** Mục 12 và tài liệu quản lý dự án tương ứng.
