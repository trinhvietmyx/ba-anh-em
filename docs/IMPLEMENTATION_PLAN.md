# Kế hoạch triển khai Full Stack — Nhà hàng Ba Anh Em

> **Dành cho AI Coding Agent.** Khi được giao triển khai, đọc BRS cùng kế hoạch này và thực hiện theo mã task. Dùng quy trình thực thi kế hoạch theo phương thức nhóm đã chọn. Checklist để ghi kết quả sau từng bước, kèm bằng chứng chạy mới nhất.

**Mục tiêu** — Đưa MVP đặt bàn, đặt món trước, cọc VietQR, điều phối nhà hàng và chatbot AI lên production, sau đó triển khai phần nâng cao được duyệt.

**Kiến trúc đề xuất** — Monorepo TypeScript với ứng dụng web React, REST API NestJS dạng monolith theo module và một PostgreSQL. Web và chatbot đi qua cùng dịch vụ đặt chỗ. Groq và VietQR nằm sau adapter phía máy chủ. Triển khai ứng dụng bằng container, phục vụ web và chuyển tiếp API qua Caddy.

**Công nghệ đề xuất** — React/Vite, React Router, TanStack Query, NestJS, OpenAPI, PostgreSQL, Kysely và node-postgres, npm workspaces, Playwright, Docker Compose, GitHub Actions và GHCR. Chi tiết ở mục 2.

**Đặc tả nguồn** — BRS là căn cứ về nghiệp vụ. NestJS, PostgreSQL 17 và màn hình quản lý thực đơn trong MVP đã được chủ dự án duyệt. [BRS Nhà hàng Ba Anh Em](BRS-Nha-hang-Ba-Anh-Em.md) · [Quyết định kiến trúc](design/BACKEND_ARCHITECTURE.md#10-hồ-sơ-quyết-định-kiến-trúc)

**Hiện trạng khi lập kế hoạch** — Repo ứng dụng chưa có commit hoặc mã nguồn. BRS ở thư mục tài liệu cùng cấp. Tất cả task ở trạng thái chưa thực hiện.

**Cập nhật tiến độ 20/11/2026** — T05 nền tảng repo đã được khởi tạo trước đó. T08 đang thực hiện một phần: đã tạo khung web trong `apps/web`, chuyển giao diện Prototype đã duyệt sang workspace riêng, tách route/layout, đưa dữ liệu mẫu và transport/mock service ra khỏi view, thêm React Query và bản nháp API contract. Lint, format, typecheck, unit test và build đạt; smoke test trình duyệt xác nhận 18 route, 28 tổ hợp responsive, các luồng tạo đặt bàn/thêm món/chat và phân quyền UI mẫu. T08 chưa hoàn tất: xác thực thật phụ thuộc T07, hợp đồng OpenAPI và API smoke phụ thuộc Backend/T03, UI/e2e test tự động và kiểm tra accessibility chuyên sâu còn thiếu. Xem [FRONTEND_READINESS.md](../FRONTEND_READINESS.md).

## 1. Ràng buộc và cách thực thi

- **MVP** gồm quản lý và hiển thị thực đơn, đặt bàn theo khung giờ và số khách, đặt món trước, cọc, sơ đồ bàn, quản lý đặt chỗ, báo cáo và chatbot AI đặt bàn, tư vấn món. Website nhận đặt 24/7 theo lịch phục vụ. Bản demo công khai và được dùng thử tại đơn vị. T29 dùng màn hình quản lý thực đơn hiện có theo quyết định ngày 25/11/2026.
- **Mức Tốt** gồm UC-19, UC-20 và UC-21. Khi chọn mục tiêu này, hoàn thành cả ba và nghiệm thu theo AC-21a đến AC-21c. UC-05 và UC-15 là tùy chọn riêng. Mở rộng dài hạn nằm ở mục 10.
- **Nguồn chính sách.** Các Q trong BRS còn mở cho đến khi có câu trả lời được ghi nhận. Xếp `Blocked` cho bước phụ thuộc trực tiếp, vẫn tiếp tục bước đủ đầu vào. Dữ liệu giả lập được đánh dấu, dùng trong local/CI hoặc môi trường thử đã duyệt. Khi xuất hiện mâu thuẫn với BRS, ghi quyết định và ảnh hưởng rồi cập nhật các tài liệu liên quan sau khi được xác nhận.
- **Ưu tiên.** `P0` là điều kiện của MVP hoặc phát hành an toàn. `P1` là lát cắt MVP có thể xếp sau lõi đặt chỗ và vẫn phải hoàn tất trước nghiệm thu. `P2` là việc thực hiện khi phạm vi tùy chọn hoặc mức Tốt được duyệt.
- **Thứ tự.** Chạy theo mã tăng dần làm mặc định. Chỉ làm song song task đã đủ phụ thuộc, có đầu ra độc lập và có người chịu trách nhiệm tích hợp. Từ khóa “chốt Q” trong task áp dụng cho phần chính sách cụ thể mà task sử dụng.
- **Theo dõi.** Jira ghi mã task, chủ sở hữu, trạng thái `Todo / Doing / Blocked / Done / Deferred`, phụ thuộc, Q liên quan và bằng chứng. MS Project dùng cùng mã, WBS và quan hệ kết thúc–bắt đầu theo cột phụ thuộc. GitHub liên kết PR hoặc tài liệu rà soát với mã task. Dùng `Deferred` cho phạm vi P2 chưa chọn.
- **Điều kiện Done.** Có đầu ra kiểm tra được, đủ checklist, bằng chứng gắn AC liên quan và cập nhật bảng truy vết khi hợp đồng thay đổi. Với task phát triển, tạo ca kiểm thử cho hành vi thay đổi, xác nhận ca đó phát hiện thiếu sót, triển khai, chạy lại kiểm thử và các gate CI liên quan. Ghi kết quả rà soát trước khi chuyển task phụ thuộc.
- **Bằng chứng.** Lưu mã commit hoặc phiên bản artifact, môi trường, bộ dữ liệu, ID ca thử, kết quả và liên kết. Với ảnh, logs và trace, che thông tin liên hệ, danh tính và giao dịch nhạy cảm.

### Trọng tâm kiểm tra trước khi phát hành

1. Hai lượt bắt đầu khác giờ nhưng chồng khoảng sử dụng, hoặc tổng sức chứa đủ nhưng tổ hợp bàn không phù hợp. Kiểm tra tính khả dụng và tranh chỗ cuối ở T10, T11, T14, T22.
2. Cọc đến sau hạn, ngay khi chỗ đã cấp cho lượt khác. Kiểm tra tiền vẫn đối chiếu được và phân bàn đang hiệu lực được bảo toàn ở T18, T22.
3. Phản hồi bị mất sau commit, khách gửi lại hoặc chuyển kênh theo quy tắc đã duyệt. Kiểm tra giữ một kết quả và phân biệt ý định mới ở T11, T21, T22.
4. Món đổi giá hoặc ngừng nhận sau khi khách chọn, và danh sách món thay đổi sau khi bếp đã nhận. Kiểm tra dữ liệu hiệu lực và phần thay đổi ở T13, T16, T22.
5. Chatbot thiếu căn cứ, trả kết quả không hợp lệ hoặc mất kết nối. Kiểm tra quyền truy cập, phản hồi theo trạng thái đã xác minh và đường tiếp tục qua web ở T20, T21, T23, T24.

## 2. Kiến trúc, công nghệ và cấu trúc thư mục

### 2.1 Ranh giới hệ thống

1. **Web.** Một SPA gồm phần khách và phần vận hành theo quyền. React Router quản lý route, TanStack Query quản lý dữ liệu API và đồng bộ lại khi ghi thành công. Form lưu trạng thái thao tác riêng với dữ liệu đã ghi nhận. UI dùng trạng thái và hành động do API cung cấp.
2. **API.** NestJS chia theo miền nghiệp vụ. Controller xác thực, kiểm tra DTO và trả hợp đồng HTTP. Dịch vụ ứng dụng thực hiện use case, quản lý giao dịch và gọi adapter. Repository thực hiện truy vấn. Các module trao đổi qua giao diện dịch vụ. Tầng web và chatbot dùng cùng quy tắc nghiệp vụ đặt chỗ và chia sẻ cơ chế xác thực theo ngữ cảnh thực. [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction).
3. **Dữ liệu.** PostgreSQL là nguồn xác thực cho lượt đặt, bàn, món, cọc và báo cáo. Dùng Kysely và node-postgres để truy vấn có tham số, migration theo phiên bản và kiểm soát trực tiếp giao dịch đặt chỗ. Các version migration đã phát hành được giữ cố định. [Kysely Migrations](https://kysely.dev/docs/migrations).
4. **Biên thanh toán và AI.** Module cọc cung cấp thông tin VietQR và dùng nguồn đối chiếu đã duyệt. Module chat gọi Groq phía server, lấy ngữ cảnh thực đơn và chuyển nhu cầu đặt bàn đến cùng use case. Nếu cấu hình có tác vụ xử lý hết hạn hoặc nhận sự kiện, dùng tiến trình cùng codebase với thao tác có thể chạy lại an toàn. [Groq Rate Limits](https://console.groq.com/docs/rate-limits).
5. **Môi trường.** Local Windows dùng Node/npm và PostgreSQL trong Compose. CI Linux dùng PostgreSQL cùng major với staging/production. Staging tách dữ liệu, bí mật, cấu hình tích hợp và tên miền. Production đề xuất một máy Linux chạy container Caddy/web và API, kết nối PostgreSQL quản lý qua mạng giới hạn và TLS. Duyệt hạ tầng, chi phí và mức sẵn sàng trước T25. [Docker Compose Production](https://docs.docker.com/compose/how-tos/production/), [Caddy Automatic HTTPS](https://caddyserver.com/docs/automatic-https).

### 2.2 Stack và giả định kỹ thuật

- **Runtime.** Node.js 24 LTS và PostgreSQL 17 là baseline đề xuất. T05 chọn patch còn được hỗ trợ, xác nhận tương thích Node, npm, Vite, NestJS và thư viện trước khi khóa phiên bản đồng nhất. TypeScript strict, ESLint và Prettier áp dụng tại repo. [Node.js Releases](https://nodejs.org/en/about/previous-releases), [Vite Getting Started](https://vite.dev/guide/), [PostgreSQL 17](https://www.postgresql.org/docs/17/index.html).
- **API/Frontend.** DTO kiểm tra đầu vào phía server, OpenAPI sinh từ API, type client sinh từ OpenAPI. CSS theo token UI. Jest/Supertest cho API, Vitest/Testing Library cho UI, Playwright cho luồng trình duyệt và k6 cho thử tải. [Playwright CI](https://playwright.dev/docs/ci), [k6 Thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/).
- **Truy cập.** Đề xuất IdP hỗ trợ OIDC và phiên máy chủ bằng cookie cho nhân sự, ánh xạ người đã xác thực sang tài khoản nghiệp vụ và quyền của nhà hàng. Chọn IdP tại T03/T07 sau khi cân đối chi phí và vận hành. Quyền khách và cách nhận diện lượt đặt theo Q-07/Q-15.
- **Nguồn dữ liệu.** Một nhà hàng trong phạm vi BRS. Đề xuất nạp lịch, bàn và thực đơn qua quy trình import có người phụ trách nếu màn hình quản trị tương ứng chưa được duyệt. Giữ khả năng cập nhật có kiểm tra và không dùng seed demo trên production. Lịch, múi giờ nhà hàng, số tiền, thời hạn, vai trò, chỉ số và giới hạn tải lấy từ Q đã duyệt. Kiểu dữ liệu thời gian và tiền vẫn thống nhất ngay ở T04.
- **Mua sắm và năng lực.** Xác nhận quyền sở hữu repo/Jira/MS Project, tên miền, hạ tầng, cơ sở dữ liệu, IdP, tài khoản Groq và cấu hình nhận VietQR. Kiểm tra khả năng sử dụng Groq free cho model, quota và cách dùng dữ liệu, cùng cơ chế đối chiếu VietQR trong tài khoản thực tế. Quyết định phương án thay đổi dịch vụ hoặc chi phí đi qua chủ dự án.

### 2.3 Thư mục dự kiến

- `apps/web/src/routes/public/` và `apps/web/src/routes/ops/` giữ khai báo màn hình và điều hướng theo nhóm người dùng. `apps/web/src/features/` giữ giao diện, biểu mẫu và cách gọi API theo miền `menu`, `booking`, `preorders`, `floorplan`, `operations`, `kitchen`, `deposits`, `reports` và `chat`. `apps/web/src/shared/` giữ token, component cơ bản và HTTP client.
- `apps/api/src/modules/` có `auth`, `menu`, `booking`, `preorders`, `floorplan`, `operations`, `kitchen`, `deposits`, `reports` và `chat`. Lịch và sức chứa thuộc `booking`. `apps/api/src/platform/` giữ DB/transaction, cấu hình, logging, lỗi HTTP và audit. Các adapter Groq và VietQR đặt trong module sở hữu. `apps/api/src/jobs/` chỉ tạo khi thiết kế đã duyệt cần tác vụ nền.
- `apps/api/db/migrations/`, `apps/api/db/fixtures/` và `apps/api/db/import/` giữ migration bất biến, dữ liệu thử và job nhập dữ liệu được kiểm soát. `apps/api/test/integration/` dùng PostgreSQL thật. Test đơn vị đặt cạnh module và component tương ứng.
- `packages/api-contract/` giữ artifact OpenAPI và type sinh tự động. `tests/e2e/`, `tests/load/` và `tests/fixtures/` giữ kịch bản tích hợp hệ thống, thử tải và dữ liệu dùng chung.
- `infra/compose/`, `infra/caddy/`, `.github/workflows/` giữ cấu hình môi trường, reverse proxy, pipeline CI và phát hành. `docs/decisions/`, `docs/design/`, `docs/qa/`, `docs/runbooks/` giữ quyết định, thiết kế, bằng chứng và quy trình vận hành. `README.md` là điểm vào cho người phát triển mới. Các đường dẫn con là đích dự kiến của các task.

## 3. Hợp đồng dùng chung sẽ chốt ở T03–T04

### 3.1 API

Prefix đề xuất là `/api/v1`. Các tài nguyên dưới đây là ranh giới để chia việc. T03 xác định DTO, tham số, mã lỗi, operation ID và quyền. Endpoint điều kiện chỉ đưa vào OpenAPI khi phạm vi tương ứng được duyệt.

| Tài nguyên | Hành vi và dữ liệu trao đổi | Task sở hữu |
| --- | --- | --- |
| `GET /menu` | Trả thực đơn công bố và khả năng đặt trước. | T09 |
| `GET /ops/menu`, `POST /ops/menu`, `PUT /ops/menu/{dishId}` | Đọc danh mục vận hành, tạo/sửa món và thay trạng thái theo quyền. Kiểm phiên bản khi sửa. | T29 |
| `GET /availability` | Nhận ngày/khung và số khách. Trả khả năng nhận đặt, lý do nghiệp vụ và phương án thay thế đã kiểm tra nếu có. | T10 |
| `POST /reservations` | Nhận ý định đặt đã chuẩn hóa, ngữ cảnh truy cập và khóa thao tác. Trả mã lượt đặt, khung/số khách và tình trạng bàn, cọc, đặt chỗ theo quyền. | T11 |
| `PUT /reservations/{id}/preorders` | Ghi danh sách món theo phiên bản hiện hành, quyền và quy tắc Q-05. Trả danh sách có hiệu lực và lý do cho phần không ghi nhận. | T13 |
| `GET /ops/floorplan`, `PUT /ops/reservations/{id}/allocation` | Đọc bố trí theo khung, vùng và quyền. Ghi phương án bàn nếu thỏa sức chứa, trạng thái và điều kiện xung đột. | T14 |
| `GET /ops/reservations`, `GET /ops/reservations/{id}`, `POST /ops/reservations/{id}/service-events` | Theo dõi lượt và ghi sự kiện vận hành được phép. | T15 |
| `GET /ops/kitchen/preparations` | Trả dữ liệu chuẩn bị và khả năng nhận ra thay đổi theo luồng bếp. | T16 |
| `POST /reservations/{id}/deposits`, `GET /reservations/{id}/deposits/{depositId}` | Tạo yêu cầu cọc và đọc trạng thái tối thiểu theo quyền vào đúng lượt. | T17 |
| `POST /ops/deposits/{depositId}/reconciliations` và đường vào nguồn giao dịch tự động nếu được duyệt | Tiếp nhận bằng chứng, đối chiếu, xử lý ngoại lệ. Chỉ mở webhook sau khi chốt cấu hình và cách xác thực nguồn. | T18 |
| `GET /ops/reports` | Nhận kỳ/chỉ số/bộ lọc đã duyệt. Trả kết quả, đơn vị và mốc kỳ. | T19 |
| `POST /chat/messages` | Tư vấn món và thu thập ý định đặt. Thao tác tạo lượt đi qua cùng hợp đồng ghi của T11 bằng UI xác nhận hoặc bước chuyển kênh được duyệt. | T20, T21 |

Quy ước HTTP dự kiến gồm `401` thiếu xác thực, `403` thiếu quyền, mã phù hợp với chính sách che sự tồn tại của đối tượng, `409` xung đột trạng thái/khóa thao tác, `422` dữ liệu đúng cú pháp nhưng sai quy tắc và `429` chạm giới hạn. Kết quả lỗi dùng mã ổn định, thông điệp, trường cần sửa nếu có và mã truy vết. T03 quy định rõ `400`, `404`, `503` khi phù hợp, dữ liệu có được phép thử lại và quy tắc cache đối với từng route. API khách trả dữ liệu công bố hoặc dữ liệu thuộc phiên đã xác minh. Mã đặt chỗ dùng để tham chiếu, quyền đọc/ghi dựa trên xác thực theo Q-07.

### 3.2 Mô hình dữ liệu và giao dịch

- **Các nhóm bảng đề xuất.** `venues`, `service_schedules`, `schedule_exceptions`, `dining_tables`, `reservations`, `reservation_contacts`, `table_allocations`, `menu_items`, `preorder_lines`, `deposit_requests`, `payment_transactions`, `payment_matches`, `staff_users`, `staff_grants`, `audit_events`, `operation_keys`. Chỉ thêm thông tin phiên chat lưu bền, trạng thái giao bếp hoặc hàng đợi công việc khi chính sách và thiết kế yêu cầu.
- **Kiểu dữ liệu.** Khoảng sử dụng ghi mốc thời gian có timezone, hiển thị theo múi giờ nhà hàng đã duyệt. Mô hình khoảng `[bắt đầu, kết thúc)` là đề xuất kỹ thuật sau khi cộng các khoảng đệm theo chính sách. Tiền VND nếu được xác nhận lưu nguyên đơn vị đồng, tránh số dấu phẩy động. Lưu kết quả giá áp dụng nếu Q-05 yêu cầu. Đặt chỗ, phân bàn, cọc và món có trạng thái riêng. Có khóa ngoại, ràng buộc số lượng/khoảng thời gian, chỉ mục tra cứu và khóa duy nhất theo nghiệp vụ.
- **Chống trùng bàn.** Mọi thao tác sinh, đổi hoặc giải phóng cam kết lấy khóa hàng `venues` của cùng nhà hàng trước khi đọc lại dữ liệu có hiệu lực và ghi trong cùng transaction. Các repository tham gia dùng cùng transaction, theo thứ tự khóa thống nhất. Giữ transaction ngắn, gọi Groq/VietQR ngoài transaction. Khi có bàn vật lý, dùng ràng buộc loại trừ GiST theo mã bàn và khoảng thời gian cho phân bổ đang hoạt động. Nếu có giữ tạm, áp dụng hết hạn theo đồng hồ của DB trong nhánh giao dịch và vô hiệu hóa bản ghi hết hiệu lực trước khi cam kết mới. Nếu Q-02 cho phép cam kết trước khi gán bàn, phải chứng minh tất cả cam kết giao nhau vẫn bố trí được theo tổ hợp hợp lệ, trong cùng khóa. Chọn cách giữ tài nguyên nội bộ hoặc kiểm tra phương án khả thi tại T04. [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/17/explicit-locking.html), [Range Types](https://www.postgresql.org/docs/17/rangetypes.html), [btree_gist](https://www.postgresql.org/docs/17/btree-gist.html).
- **Gửi lại an toàn.** Khóa thao tác lưu theo chủ thể đã xác minh và hành động, cùng dấu vết nội dung chuẩn hóa và tham chiếu kết quả. Commit việc ghi lượt cùng kết quả xử lý khóa. Khóa cũ với cùng nội dung trả kết quả đối chiếu được trong quyền hiện hành. Khóa cũ và nội dung khác trả xung đột. Sau lỗi giao tiếp, áp dụng đường tìm lại theo Q-15. Trùng giao dịch thanh toán áp dụng khóa duy nhất theo định danh nguồn và phạm vi Q-04.
- **Trạng thái và audit.** T04 lập ma trận trạng thái nguồn, lệnh, quyền, điều kiện, đích và ảnh hưởng sang miền khác. Log nghiệp vụ có mã tham chiếu, nguồn/người, thời điểm và kết quả. Cập nhật miền liên quan trong transaction khi có thể. Với bước phụ thuộc hệ thống ngoài, lưu trạng thái đang chờ và đường đối chiếu để khôi phục sau gián đoạn.

## 4. Giai đoạn, milestone và thứ tự phụ thuộc

| Giai đoạn | Task | Milestone và đầu ra bắt buộc | Điều kiện đi tiếp |
| --- | --- | --- | --- |
| G0 · Chuẩn bị và thiết kế | T01–T04 | M0 · Phạm vi, prototype, API và mô hình dữ liệu có phiên bản. | Chính sách đã biết có người duyệt. Có thể dựng nền trong lúc Q mở. Chặn từng lát cắt bị ảnh hưởng. |
| G1 · Môi trường và nền tảng | T05–T08 | M1 · Local và CI chạy từ checkout sạch, có DB, quyền và khung web. | Build, migrate, smoke test và kiểm mẫu phân quyền chạy được. |
| G2 · MVP theo lát cắt | T09–T22, T29 | M2 · MVP chạy từ đầu đến cuối qua web, chat và quản lý. | AC-01 đến AC-16, AC-18 và AC-20a có bằng chứng test phù hợp. AC-17/19 hoàn tất ở G3. |
| G3 · Kiểm thử, staging, production | T23–T28 | M3 · Release candidate được nghiệm thu ở staging tại T26. M4 · Bản MVP công khai, dùng thử và bàn giao tại T27–T28. | AC-01 đến AC-19 và AC-20a đạt, điều kiện phát hành và phương án phục hồi được kiểm tra, đơn vị dùng thử có bằng chứng. |
| G4 · Phạm vi nâng cao nếu duyệt | T30–T35 | M5 · Tùy chọn được chọn đạt AC-20b/20c tương ứng. Mức Tốt đạt cả ba AC-21 và hồi quy MVP. | T35 phát hành riêng sau MVP. Phần chưa chọn giữ Deferred. |

**Chuỗi phụ thuộc cần theo dõi sớm** — Q-01 đến Q-04, Q-07, Q-08 và Q-15 → thiết kế lịch, sức chứa, bảo mật → lõi đặt chỗ → phân bàn, cọc và chatbot → kiểm thử liên kênh → staging → production. Đường tích hợp khác cần chạy sớm gồm kiểm tra nguồn VietQR, quyền dùng Groq và thống nhất lịch dùng thử với đơn vị.

**Mốc học phần** — Hạn giữa kỳ 14/12/2026, cuối kỳ 14/01/2027 theo đề bài. Đề xuất theo dõi M0/M1 cho nhịp giữa kỳ và M4 trước hạn cuối kỳ. Đây là mục tiêu lập lịch ban đầu. T01 chốt năng lực nhóm, lead time tích hợp, lịch đơn vị và phân bổ chính thức theo D01–D27 khi có danh mục. M5 ghi riêng tùy mục tiêu đánh giá.

## 5. G0 và G1 — Chuẩn bị, thiết kế, nền tảng

### T01 — Lập baseline, lịch và sổ quyết định

**Ưu tiên** P0 · **Tiên quyết** Không có · **Đầu vào** BRS, đề bài, nhân sự và mốc học phần.

**Mục tiêu** — Biến phạm vi và các điểm mở thành đầu việc có nguồn, người chốt và điều kiện tiếp tục.

- [ ] Đối chiếu BRS đang dùng với đề bài. Ghi phiên bản/đường dẫn nguồn và tạo sổ Q với người phụ trách trả lời, ngày dự kiến, task bị ảnh hưởng và quyết định có bằng chứng.
- [ ] Tạo WBS từ bảng milestone và task. Ghi ước lượng theo người thực hiện, phụ thuộc nguồn lực, thời gian chờ tích hợp, chi phí dự kiến, trách nhiệm và lịch dùng thử.
- [ ] Liên kết GitHub, Jira, MS Project theo mã task. Xin danh mục D01–D27 từ người phụ trách học phần và truy vết khi có. Theo dõi mục tiêu MVP/Tốt/tùy chọn riêng.

**Đầu ra** — Baseline, sổ quyết định, WBS, sổ rủi ro và đầu mối nhà hàng.

**Checklist nghiệm thu**

- [ ] Q-01 đến Q-15 có người chịu trách nhiệm hoặc trạng thái chờ phân công rõ, có task nhận ảnh hưởng.
- [ ] Lịch thể hiện cả hai hạn học phần, các mốc nghiệm thu, nguồn lực và tác vụ đường găng. Mã bàn giao dựa trên danh mục đã có.

### T02 — Thiết kế luồng và prototype UI/UX

**Ưu tiên** P0 · **Tiên quyết** T01 · **Đầu vào** BRS mục 3–5, dữ liệu mẫu, Q áp dụng cho từng luồng.

**Mục tiêu** — Đồng thuận cách khách và nhà hàng thực hiện các công việc thường dùng và phục hồi sau lỗi.

- [ ] Lập sitemap và wireflow cho menu, chọn khung/số khách, tạo lượt, chọn món, VietQR, hội thoại, danh sách/chi tiết đặt chỗ, sơ đồ, bếp, đối chiếu và báo cáo.
- [ ] Đặc tả màn hình mobile/desktop với trạng thái tải, trống, lỗi, hết chỗ, hết món, chờ đối chiếu, hết hạn và thiếu quyền. Tách trạng thái đặt chỗ, bàn, cọc bằng nhãn rõ. Thiết kế focus, nhãn form, thông báo lỗi và sơ đồ có danh sách đọc bằng bàn phím.
- [ ] Duyệt điểm chốt món, chuyển bếp, cọc và chuyển kênh chat. Gắn AC vào màn hình và ghi biến thể chưa chốt để tái kiểm tra.

**Đầu ra** — `docs/design/ui-flows.md` và prototype có màn hình, trạng thái, vai trò và ghi nhận duyệt.

**Checklist nghiệm thu**

- [ ] Đi được các luồng khách và vận hành chính từ đầu đến cuối trên prototype, bao gồm cọc đến trễ và khung vừa hết.
- [ ] Mỗi bước chỉ rõ dữ liệu nhập, phản hồi mong đợi và điều kiện chuyển. Các quyền/chính sách chưa xác nhận được đánh dấu.

### T03 — Chốt kiến trúc, hợp đồng API và phương án tích hợp

**Ưu tiên** P0 · **Tiên quyết** T01, T02 · **Đầu vào** Thiết kế luồng, Q-04, Q-07, Q-08, Q-11, Q-14, Q-15 và quyền truy cập dịch vụ nếu có.

**Mục tiêu** — Định nghĩa ranh giới module và hợp đồng để backend, frontend, kiểm thử dùng chung.

- [ ] Rà đề xuất kiến trúc mục 2, lập sơ đồ vùng tin cậy và ghi ADR về stack, phiên, triển khai, adapter và phân quyền dữ liệu. Đối chiếu hosting, DB, DNS/TLS, IdP, cấu hình Groq và phương án QR/đối chiếu.
- [ ] Chốt hợp đồng mục 3.1 gồm operation ID, trường dữ liệu, phân trang và thứ tự ổn định nếu có, lỗi, xác thực, phạm vi quyền theo đối tượng, quyền truy cập dữ liệu, khóa thao tác và phiên bản tài nguyên cập nhật.
- [ ] Định nghĩa API nội bộ cho lịch/khả dụng, tạo và chuyển trạng thái lượt đặt, đọc thực đơn, ghi bằng chứng và ghi audit. Ghi dependency theo chiều controller → dịch vụ → repository/adapter. Lập bộ thử hợp đồng cho dữ liệu hợp lệ, lỗi và thiếu quyền.

**Đầu ra** — `docs/decisions/`, `docs/design/api-contract.md`, ma trận quyền và bảng khả năng tích hợp theo môi trường.

**Checklist nghiệm thu**

- [ ] DTO, lỗi, phân quyền và quy ước gửi lại có ví dụ kiểm được cho web, chat và vận hành.
- [ ] VietQR xác định rõ cách cung cấp QR và nguồn đối chiếu đã biết. Khả năng tự động và model/quota thật còn mở được ghi điều kiện xác nhận trước task phụ thuộc.

### T04 — Thiết kế dữ liệu, trạng thái và bộ trường hợp biên

**Ưu tiên** P0 · **Tiên quyết** T03 · **Đầu vào** BRS mục 6–8, API, chính sách lịch, bàn, cọc, món, vận hành và báo cáo đã biết.

**Mục tiêu** — Khóa mô hình dữ liệu và bất biến nghiệp vụ trước các migration theo miền.

- [ ] Vẽ ERD, mô tả khóa và dữ liệu nhạy cảm. Ghi phiên bản cấu hình hoặc dữ liệu đã áp dụng cần giữ cho các lượt hiện hữu, kiểu ngày/giờ, tiền và phương án migration theo từng module.
- [ ] Lập ma trận chuyển trạng thái cho đặt chỗ, phân bàn, cọc và món. Chỉ ra ranh giới commit, thứ tự khóa, thời điểm kiểm tra quá hạn, cạnh tranh đặt/đổi bàn và cách phục hồi từ thao tác gián đoạn.
- [ ] Thiết kế fixture xác định được kết quả cho bàn liền kề/chồng lấn, ghép bàn nếu duyệt, giờ đóng cửa, món đổi khả dụng, cọc lệch hoặc đến trễ, phân quyền, gửi lại và báo cáo tính tay.

**Đầu ra** — `docs/design/data-model.md`, ma trận trạng thái và danh mục fixture gắn AC.

**Checklist nghiệm thu**

- [ ] Mỗi hành động đổi trạng thái có quyền, tiền điều kiện, kết quả và ảnh hưởng đến bàn/món/cọc.
- [ ] Kịch bản chỉ còn một bàn và kịch bản đủ chỗ cộng gộp nhưng không khả thi có kết quả kỳ vọng. Phương án nghiệp vụ chưa chốt vẫn được ghi riêng.

### T05 — Khởi tạo workspace, môi trường local và CI

**Ưu tiên** P0 · **Tiên quyết** T03 · **Đầu vào** Stack, cấu trúc repo, quyền GitHub và baseline phiên bản.

**Mục tiêu** — Cho phép checkout sạch cài đặt, build và chạy kiểm thử giống nhau giữa người phát triển và CI.

- [ ] Khởi tạo npm workspaces, `apps/web`, `apps/api`, `packages/api-contract`, TypeScript strict, lockfile và kiểm định phiên bản Node/npm. Tạo `.env.example` chỉ có tên biến và giá trị giả lập.
- [ ] Thiết lập Compose cho PostgreSQL local, hướng dẫn Windows/Linux trong README và kiểm tra cấu hình bắt buộc khi khởi động. Đăng ký scripts `dev`, `lint`, `format:check`, `typecheck`, `build`, `test:unit`. T06 bổ sung `db:migrate`, `db:seed:test`, `test:integration`. T08 bổ sung `contract:check`, `test:e2e`.
- [ ] Thêm `.github/workflows/ci.yml` cho cài từ lockfile, kiểm định kiểu/format, test, build, kiểm tra lộ bí mật và phiên bản phụ thuộc. Đẩy nhóm kiểm tra có thật thành gate PR khi khả dụng.

**Đầu ra** — Workspace, môi trường dev tái lập, CI và quick start.

**Checklist nghiệm thu**

- [ ] Checkout sạch khởi chạy được web, API, DB và build trên local; CI Linux chạy các script của task và báo lỗi khi có lỗi kiểm tra.
- [ ] Cấu hình mẫu, nhánh và đầu ra build không chứa khóa tích hợp hay dữ liệu khách.

### T06 — Thiết lập PostgreSQL, migration và nạp dữ liệu gốc

**Ưu tiên** P0 · **Tiên quyết** T04, T05 · **Đầu vào** ERD, cấu hình local/CI, dữ liệu sơ đồ/lịch/thực đơn được phép dùng.

**Mục tiêu** — Có database tái lập, kết nối ổn định và quy trình quản lý dữ liệu khởi đầu.

- [ ] Thiết lập pool, migration runner Kysely và tài khoản ứng dụng tách quyền migration. Tạo bảng nền, cấu hình nhà hàng, lịch, bàn và điểm ghi audit. Các bảng miền thêm dần theo task sở hữu. Kiểm tra quyền cài và sử dụng `btree_gist` trên cấu hình dự kiến.
- [ ] Tạo fixture local/CI, seed thử chạy lại được và quy trình import có kiểm tra mã, dữ liệu trùng và tham chiếu. Import thay đổi lịch/bàn khi đã có đặt chỗ phải dùng đường cập nhật kiểm soát ở T10/T14, hoặc thực hiện trong cửa sổ vận hành có khóa và rà tác động.
- [ ] Thêm kiểm thử migrate từ DB trống, chạy lại định kỳ và nâng từ schema trước. Tổ chức DB integration riêng theo lượt test hoặc worker.

**Đầu ra** — `apps/api/db/`, lớp platform DB, dữ liệu thử, lệnh migration và integration test.

**Checklist nghiệm thu**

- [ ] Migration và seed thử chạy lặp với cùng kết quả, dữ liệu nhập lỗi được báo trước khi áp dụng.
- [ ] DB integration trên PostgreSQL thật kiểm chứng khóa, chỉ mục hoặc ràng buộc nền theo thiết kế. Quy trình production có đường nhập dữ liệu chính thức riêng.

### T07 — Xác thực, phân quyền và audit dùng chung

**Ưu tiên** P0 · **Tiên quyết** T03, T06, phần Q-07/Q-08 cần cho từng vai trò đã chốt · **Đầu vào** Ma trận quyền, IdP và mô hình phiên.

**Mục tiêu** — Tạo ngữ cảnh người dùng được tin cậy cho mọi thao tác đọc/ghi.

- [ ] Tích hợp IdP và phiên nhân sự, quy định đăng nhập, hết hạn, đăng xuất và thu hồi quyền. Triển khai cơ chế khách đã duyệt để giới hạn quyền vào đúng lượt. Áp dụng cookie phù hợp, kiểm tra CSRF cho route ghi bằng cookie, bảo vệ bí mật và giới hạn thao tác xác thực.
- [ ] Tạo guard quyền theo vai trò và đối tượng cho tuyến vận hành, khách và adapter tin cậy. Tạo projection theo quyền và dịch vụ ghi audit kèm transaction.
- [ ] Thử role có quyền, sai quyền, phiên hết hạn, quyền vừa thu hồi và thao tác vào lượt khác. Kiểm tra log và lỗi theo mức dữ liệu cho phép.

**Đầu ra** — `apps/api/src/modules/auth/`, guards, DTO truy cập, audit và test phân quyền nền.

**Checklist nghiệm thu**

- [ ] Người có quyền vào được tài nguyên được cấp, người ngoài phạm vi nhận phản hồi đúng ngay tại API, kể cả biết mã lượt đặt.
- [ ] Truy được thời điểm và nguồn thực hiện từ sự kiện audit mẫu. Nội dung log theo quy tắc bảo vệ dữ liệu.

### T08 — Khung web, client sinh từ hợp đồng và smoke test

**Ưu tiên** P1 · **Tiên quyết** T02, T05, T07 · **Đầu vào** Prototype, OpenAPI nền, ngữ cảnh xác thực.

**Mục tiêu** — Có layout và cách gọi API thống nhất cho web khách và phần vận hành.

**Trạng thái thực hiện** — `Doing` (20/11/2026). Phần giao diện, route/layout, provider/query, mock service cho menu/đặt chỗ, HTTP transport cơ bản và contract dự thảo đã có. Chưa đánh dấu Done vì các đầu vào bắt buộc T03/T07 và smoke test với API thật chưa sẵn sàng; chi tiết ở [FRONTEND_READINESS.md](../FRONTEND_READINESS.md).

- [ ] Tạo route/layout, token giao diện, form, thông báo lỗi, skeleton/trạng thái trống và xử lý phiên hết hạn theo prototype. Dùng client cùng origin, mapping lỗi từ API và điều hướng theo quyền đã nhận.
- [ ] Xuất OpenAPI từ NestJS, sinh type cho client và kiểm tra contract drift ở CI. Tách biến public build và private server.
- [ ] Tạo smoke test Playwright chạy browser qua API thật với fixture, kiểm đường dẫn mở được, đăng nhập mẫu và từ chối route vận hành khi thiếu quyền. Bật `contract:check`, `test:e2e` với các kiểm tra thực tế.

**Đầu ra** — `apps/web/src/routes/`, `apps/web/src/shared/`, `packages/api-contract/`, smoke test và gate CI.

**Checklist nghiệm thu**

- [ ] Mở được layout trên mobile/desktop, Focus và lỗi cơ bản kiểm được bằng bàn phím. Màn hình phản ánh quyền nhưng API vẫn là nơi thực thi quyền.
- [ ] Sửa hợp đồng ngoài quy trình khiến `contract:check` thất bại. Smoke test chạy từ môi trường sạch.

## 6. G2 — Phát triển MVP theo lát cắt

### T09 — Công bố và hiển thị thực đơn

**Ưu tiên** P1 · **Tiên quyết** T06, T08, chốt Q-09 · **Đầu vào** Bộ trường, dữ liệu thực đơn và quy tắc hiển thị khi ngừng nhận.

**Mục tiêu** — Có một nguồn thực đơn cho khách, chọn món và chatbot.

- [ ] Tạo migration `menu_items`, đường import được giao quyền, truy vấn công bố và DTO `GET /menu`. Cung cấp giao diện đọc công bố cho T13/T20.
- [ ] Dựng trang thực đơn theo T02. Thể hiện khả năng đặt trước, giá và thông tin xác nhận đúng phạm vi công bố. Xử lý dữ liệu trống và lỗi đọc.
- [ ] Thử món nhận đặt, ngừng nhận, giá thiếu, dữ liệu ngoài phạm vi và API tạm gián đoạn.

**Đầu ra** — Module `menu` ở API/web, dữ liệu nhập, OpenAPI và ca thử AC-01.

**Checklist nghiệm thu**

- [ ] Kết quả web khớp nguồn công bố, tình trạng món thể hiện đúng Q-09.
- [ ] Nguồn đọc dùng được ở tiền đặt món và chatbot qua interface của module.

### T29 — Quản trị thực đơn trên web

**Ưu tiên** P1 · **Tiên quyết** T07, T09 và phân công Q-08, dữ liệu Q-09 · **Đầu vào** Màn hình và form hiện có, quyền cập nhật, trường công bố và quy tắc lịch sử giá/món.

**Mục tiêu** — Nhân sự đúng quyền cập nhật thực đơn từ `/van-hanh/thuc-don` trong MVP.

- [ ] Thêm `listOpsMenu`, `createOpsMenuItem`, `updateOpsMenuItem` với quyền theo nhà hàng, CSRF, idempotency và kiểm phiên bản khi sửa. Ghi log người thực hiện, mã món và kết quả đã lưu.
- [ ] Nối form hiện có với cache vận hành riêng. Cập nhật dữ liệu công khai sau khi lưu. Chatbot đọc danh mục đã công bố. Lượt đã lưu giữ tên và giá áp dụng.
- [ ] Kiểm sai quyền, chỉnh đồng thời, gửi lại sau mất phản hồi và dừng nhận món. T22 đối chiếu snapshot của lượt cũ sau khi đã nối đặt món.

**Đầu ra** — Màn hình quản trị thực đơn kết nối API, schema có phiên bản và bằng chứng AC-20a. [Thiết kế API](design/BACKEND_OPENAPI.yaml)

**Checklist nghiệm thu**

- [ ] Người có quyền tạo, sửa, công bố, ẩn và đổi khả dụng. Website và chatbot đọc đúng trạng thái công bố. Một lệnh ghi chỉ có một hiệu lực và lượt cũ vẫn đối chiếu được.

### T10 — Tính khả dụng theo lịch, thời gian và sức chứa

**Ưu tiên** P0 · **Tiên quyết** T04, T06, T08, phần Q-01 đến Q-03 liên quan khả dụng đã chốt · **Đầu vào** Lịch, sức chứa, khoảng sử dụng, tình trạng giữ/cam kết.

**Mục tiêu** — Cung cấp tính khả dụng đúng theo số khách và dữ liệu tại thời điểm tra cứu.

- [ ] Triển khai chuẩn hóa ngày/giờ theo múi giờ nhà hàng, lịch ngoại lệ và giới hạn số khách/thời hạn. Xét sức chứa, tổ hợp bàn, khoảng đệm và cam kết còn hiệu lực theo chính sách.
- [ ] Cài đặt dự đoán khả dụng qua `GET /availability` và một hàm tính dùng lại trong transaction của T11/T14/T18. Thay đổi lịch và bàn đã có cam kết cần đi qua kiểm tra ảnh hưởng.
- [ ] Thử ngày quá khứ, ngoài lịch, đặt ngoài giờ phục vụ, liền kề, chồng lấn, giữ hết hạn và tổng ghế đủ nhưng bàn/tổ hợp không hợp lệ.

**Đầu ra** — Dịch vụ lịch/sức chứa trong `booking`, endpoint và fixture AC-02/AC-04.

**Checklist nghiệm thu**

- [ ] Trả lý do đúng từ cùng bộ dữ liệu mà bước ghi sử dụng; phương án gợi ý đã được kiểm tra.
- [ ] Kết quả phân biệt giờ nhận yêu cầu và khung phục vụ, có ca giờ liền kề và chồng lấn.

### T11 — Ghi nhận lượt đặt và chống ghi nhận lặp

**Ưu tiên** P0 · **Tiên quyết** T07, T10, phần Q-02/Q-03/Q-07/Q-15 liên quan ghi đặt đã chốt · **Đầu vào** DTO, ngữ cảnh xác thực, ma trận trạng thái và fixture cạnh tranh.

**Mục tiêu** — Tạo lượt đặt và cam kết chỗ đúng lúc, an toàn với gửi đồng thời hoặc gửi lại.

- [ ] Tạo migration lượt đặt, liên hệ, phân bổ bàn và khóa thao tác. Cài ràng buộc khoảng hoạt động theo T04. Quyền xem mã và chi tiết lấy từ ngữ cảnh xác minh.
- [ ] Triển khai `POST /reservations`. Trong transaction, xử lý khóa thao tác, kiểm lại khả dụng tại điểm giữ/cam kết, ghi trạng thái hợp lệ, kết quả và audit. Tách việc ghi nhận yêu cầu và cam kết nếu Q-03 quy định hai mốc. Mọi điều kiện bắt buộc về món/cọc gắn vào lệnh chuyển trạng thái chung và hoàn tất cùng T13/T18/T22.
- [ ] Dùng hai kết nối DB thật để thử cạnh tranh chỗ cuối qua hai kênh và hai giờ khởi đầu chồng nhau. Thử mất phản hồi sau commit, cùng khóa/cùng dữ liệu, cùng khóa/khác dữ liệu, hai ý định độc lập và khôi phục theo Q-15.

**Đầu ra** — Lệnh đặt chỗ dùng chung, API và integration test cho AC-03, AC-04, AC-18.

**Checklist nghiệm thu**

- [ ] Chỉ một cam kết có hiệu lực cho tài nguyên xung đột. Trạng thái chờ được giữ đúng chính sách.
- [ ] Gửi lại cùng ý định trả kết quả xác minh được cho chủ thể hợp lệ. Ý định khác được đánh giá theo tình trạng thực tế.

### T12 — Giao diện đặt bàn qua web

**Ưu tiên** P0 · **Tiên quyết** T08, T10, T11, chốt phần nhập/xác minh ở Q-07 · **Đầu vào** Prototype, danh mục khung, hợp đồng lỗi và tình trạng.

**Mục tiêu** — Khách tra cứu, chuẩn bị và gửi ý định đặt bàn với phản hồi rõ ràng.

- [ ] Dựng form ngày/khung/số khách và thông tin yêu cầu. Nối tra cứu, xác nhận dữ liệu, sinh khóa thao tác trong phiên và gọi API đúng bước. Giữ dữ liệu hợp lệ khi đổi khung sau xung đột.
- [ ] Hiển thị kết quả đúng quyền và trạng thái, bước tiếp theo theo Q-03/Q-05. Chuẩn bị điểm nối món/cọc; T22 hoàn tất luồng ghép và mọi điều kiện cam kết.
- [ ] Thử thời gian đã qua, khung vừa hết, lỗi trường, bấm gửi lặp, timeout sau ghi và cách tiếp tục được duyệt. Dùng cả mobile và bàn phím.

**Đầu ra** — `apps/web/src/features/booking/`, kết quả đặt và component test/E2E cho lát cắt web.

**Checklist nghiệm thu**

- [ ] Mã, giờ, số khách và trạng thái khớp API. Form có trạng thái đầu vào thiếu và xung đột.
- [ ] Trạng thái chỉ xác nhận khi API xác nhận. Chỗ cần món/cọc được trình bày là bước tiếp theo hoặc điều kiện ghi theo chính sách.

### T13 — Đặt món trước và kiểm tra giá/khả dụng

**Ưu tiên** P0 · **Tiên quyết** T09, T11, T12, chốt Q-05/Q-09 · **Đầu vào** Thực đơn, dữ liệu lượt đặt, quy tắc giá, giới hạn và thời điểm khóa.

**Mục tiêu** — Ghi danh sách món đúng lượt và giữ khả năng đối chiếu khi thực đơn thay đổi.

- [ ] Tạo `preorder_lines` và quy tắc số lượng, kiểm tra tại thời điểm ghi, lưu tham chiếu/snapshot theo Q-05. Thực thi chính sách ghi từng phần hoặc cả danh sách trong giao dịch; dùng phiên bản để phát hiện chỉnh sửa đồng thời khi áp dụng.
- [ ] Nối UI chọn món, số lượng, ghi chú và phản hồi món sai/hết. Nếu chính sách thu món ở bước tạo lượt, phối hợp lệnh tạo/ghi món theo ranh giới giao dịch đã chốt và dùng cùng quy tắc kiểm tra.
- [ ] Thử món ngừng nhận, giá đổi khi form đang mở, số lượng sai, yêu cầu quá hạn và người khác sửa/ghi vào lượt.

**Đầu ra** — Module `preorders`, giao diện chọn món, hợp đồng PUT và test AC-05.

**Checklist nghiệm thu**

- [ ] Danh sách đã ghi khớp lượt, số lượng và giá áp dụng nếu dùng; các dòng cần sửa có lý do.
- [ ] Đọc lại lượt có dữ liệu đối chiếu đúng sau thay đổi của thực đơn. Cách phối hợp luồng chính đã chuyển sang T22.

### T14 — Sơ đồ bàn, phân bàn và đổi bố trí

**Ưu tiên** P0 · **Tiên quyết** T07, T10, T11, chốt phần bố trí của Q-02/Q-03/Q-08 · **Đầu vào** Sơ đồ thực tế, thuật toán khả dụng, quyền điều phối.

**Mục tiêu** — Hiển thị tình trạng theo khung và ghi bố trí nhất quán.

- [ ] Dựng endpoint và giao diện sơ đồ theo ngày/khung/vùng. Dữ liệu hiển thị có mã bàn, sức chứa và trạng thái trong quyền điều phối. Có danh sách hoặc lựa chọn bàn truy cập bằng bàn phím.
- [ ] Triển khai ghi phân bàn dưới cùng khóa/giao dịch đặt chỗ. Kiểm tra lượt, khoảng sử dụng, bàn hợp lệ và sức chứa/tổ hợp, ghi audit. Nếu đổi thất bại, giữ phương án đang hiệu lực.
- [ ] Thử sơ đồ cùng bàn ở hai khung, phương án thiếu sức chứa và phân đồng thời với một thao tác tiếp nhận cam kết. Thử lỗi giữa lần đổi nhiều bàn để xác nhận transaction phục hồi. T22 chạy lại với cọc đã tích hợp.

**Đầu ra** — Module `floorplan`, giao diện sơ đồ và integration test AC-04, AC-10, AC-11.

**Checklist nghiệm thu**

- [ ] Dữ liệu sơ đồ và chi tiết/API bố trí thống nhất. Phương án xung đột bị từ chối có lý do.
- [ ] Các thay đổi có audit và kết quả nhất quán khi lỗi hoặc có thao tác cạnh tranh.

### T15 — Quản lý đặt chỗ và ghi nhận phục vụ

**Ưu tiên** P0 · **Tiên quyết** T07, T11, T13, T14, chốt phần vận hành của Q-06/Q-08 · **Đầu vào** Ma trận trạng thái, quyền và dữ liệu liên quan lượt đặt.

**Mục tiêu** — Nhân sự quản lý đọc đúng phạm vi và ghi kết quả đã đến, hoàn thành hoặc không đến theo chính sách.

- [ ] Xây danh sách theo ngày/khung, tra mã và trang chi tiết gồm kênh, bàn, món, cọc theo projection quyền. Ghi tình trạng chờ nếu nghiệp vụ còn bước chưa hoàn thành.
- [ ] Tạo lệnh sự kiện phục vụ kiểm quyền, trạng thái nguồn và mốc xác định không đến. Cập nhật hiệu lực bàn/món/cọc theo luật đã duyệt và nối hạch toán/đối chiếu cọc tại T18.
- [ ] Thử đến đúng/trễ, kết luận không đến trước/sau mốc, lệnh lặp, sai quyền và sửa kết quả nếu quy trình cho phép.

**Đầu ra** — Module `operations`, màn hình quản lý, sự kiện vận hành và test AC-12/AC-13.

**Checklist nghiệm thu**

- [ ] Quản lý xem được nguồn web/chat, dữ liệu rỗng/lỗi/thiếu quyền cho phản hồi tương ứng.
- [ ] Kết quả phục vụ theo đúng mốc, có lịch sử, và ảnh hưởng sang cọc được xác minh đầy đủ ở T18/T22.

### T16 — Danh sách chuẩn bị bếp và phát hiện thay đổi

**Ưu tiên** P1 · **Tiên quyết** T13, T15, chốt điểm giao bếp Q-05/Q-08 · **Đầu vào** Lượt và món đủ điều kiện, mẫu kênh giao bếp đã duyệt.

**Mục tiêu** — Người phụ trách nhận thông tin đúng khung và biết thay đổi ảnh hưởng đến việc chuẩn bị.

- [ ] Tạo truy vấn món theo khung, số lượng, ghi chú và ngưỡng đủ điều kiện, giới hạn dữ liệu theo quyền. Chọn giao diện quản lý chuyển bếp hoặc giao diện bếp riêng theo Q-08.
- [ ] Ghi phiên bản hoặc tham chiếu lần giao nếu cần đối chiếu thay đổi theo Q-05. Chỉ ra món thêm, bỏ hoặc đổi sau khi đã chuyển.
- [ ] Thử lượt chưa đủ điều kiện, món thay đổi sau điểm chốt và quyền bếp đọc dữ liệu giới hạn.

**Đầu ra** — Phần `kitchen` ở API/web hoặc màn hình điều phối đã duyệt, bằng chứng AC-06.

**Checklist nghiệm thu**

- [ ] Dữ liệu chuẩn bị đúng theo khung và danh sách món có hiệu lực.
- [ ] Người phụ trách thấy khác biệt cần xử lý, phạm vi thông tin liên hệ và cọc tuân theo quyền.

### T17 — Tạo yêu cầu cọc và hiển thị VietQR

**Ưu tiên** P0 · **Tiên quyết** T11, T12, chốt phần tính cọc, thông tin nhận và cấp QR của Q-03/Q-04 · **Đầu vào** Quy tắc cọc, thông tin nhận tiền và hợp đồng adapter đã xác nhận.

**Mục tiêu** — Khách có thông tin chuyển cọc đúng lượt và thấy trạng thái chờ phù hợp.

- [ ] Tạo `deposit_requests`, lệnh tính số tiền theo server, tham chiếu đối chiếu và thời hạn. Đặt khóa thao tác cho yêu cầu QR và xử lý chạy lại.
- [ ] Nối adapter VietQR và màn hình cọc. Kiểm người nhận, số tiền, tham chiếu, hạn và hiển thị tình trạng hiện hành. Hạn chế truy cập yêu cầu cọc theo quyền vào lượt và lược bớt dữ liệu hiển thị.
- [ ] Thử cọc bắt buộc/tình huống miễn nếu có, yêu cầu lặp, QR lỗi/hết hiệu lực và quay lại xem trạng thái. Tách cấp QR và xác minh giao dịch.

**Đầu ra** — Module `deposits`, adapter QR, UI và contract/test AC-07.

**Checklist nghiệm thu**

- [ ] QR thử nghiệm đối chiếu được người nhận, số tiền và tham chiếu. Trạng thái còn chờ khi chưa có bằng chứng.
- [ ] Khi adapter lỗi, khách thấy hướng xử lý và dữ liệu đang chờ vẫn tra được trong phạm vi quyền.

### T18 — Đối chiếu tiền cọc, ngoại lệ và đồng bộ giữ bàn

**Ưu tiên** P0 · **Tiên quyết** T11, T14, T15, T17, chốt Q-03/Q-04/Q-06/Q-08 liên quan · **Đầu vào** Nguồn chứng cứ, quyền xử lý, trạng thái cọc và quy tắc hạn.

**Mục tiêu** — Ghi nhận giao dịch có thể kiểm chứng và xử lý sai lệch mà vẫn giữ bố trí đúng.

- [ ] Tạo `payment_transactions` và `payment_matches` với khóa duy nhất theo nguồn. Nối giao diện đối chiếu thủ công hoặc luồng tự động đúng phương án đã duyệt. Nếu có webhook, xác thực sự kiện theo nhà cung cấp và xử lý sự kiện gửi lại hoặc đến lệch thứ tự.
- [ ] Ghi bằng chứng và kết quả xác minh bền vững. Dùng cùng khóa đặt chỗ để đánh giá điều kiện xác nhận, trả chỗ hoặc giữ trạng thái đang chờ. Dùng tác vụ hết hạn chạy lại an toàn nếu cần. Tiền nhận trễ vẫn truy được ngay cả khi không còn chỗ.
- [ ] Triển khai danh sách chờ đối chiếu, nhánh sai mã, thiếu/thừa, trùng và tiền đến trễ. Ghi kết quả hoàn/bù trừ/chuyển/giữ cọc theo chính sách đã duyệt và quyền tương ứng.
- [ ] Thử gửi lại bằng chứng, gián đoạn khi đối chiếu, đúng tiền trễ sau khi bàn đã cấp, và sự kiện phục vụ tác động cọc theo Q-06.

**Đầu ra** — API/UI đối chiếu, trạng thái cọc và audit nối với đặt chỗ, test AC-08, AC-09, AC-13, AC-18.

**Checklist nghiệm thu**

- [ ] Một giao dịch cùng định danh có một hiệu lực. Tiền sai/đến trễ hiện đúng tình trạng và chứng cứ.
- [ ] Cam kết đang hiệu lực được bảo toàn khi cọc đến trễ. Nếu quy trình cho phép thử xác nhận lại, kết quả dùng khả dụng mới nhất.

### T19 — Báo cáo theo kỳ và định nghĩa chỉ số

**Ưu tiên** P1 · **Tiên quyết** T15, T18, chốt Q-10 · **Đầu vào** Công thức, bộ lọc, quyền và fixture tính tay.

**Mục tiêu** — Quản lý xem chỉ số đặt chỗ đã duyệt với cách đếm tái lập.

- [ ] Xây truy vấn tổng hợp từ lượt, sự kiện phục vụ và khoản cọc. Phân kỳ theo mốc và múi giờ đã duyệt; gom theo đơn vị đếm trước khi nối bảng nhiều dòng để tránh nhân bản.
- [ ] Tạo giao diện kỳ/chỉ số/bộ lọc trong phạm vi. Thể hiện đơn vị, trạng thái trống, lỗi và cách trình bày mẫu số bằng 0 nếu dùng tỷ lệ.
- [ ] Đối chiếu với fixture tính tay gồm lượt nhiều món/nhiều giao dịch, biên đổi ngày và nhóm trạng thái bị loại.

**Đầu ra** — Module `reports`, màn hình báo cáo, định nghĩa và test AC-14.

**Checklist nghiệm thu**

- [ ] Các chỉ số đúng kỳ, mẫu số, trạng thái và đơn vị đã duyệt. Kỳ trống phân biệt được lỗi.
- [ ] Báo cáo chỉ truy cập được từ quyền thích hợp và có bằng chứng so với kết quả tính tay.

### T20 — Tích hợp Groq và tư vấn món theo thực đơn

**Ưu tiên** P0 · **Tiên quyết** T03, T08, T09, chốt phạm vi dữ liệu Q-07/Q-11 · **Đầu vào** Nguồn món công bố, tài khoản Groq, mẫu hỏi và chính sách dữ liệu.

**Mục tiêu** — Chatbot trả gợi ý món dựa trên dữ liệu nhà hàng và có đường tiếp tục khi lỗi.

- [ ] Tạo adapter Groq server-side, cấu hình model qua môi trường, giới hạn kích thước hội thoại, timeout và xử lý quota. Kiểm tra quota/model thực tế bằng lượt thử có kiểm soát và ghi bằng chứng đã che dữ liệu.
- [ ] Đưa vào ngữ cảnh thực đơn công bố, xác minh mã món/giá/tình trạng trả ra trước khi hiển thị và xử lý câu hỏi thiếu căn cứ về thành phần/dị ứng. Giới hạn dữ liệu gửi và lưu theo Q.
- [ ] Dựng `POST /chat/messages` và cửa sổ chat, thông báo lỗi/giới hạn và đường về menu hoặc đặt bàn web. Dùng adapter giả trong CI, ca thử dịch vụ thật riêng ở T26.

**Đầu ra** — Module `chat`, giao diện hội thoại, tập câu hỏi/đáp án có căn cứ và test AC-15/AC-17.

**Checklist nghiệm thu**

- [ ] Gợi ý truy về món có trong thực đơn. Dữ liệu chưa biết được thể hiện đúng.
- [ ] Gián đoạn Groq hiện thông báo và giữ đường đặt qua web. Khóa và dữ liệu riêng nằm phía server.

### T21 — Đặt bàn qua chatbot ở MVP

**Ưu tiên** P0 · **Tiên quyết** T10, T11, T12, T15, T20 và chốt Q-11/Q-15 cùng phần Q-07 áp dụng · **Đầu vào** Ranh giới chat, dữ liệu cần thu, cơ chế xác nhận và tiếp tục kênh.

**Mục tiêu** — Hoàn thành kịch bản đặt chỗ xuất phát từ chat với kết quả nghiệp vụ đối chiếu được.

- [ ] Dùng AI nhận diện nhu cầu và lấy dữ liệu cấu trúc; phía server kiểm tra còn thiếu, mơ hồ và chuẩn hóa giờ. Cấp bước xác nhận có ngữ cảnh cho khách, ngay trong chat hoặc chuyển kênh theo Q-11 đã duyệt.
- [ ] Cho thao tác xác nhận đi qua cùng lệnh tạo đặt chỗ của T11; lưu/tra tham chiếu ý định theo Q-15. React hiển thị mã/trạng thái lấy từ API. Cài xử lý khung hết, phản hồi mất và đường tiếp tục web.
- [ ] Thử câu giờ mơ hồ, dữ liệu chat không hợp lệ, khách xác nhận lặp, cạnh tranh với web và lỗi sau ghi. Đối chiếu cùng lượt trong màn hình T15.

**Đầu ra** — Điều phối ý định đặt bàn, bước xác nhận, kết quả xuyên kênh và test AC-04, AC-16, AC-18.

**Checklist nghiệm thu**

- [ ] Kịch bản bắt đầu trong chat sinh được lượt thật qua luồng đã duyệt, đúng mã/khung/số khách/trạng thái.
- [ ] AI phản ánh kết quả API và hỏi lại dữ liệu thiếu. Trường hợp lỗi hoặc gửi lại tuân theo trạng thái thực và quyền.

### T22 — Tích hợp toàn bộ luồng MVP và kiểm thử xuyên module

**Ưu tiên** P0 · **Tiên quyết** T09 đến T21 và T29, chính sách MVP dùng trong kịch bản đã chốt · **Đầu vào** Các lát cắt, fixture và ma trận AC.

**Mục tiêu** — Hoàn tất các bước liên miền và xác nhận một lượt đặt đi đúng quy trình đến báo cáo.

- [ ] Nối luồng web/chat, món, cọc theo các mốc xác nhận đã duyệt. Bảo đảm các điều kiện món/cọc bắt buộc nằm ở lệnh kiểm tra chung. Kiểm tra audit và đồng bộ lại UI sau ghi.
- [ ] Viết Playwright cho đặt bàn web và chat, quản lý thực đơn, chọn món, cọc, sơ đồ, phục vụ, bếp, báo cáo. Dùng DB thật và adapter giả xác định được kết quả, tách kiểm tích hợp thật ở T26. Kiểm đổi giá/công bố món và đối chiếu snapshot của lượt trước đó.
- [ ] Chạy integration test tranh chỗ cuối ở đúng mốc cam kết, đổi bàn lỗi, mất phản hồi sau commit, QR chưa xác minh, mất dữ liệu phản hồi đối chiếu và khoản cọc trễ sau khi bàn đã cấp.

**Đầu ra** — Các luồng hoàn chỉnh, `tests/e2e/` và báo cáo bằng chứng M2.

**Checklist nghiệm thu**

- [ ] AC-01 đến AC-16, AC-18 và AC-20a có ca kiểm tương ứng. Các ca áp dụng trong fixture đạt kết quả và có mã tham chiếu đối chiếu.
- [ ] Tất cả kênh dùng đúng quyền và cùng nguồn trạng thái. CI tái hiện được từ dữ liệu thử độc lập.

## 7. G3 — Kiểm thử phát hành, triển khai và vận hành

### T23 — Rà soát bảo mật và dữ liệu trước phát hành

**Ưu tiên** P0 · **Tiên quyết** T07, T18, T20, T21, T22 và chốt phần dữ liệu của Q-07/Q-11/Q-14 · **Đầu vào** Ma trận quyền, sơ đồ tin cậy, endpoint và chính sách lưu dữ liệu.

**Mục tiêu** — Bảo vệ dữ liệu khách, giao dịch, phiên và tích hợp trên toàn MVP.

- [ ] Kiểm lại quyền theo đối tượng và vai trò ở mọi API, kể cả endpoint chat, cọc, audit và báo cáo. Rà kiểm tra đầu vào, SQL tham số, escape nội dung, session/CSRF, giới hạn kích thước và tần suất, cấu hình header/TLS.
- [ ] Kiểm dữ liệu public, OpenAPI production, artefact build, log và trace. Áp dụng redaction, quyền đọc log, thời hạn lưu và kế hoạch thu hồi bí mật. Nếu có webhook, kiểm theo chuẩn xác thực của nguồn đã chọn và bằng chứng chống ghi lặp.
- [ ] Chạy kiểm tra phụ thuộc, bí mật và container. Kiểm thử phòng vệ trên môi trường được phép, ghi kết quả từ chối và khắc phục vấn đề. Rà quyền gửi dữ liệu sang LLM và giới hạn đầu vào chatbot.

**Đầu ra** — Checklist `docs/qa/security.md`, test từ chối quyền, bằng chứng kiểm tra và trạng thái xử lý vấn đề.

**Checklist nghiệm thu**

- [ ] Người dùng chỉ thấy dữ liệu được cấp. Mã tham chiếu, hết phiên hoặc thao tác lặp không làm vượt quyền. Bí mật và dữ liệu nhạy cảm không xuất hiện trong các đầu ra công khai kiểm tra.
- [ ] Vấn đề nghiêm trọng ảnh hưởng đến quyền, tiền, toàn vẹn lượt hoặc lộ dữ liệu được khắc phục và kiểm lại trước phát hành. Các rủi ro còn lại có người sở hữu và quyết định.

### T24 — Đo hiệu năng, lỗi tích hợp và diễn tập khôi phục

**Ưu tiên** P0 · **Tiên quyết** T22, T23, ngưỡng và tiêu chí Q-14 đã chốt · **Đầu vào** Profile tải, mục tiêu phản hồi, RPO/RTO nếu có, hành vi lỗi và dữ liệu thử.

**Mục tiêu** — Kiểm chứng tính khả dụng, khả năng thoát lỗi và kết quả phục hồi theo tiêu chí đo được.

- [ ] Chạy thử tải trong môi trường kiểm soát gần production với k6 cho menu, khả dụng, nộp lượt và chat. Đo độ trễ, lỗi, kích thước dữ liệu, pool/khóa DB và thời gian phụ thuộc. Tách kết quả mô phỏng nhà cung cấp và lần kiểm tra thật có tải được phép.
- [ ] Mô phỏng timeout, lỗi/quota Groq, gián đoạn QR/đối chiếu và mất phản hồi sau commit. Sau phục hồi, xác minh đường web, trạng thái chờ và thao tác gửi lại.
- [ ] Diễn tập backup/restore trên DB tách biệt, kiểm dữ liệu lượt/cọc đã ghi, xác định các giao dịch đang chờ, đối chiếu khoản tiền thực nhận với nguồn ngoài sau phục hồi và ghi thời gian thực đo.

**Đầu ra** — `tests/load/`, báo cáo hiệu năng, minh chứng khôi phục và hướng dẫn diễn tập. T26 kiểm tra lại trên hạ tầng staging.

**Checklist nghiệm thu**

- [ ] Kết quả được so theo ngưỡng đã duyệt và ghi rõ môi trường/mức tải. Trường hợp vượt ngưỡng có kết quả sửa và đo lại hoặc quyết định phát hành tương ứng.
- [ ] Tìm lại được mã lượt, tình trạng cọc và bằng chứng. Luồng lỗi không tạo cam kết hoặc ghi nhận cọc lặp.

### T25 — Chuẩn bị hạ tầng, staging và pipeline phát hành

**Ưu tiên** P0 · **Tiên quyết** T05, T06, T23, T24, có hạ tầng và quyền đã duyệt · **Đầu vào** ADR hosting, DNS/TLS, kết quả diễn tập, tài khoản triển khai.

**Mục tiêu** — Tạo đường triển khai có kiểm soát từ cùng artifact đã chạy CI.

- [ ] Đóng gói web và API bằng image có tag theo commit và ghi digest vào GHCR. Cấu hình Compose, Caddy có HTTPS, điều hướng SPA và chuyển tiếp `/api/v1`. Giữ API/DB trên mạng hạn chế, tách cấu hình và bí mật từng môi trường.
- [ ] Chuẩn bị DB staging/production, quyền migrate và chạy ứng dụng, kiểm extension, DNS/TLS, cấu hình backup và health/readiness. Kiểm tra connectivity với IdP/Groq/VietQR. Readiness kiểm được nền DB/schema; sự cố Groq riêng không làm ngừng luồng web.
- [ ] Tạo pipeline có bước duyệt production, migrate chạy một lần, smoke test, lưu bằng chứng và quay về digest trước. Chuẩn bị migration tương thích lùi theo từng bước, ghi rõ phương án sửa tiến hoặc quay bản cũ nếu có thay đổi schema.
- [ ] Đặt logging theo mã truy vết, số liệu request/DB, tranh chỗ, backlog đối chiếu và quota chat; thiết lập giám sát, ngưỡng và người nhận cảnh báo theo Q-14.

**Đầu ra** — `infra/`, pipeline release, staging, cấu hình tách môi trường và runbook triển khai.

**Checklist nghiệm thu**

- [ ] Staging chạy qua HTTPS, kết nối DB đúng quyền, image có digest và bước migrate/health được kiểm chứng.
- [ ] Thử rollback bản ứng dụng và tình huống migration thất bại trên staging. Có đường khôi phục hoặc sửa tiến bảo toàn giao dịch mới.

### T26 — Nghiệm thu release candidate trên staging

**Ưu tiên** P0 · **Tiên quyết** T22 đến T25, chốt quy trình dùng thử và dữ liệu Q-14 · **Đầu vào** Release candidate, kịch bản AC, dữ liệu staging và tài khoản kiểm thử thực tế.

**Mục tiêu** — Chứng minh MVP sẵn sàng phát hành với artifact và cấu hình tương đương production.

- [ ] Nạp dữ liệu dùng thử đã duyệt, rà bảng/lịch/menu và quyền. Chạy hồi quy API, UI, Playwright, smoke mobile/desktop, giới hạn và kịch bản ngoài giờ phục vụ.
- [ ] Kiểm Groq thật và VietQR theo cấu hình được phép. Xác minh QR, nguồn đối chiếu và đầu ra khi gián đoạn. Nếu chỉ duyệt dữ liệu/giao dịch thử, ghi phương thức và giới hạn chứng cứ trong biên bản.
- [ ] Đo lại những chỉ tiêu Q-14 trên staging, kiểm khả năng phục hồi và chạy thử kịch bản bàn giao với người phụ trách đơn vị.
- [ ] Lập biên bản gồm kết quả AC, rủi ro còn lại, cửa sổ phát hành, người trực, kế hoạch rollback và lệnh kiểm sau phát hành theo runbook.

**Đầu ra** — Ma trận kết quả, biên bản M3, digest được chọn, danh sách dữ liệu và cấu hình release.

**Checklist nghiệm thu**

- [ ] AC-01 đến AC-18 và AC-20a đạt trong phạm vi áp dụng. AC-19 được diễn tập trên staging và sẵn dữ liệu/kịch bản để xác minh trên URL công khai.
- [ ] Không còn lỗi chặn trong các luồng bắt buộc. Có bằng chứng cho cả Groq và hướng xác minh VietQR đã chốt.

### T27 — Phát hành production và dùng thử tại nhà hàng

**Ưu tiên** P0 · **Tiên quyết** T26, sẵn sàng DNS/backup và lịch dùng thử đã duyệt · **Đầu vào** Digest đã nghiệm thu, cấu hình production, dữ liệu chính thức và runbook.

**Mục tiêu** — Đưa đúng bản lên URL công khai và xác minh hoạt động thực tế cùng nhà hàng.

- [ ] Kiểm trước phát hành tên miền, chứng chỉ, backup, bí mật, DB/schema, nguồn tích hợp và người trực. Chạy migration tương thích, nhập dữ liệu hợp lệ và triển khai đúng digest. Nếu migration hoặc health thất bại, dừng phát hành tiếp và chạy nhánh runbook.
- [ ] Chạy smoke qua đường dẫn công khai và kiểm quản lý theo quyền. Thử ngoài giờ phục vụ, toàn bộ luồng MVP và hai nhánh chatbot. Dùng cấu hình và dữ liệu giao dịch đã duyệt. Ghi mã tham chiếu để đối chiếu.
- [ ] Dùng thử tại đơn vị, ghi phản hồi, xuất biên bản AC-19 và theo dõi lỗi. Nếu phát hiện lỗi nghiêm trọng, cô lập phần bị ảnh hưởng theo runbook, đối chiếu lượt/cọc đang chờ rồi quay artifact tương thích hoặc sửa tiến.

**Đầu ra** — URL production, phiên bản phát hành, bằng chứng dùng thử và biên bản AC-19.

**Checklist nghiệm thu**

- [ ] Đường dẫn công khai phục vụ đủ MVP và chatbot. Khách và quản lý đã thử kịch bản, dữ liệu chính và kết quả khớp.
- [ ] Health, mẫu giao dịch, cảnh báo và truy xuất audit qua smoke đều xác nhận được. Tình huống cần quay bản có quyết định bảo toàn dữ liệu viết sau mốc backup.

### T28 — Ổn định sau phát hành và bàn giao vận hành

**Ưu tiên** P0 · **Tiên quyết** T27 · **Đầu vào** Biên bản dùng thử, số liệu sau phát hành, backlog lỗi và quy trình hỗ trợ.

**Mục tiêu** — Đơn vị tiếp quản được quy trình đặt, đối chiếu, phục hồi và bảo trì.

- [ ] Theo dõi kênh tiếp nhận và trạng thái chờ trong cửa sổ ổn định đã duyệt. Kiểm lỗi, latency, khóa DB, quota Groq, khoản chưa đối chiếu và kết quả khôi phục/backup.
- [ ] Đối chiếu mẫu lượt và cọc với đơn vị. Phân loại phản hồi thành lỗi, thay đổi chính sách và yêu cầu mới. Xử lý sự cố theo runbook và chạy lại AC bị ảnh hưởng.
- [ ] Bàn giao tài khoản theo quyền, SOP, hướng dẫn liên hệ hỗ trợ, backup/restore và danh mục bằng chứng Jira/GitHub/MS Project. Gắn với D01–D27 khi có danh mục.

**Đầu ra** — `docs/runbooks/`, sổ vận hành, báo cáo ổn định và biên bản bàn giao M4.

**Checklist nghiệm thu**

- [ ] Đơn vị tìm được lượt, giải quyết cọc chờ theo SOP và biết đầu mối sự cố. Bản release, URL và bằng chứng truy xuất được.
- [ ] Có dấu hiệu nhận biết mức ổn định đã duyệt và danh sách vấn đề tồn đọng có người phụ trách.

## 8. G4 — Tùy chọn và mức Tốt sau MVP

### T30 — Khách truy cập lại và yêu cầu thay đổi nếu duyệt

**Ưu tiên** P2 · **Tiên quyết** T28, chốt Q-06/Q-07/Q-08 và duyệt UC-05 · **Đầu vào** Phương thức xác minh, giới hạn quyền và kênh tiếp nhận.

**Mục tiêu** — Cho khách truy cập đúng lượt và gửi yêu cầu còn hiệu lực.

- [ ] Mở luồng xác minh để đọc lượt trong phạm vi mới, chọn dữ liệu tối thiểu và bổ sung route yêu cầu thay đổi nếu được duyệt.
- [ ] Ghi yêu cầu với mốc thời gian, lý do nếu có và trạng thái tiếp nhận. Chuyển qua kênh xử lý đã duyệt. Khi T31 được chọn, dùng cùng hợp đồng yêu cầu.
- [ ] Thử sai mã/thiếu quyền, yêu cầu quá hạn và gửi lặp.

**Đầu ra** — API/UI tra cứu và gửi yêu cầu, test AC-20b.

**Checklist nghiệm thu**

- [ ] Khách đủ quyền thấy đúng lượt và gửi được yêu cầu hợp lệ. Khách khác không đọc được dữ liệu hoặc kết quả của lượt.

### T31 — Xử lý đổi hoặc hủy từ quản lý nếu duyệt

**Ưu tiên** P2 · **Tiên quyết** T28, chốt Q-05/Q-06/Q-08 và duyệt UC-15, T30 nếu dùng yêu cầu từ web · **Đầu vào** Chính sách đổi/hủy, tình trạng bàn, món, cọc.

**Mục tiêu** — Quản lý thực hiện thay đổi với dữ liệu liên miền nhất quán.

- [ ] Thêm lệnh đổi/hủy có quyền, điều kiện trạng thái và cập nhật bằng khóa chung đặt chỗ. Tái kiểm khả dụng cho khung mới và ghi audit.
- [ ] Nối cập nhật món/bếp và quyết định cọc. Bảo toàn bố trí cũ nếu đổi thất bại. Hiển thị phần đang chờ khi có bước đối chiếu bên ngoài.
- [ ] Thử đổi sang khung kín, xử lý sau khi bếp nhận món và hủy có tác động cọc.

**Đầu ra** — Công cụ đổi/hủy, cập nhật liên miền và test AC-20c.

**Checklist nghiệm thu**

- [ ] Kết quả đúng với chính sách cho tất cả dữ liệu liên quan. Khi khung mới hết, bố trí hiện hữu giữ hiệu lực.

### T32 — Đặt tiệc và sự kiện ở mức Tốt

**Ưu tiên** P2 · **Tiên quyết** T28, mục tiêu Tốt được duyệt, chốt Q-12 · **Đầu vào** Bộ trường, vòng đời yêu cầu, cách dùng tài nguyên và quy tắc cọc tiệc nếu có.

**Mục tiêu** — Nhận yêu cầu tổ chức sự kiện và để quản lý xử lý theo chính sách.

- [ ] Tạo module `events`, migration, API tạo/tra và form khách cùng danh sách quản lý. Áp dụng phân quyền liên hệ, trạng thái đúng quy trình và audit.
- [ ] Khi có cam kết bàn/khu, dùng khóa và kiểm xung đột của `booking`. Tích hợp báo giá/cọc chỉ theo phạm vi Q-12. Phân biệt đã nhận yêu cầu và xác nhận tổ chức.
- [ ] Thử thiếu thông tin, vượt sức chứa, và tranh tài nguyên với lượt đặt thường nếu dùng chung.

**Đầu ra** — Tính năng tiệc/sự kiện, hợp đồng, migration và test AC-21a.

**Checklist nghiệm thu**

- [ ] Khách nhận được mã, quản lý có thể xử lý và trạng thái cập nhật đúng. Không cam kết trùng tài nguyên.

### T33 — Đánh giá nhà hàng ở mức Tốt

**Ưu tiên** P2 · **Tiên quyết** T28, mục tiêu Tốt được duyệt, chốt Q-13 · **Đầu vào** Điều kiện gửi, thang điểm, quyền duyệt và chính sách hiển thị.

**Mục tiêu** — Nhận đánh giá hợp lệ và công bố theo chính sách nhà hàng.

- [ ] Tạo module `reviews`, migration, endpoint, biểu mẫu và projection hiển thị. Nếu Q-13 yêu cầu lượt đã phục vụ hoặc số lần tối đa, kiểm tính hợp lệ và ràng buộc trùng theo đúng đơn vị.
- [ ] Áp dụng quyền và luồng duyệt nếu có, hiển thị nội dung an toàn và tránh lộ thông tin khách.
- [ ] Thử người đủ/thiếu điều kiện, gửi lặp và nội dung ở trạng thái chưa công bố.

**Đầu ra** — Tính năng đánh giá, quy trình duyệt nếu có và test AC-21b.

**Checklist nghiệm thu**

- [ ] Kết quả tiếp nhận, giới hạn gửi và hiển thị theo Q-13. Tình huống sai quyền/gửi trùng có kết quả đúng.

### T34 — Chatbot thao tác API qua tool calling ở mức Tốt

**Ưu tiên** P2 · **Tiên quyết** T28, mục tiêu Tốt được duyệt, chốt danh sách quyền và thao tác Q-11 · **Đầu vào** OpenAPI ổn định, model Groq hỗ trợ, quyền và yêu cầu xác nhận.

**Mục tiêu** — Chatbot gọi đúng API nghiệp vụ được duyệt và phản hồi dựa trên kết quả thực.

- [ ] Tạo danh sách tool có tên, schema đầu vào và mapping tới operation ID được cấp. Triển khai dispatcher server gọi API nghiệp vụ hiện hành qua biên có xác thực, truyền phạm vi phiên/ngữ cảnh của khách. Danh sách không cấp quyền nhân sự cho chatbot.
- [ ] Kiểm đối số, phạm vi quyền, bước xác nhận ghi và khóa thao tác ở server. Nếu mất phản hồi, phục hồi kết quả trước khi thử lại. Gắn trace giữa lời gọi tool, kết quả API và phản hồi chat sau khi lược dữ liệu nhạy cảm.
- [ ] Kiểm thử hợp đồng với adapter giả và xác minh tool call thật bằng Groq ở staging. Thử tool ngoài danh sách, sai quyền, kết quả không hợp lệ và timeout, để hệ thống trả trạng thái có thể xác minh. [Groq Local Tool Calling](https://console.groq.com/docs/tool-use/local-tool-calling).

**Đầu ra** — Tool dispatcher, hợp đồng quyền, bằng chứng gọi API thật và test AC-21c.

**Checklist nghiệm thu**

- [ ] Thao tác được duyệt có trace liên kết tới API và kết quả nghiệp vụ. Tool lỗi hoặc không được cấp quyền trả phản hồi tương ứng.
- [ ] Hồi quy đặt bàn qua web và MVP chat vẫn dùng chung quy tắc, dữ liệu và trạng thái.

### T35 — Nghiệm thu và phát hành bản nâng cao

**Ưu tiên** P2 · **Tiên quyết** T28 và các task G4 đã chọn. Nếu chọn mức Tốt thì cần đủ T32, T33, T34 · **Đầu vào** Phạm vi đã duyệt, migration, runbook và kết quả AC.

**Mục tiêu** — Phát hành riêng tính năng nâng cao với đường hồi quy và khôi phục.

- [ ] Trên staging, chạy AC-20b/20c theo chức năng đã duyệt hoặc cả ba AC-21 khi chọn mức Tốt. Chạy lại AC-01 đến AC-19 và AC-20a có liên quan cùng hồi quy luồng cốt lõi. Kiểm tra migration dùng dữ liệu hiện hữu.
- [ ] Rà phân quyền, độ tương thích và phương án tắt tính năng hoặc quay phiên bản khi phù hợp. Dùng lại quy trình artifact, migrate, smoke và bàn giao của T25–T28.
- [ ] Cập nhật ma trận truy vết, tài liệu tác nghiệp, ghi biên bản và phiên bản phát hành M5.

**Đầu ra** — Release nâng cao và bằng chứng AC theo phạm vi chọn.

**Checklist nghiệm thu**

- [ ] Mọi AC nâng cao được chọn đạt. Khi nghiệm thu mức Tốt, có đủ kết quả AC-21a, AC-21b, AC-21c.
- [ ] Số liệu và hành vi MVP ổn định, không mất khả năng truy vết lượt hoặc cọc hiện hữu.

## 9. Sổ xác nhận trước khi triển khai

T01 tạo bản ghi chính thức. Mỗi quyết định lưu phiên bản, người duyệt và phạm vi tác động. Giữ nguyên phần thiết kế có thể kiểm được bằng fixture trong khi đợi các câu trả lời còn mở.

| Câu hỏi BRS | Cần chốt với nhà hàng hoặc chủ dự án | Điểm chặn đầu tiên và nơi dùng |
| --- | --- | --- |
| Q-01 | Lịch, ngày nghỉ, múi giờ, độ dài khung/khoảng sử dụng, khoảng đệm và giới hạn đặt. | T04 chốt quy tắc liên quan trước T10. T26 dùng để chạy ngoài giờ phục vụ. |
| Q-02 | Dữ liệu bàn, sức chứa, ghép/khóa bàn, điểm gán bàn, quyền tự chọn và cách chứng minh bố trí được khi chưa gán. | T04 chọn mô hình trước T10, T11, T14. T32 áp dụng nếu dùng chung tài nguyên. |
| Q-03 | Đối tượng phải cọc, mức/hạn cọc, giữ tạm, mốc cam kết và giải phóng. | T04 chốt ma trận trước T10, T11, T17, T18, T22. |
| Q-04 | Cấu hình VietQR, người nhận, nguồn đối chiếu, quyền, quy tắc nhiều giao dịch hoặc sai/đến trễ. | T03 lập danh sách năng lực. T17 cần cấu hình QR, T18 cần nguồn chứng cứ, T26 xác minh tích hợp. |
| Q-05 | Luồng chọn món và điểm chốt, giá, giới hạn, món hết, ghi một phần và giao bếp. | T02/T04 chốt thiết kế áp dụng trước T13, T16, T22. |
| Q-06 | Quyền đổi/hủy, đến trễ, không đến, sửa nhầm và chính sách hoàn/bù trừ/chuyển/giữ cọc. | T04 hoàn thiện ma trận liên quan trước T15, T18. T30 và T31 nếu được chọn. |
| Q-07 | Tài khoản hay khách đặt nhanh, liên hệ, xác minh, kênh kết quả và quy tắc lưu. | T03 chốt biên truy cập trước T07, T11, T12, T20, T21. T23 kiểm dữ liệu. |
| Q-08 | Người quản lý từng mảng, quyền xem/ghi, phân công, phê duyệt và trách nhiệm đối chiếu. | T03 chốt quyền thực tế trước T07 và task vận hành tương ứng T14–T19. |
| Q-09 | Trường thực đơn chính thức, cách công bố, ngừng nhận và nguồn nhập. Màn hình quản lý web đã duyệt. | T09 và T29 cần dữ liệu và quy tắc. T13 và T20 dùng chung. |
| Q-10 | Chỉ số báo cáo, mốc kỳ, công thức, bộ lọc, mức chi tiết và xuất dữ liệu nếu duyệt. | T19 dùng để viết truy vấn, fixture tính tay và tiêu chí. |
| Q-11 | Mức thao tác MVP trong chat, xác nhận, điểm chuyển kênh, dữ liệu dùng cho LLM, danh sách tool mức Tốt. | T03 chốt ranh giới; T20 và T21 cần phạm vi tương ứng. T34 khi chọn mức Tốt. |
| Q-12 | Phạm vi tiệc, xét duyệt, cam kết tài nguyên, báo giá, cọc. | T32. |
| Q-13 | Điều kiện gửi đánh giá, giới hạn, thang điểm, kiểm duyệt và hiển thị. | T33. |
| Q-14 | Thiết bị, tải, tiêu chí đo, thời hạn lưu, khôi phục, phạm vi giao dịch/dữ liệu dùng thử và người duyệt. | T23, T24 cần tiêu chí tương ứng; T25–T28 áp dụng cho hạ tầng, kiểm thử, phát hành và bàn giao. |
| Q-15 | Nhận diện cùng ý định, khôi phục sau mất phản hồi hoặc chuyển kênh, phân biệt nhiều lượt độc lập. | T03/T04 chốt trước T11 và T21. T22 thử xuyên kênh. |

**Quyết định kỹ thuật bổ sung cần xác nhận ở T01/T03** — Ngân sách, người sở hữu dịch vụ/tài khoản, nhà cung cấp hạ tầng và IdP, điều kiện hỗ trợ, lịch dùng thử, mục tiêu mức Tốt và lựa chọn tùy chọn. Ghi tài liệu kiểm chứng cho quota Groq, cấu hình VietQR, extension PostgreSQL, miền/TLS và phương án vận hành một máy chủ. Những quyết định này điều chỉnh phương án thực hiện khi cần, trong phạm vi đã duyệt.

## 10. Bảng truy vết yêu cầu, công việc và nghiệm thu

Các task trong cột thực hiện có trách nhiệm tạo hoặc kết nối năng lực. T22 chạy kiểm thử tích hợp MVP, T26 xác nhận release candidate, T27 xác nhận demo công khai và dùng thử. T35 nghiệm thu phần nâng cao đã chọn. Khi cập nhật BRS, rà lại các dòng bị ảnh hưởng và liên kết ca thử/biên bản theo ID tương ứng.

### 10.1 Use case và tiêu chí nghiệm thu

| Use case hoặc tiêu chí xuyên hệ thống | Phạm vi | Task thực hiện | Tiêu chí | Nơi tổng hợp bằng chứng |
| --- | --- | --- | --- | --- |
| UC-01 · Xem thực đơn | MVP | T09 | AC-01 | T22, T26 |
| UC-02 · Quản trị thực đơn web | MVP | T29 | AC-20a | T22, T26, T27 |
| UC-03 · Kiểm tra khung theo số khách | MVP | T10, T12 | AC-02 | T22, T26, T27 |
| UC-04 · Ghi nhận lượt đặt | MVP | T11, T12, T14 | AC-03, AC-04, AC-18 | T22, T26 |
| UC-05 · Khách tra cứu và xin thay đổi | Tùy chọn | T30 | AC-20b | T35 |
| UC-06 · Đặt món trước | MVP | T09, T13 | AC-05 | T22, T26 |
| UC-07 · Chuẩn bị thông tin bếp | MVP | T13, T15, T16 | AC-06 | T22, T26 |
| UC-08 · Thông tin cọc VietQR | MVP | T17 | AC-07 | T22, T26 |
| UC-09 · Xác minh cọc | MVP | T18 | AC-08, AC-18 | T22, T26 |
| UC-10 · Sai lệch/hết hạn cọc | MVP | T14, T18 | AC-09 | T22, T26 |
| UC-11 · Xem sơ đồ bàn | MVP | T14 | AC-10 | T22, T26 |
| UC-12 · Phân bàn/đổi bố trí | MVP | T10, T11, T14 | AC-04, AC-11 | T22, T26 |
| UC-13 · Theo dõi đặt chỗ | MVP | T07, T15 | AC-12 | T22, T23, T26 |
| UC-14 · Ghi kết quả phục vụ | MVP | T15, T18 | AC-13 | T22, T26 |
| UC-15 · Quản lý đổi/hủy | Tùy chọn | T31 | AC-20c | T35 |
| UC-16 · Báo cáo | MVP | T19 | AC-14 | T22, T26 |
| UC-17 · AI tư vấn món | MVP | T09, T20 | AC-15 | T22, T26 |
| UC-18 · AI đặt bàn | MVP | T10, T11, T12, T21 | AC-04, AC-16, AC-18 | T22, T26 |
| UC-19 · AI gọi API nghiệp vụ | Tốt | T34 | AC-21c | T35 |
| UC-20 · Tiệc/sự kiện | Tốt | T32 | AC-21a | T35 |
| UC-21 · Đánh giá | Tốt | T33 | AC-21b | T35 |
| AC-17 · Tích hợp lỗi, bảo vệ dữ liệu và chất lượng | MVP | T18, T20, T23, T24, T25 | AC-17 | T26 |
| AC-19 · Demo và dùng thử | MVP | T25, T26, T27, T28 | AC-19 | T27, T28 |

### 10.2 Quy tắc và yêu cầu phi chức năng

| ID BRS | Yêu cầu | Task chịu trách nhiệm | Điểm kiểm |
| --- | --- | --- | --- |
| BR-01 | Giờ tiếp nhận tách giờ phục vụ | T10, T12 | AC-02 |
| BR-02 | Khả dụng theo sức chứa và thời gian | T04, T10, T11, T14 | AC-02, AC-04, AC-11 |
| BR-03 | Chống trùng bàn | T04, T06, T10, T11, T14, T18, T21 | AC-04, AC-09, AC-11 |
| BR-04 | Trạng thái cọc và đặt chỗ riêng | T04, T11, T15, T17, T18 | AC-07, AC-08, AC-09, AC-13 |
| BR-05 | Xác minh dựa trên chứng cứ | T03, T17, T18, T26 | AC-07, AC-08, AC-09 |
| BR-06 | Kiểm món và số lượng tại lúc ghi | T09, T13, T16 | AC-05, AC-06 |
| BR-07 | Đổi trạng thái theo quyền | T04, T07, T14, T15, T18, T31 nếu chọn | AC-11, AC-12, AC-13, AC-20c nếu chọn |
| BR-08 | Chat có căn cứ và đúng quyền | T20, T21, T23, T34 nếu chọn | AC-15, AC-16, AC-21c nếu chọn |
| BR-09 | Ghi không đến theo chính sách | T15, T18 | AC-13 |
| BR-10 | Gửi lại giữ một kết quả | T11, T14, T18, T21, T22, T34 nếu chọn | AC-04, AC-08, AC-11, AC-18 |
| BR-11 | Báo cáo nhất quán | T19 | AC-14 |
| NFR-01 | Kênh nhận đặt 24/7 và URL công khai | T10, T24, T25, T27 | AC-02, AC-19 |
| NFR-02 | Tiếp tục khi tích hợp lỗi | T17, T18, T20, T21, T24 | AC-17 |
| NFR-03 | Nhất quán giữa các kênh và chống trùng | T04, T06, T11, T14, T18, T21, T22 | AC-04, AC-08, AC-11, AC-18 |
| NFR-04 | Phân quyền và bảo vệ dữ liệu | T03, T07, T08, T23, T25 | AC-12, AC-17 |
| NFR-05 | Truy vết nghiệp vụ | T04, T07, T14, T15, T18 | AC-08, AC-11, AC-13 |
| NFR-06 | Dễ sử dụng | T02, T08, T12, T22, T26, T27 | AC-19 |
| NFR-07 | Hiệu năng | T24, T25, T26 | AC-17 |
| NFR-08 | Khôi phục | T11, T18, T24, T25, T26, T28 | AC-17, AC-18 |

### 10.3 Yêu cầu nguồn và chuẩn đầu ra

| ID BRS | Phạm vi nguồn | Task, mốc và bằng chứng |
| --- | --- | --- |
| NV-01 | Web và back-end API | T03, T05–T08, T25, T27. M1 và AC-19. |
| NV-02 | Chatbot AI đặt bàn, tư vấn món | T20–T22, T26. AC-15, AC-16. |
| NV-03 | Nhà hàng, nhận đặt 24/7, món/cọc, bố trí và bếp | T10–T18, T22, T27. AC ở mục 10.1, kiểm ngoài giờ phục vụ. |
| NV-04 | Danh mục MVP | T09–T22 và T29. M2 và ma trận AC mục 10.1. |
| NV-05 | Ba chức năng mức Tốt | T32–T35. AC-21a, AC-21b, AC-21c. |
| NV-06 | Demo công khai và dùng thử tại đơn vị | T25–T28. M3, M4 và AC-19. |
| NV-07 | Groq free, VietQR | T03, T17, T18, T20, T21, T26. Bằng chứng cấu hình và chạy tích hợp đã duyệt. |
| NV-08 | Rủi ro không đến và trùng bàn | T04, T10, T11, T14, T15, T17, T18, T22. AC-04, AC-09, AC-11, AC-13. |
| NV-09 | GitHub/Jira/MS Project, D01–D27 và CLO2/CLO3 | T01, T03, T04, T26, T28. WBS, vai trò, quản lý chất lượng, chi phí, truyền thông, rủi ro, mua sắm, tích hợp và bàn giao. Gán D01–D27 theo danh mục chính thức. |

### Đề xuất mở rộng dài hạn

- **Nhắc lịch.** Khi được duyệt, thiết kế opt-in theo kênh, lịch gửi, xử lý hủy và chống gửi lặp từ lịch đặt.
- **Danh sách chờ.** Khi được duyệt, đặc tả thứ tự, thời hạn phản hồi và cách thực hiện lại phép kiểm khả dụng khi có chỗ.
- **Phân tích sử dụng bàn.** Khi được duyệt, thống nhất cách đo thời gian khai thác bàn và đọc các phân bổ/kết quả phục vụ đã ghi.

Các đề xuất này được giữ trong backlog để phân tích riêng khi có quyết định phạm vi. Bảng nghiệm thu MVP và mức Tốt dùng các tiêu chí của BRS.
