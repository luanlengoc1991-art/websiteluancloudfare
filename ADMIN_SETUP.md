# Alpha HUB Admin

Trang quản trị: `/admin`. Production chạy trên Cloudflare Workers tại
`https://websiteluancloudfare.luanlengoc1991.workers.dev`.

## Những gì đã có

- Giao diện quản trị xanh, responsive: tổng quan, dự án, quỹ căn (nhập CSV), khách hàng, giao dịch, thư viện ảnh/PDF, bài viết, cài đặt.
- Form đăng ký tư vấn trên website tạo khách hàng mới trong quản trị. Không gửi email.
- Đăng nhập Google trực tiếp với Google (PKCE + `state`), danh sách email quản trị kiểm tra ở máy chủ, cookie phiên HttpOnly dạng mã ngẫu nhiên, giới hạn số lần thử trong database và thu hồi phiên khi đăng xuất.
- Dữ liệu nằm trong Cloudflare D1; ảnh và PDF nằm trong bucket R2 `alpha-assets`. Ảnh được phục vụ công khai qua `/api/files/:id` để website dùng; tải PDF cần phiên quản trị.
- Bản ghi khách hàng, phiên đăng nhập và chi tiết khách trong giao dịch không bao giờ trả về từ API trạng thái công khai. Website công khai chỉ đọc dự án, quỹ căn, bài viết và thông tin liên hệ đã xuất bản.
- Danh mục và quỹ căn ban đầu là dữ liệu minh họa. Hãy thay trước khi dùng thương mại.

## Hạ tầng Cloudflare

| Thành phần | Tên | Binding |
| --- | --- | --- |
| Worker | `websiteluancloudfare` | — |
| D1 | `alpha-hub` | `DB` |
| R2 | `alpha-assets` | `MEDIA` |
| Static assets | — | `ASSETS` |
| Images | — | `IMAGES` |

Binding khai báo trong `wrangler.jsonc`. Sau khi sửa file đó, chạy `npm run types`
để cập nhật `cloudflare-env.d.ts`.

Bảng trong D1: `records` (mọi thực thể quản trị dạng JSON), `reservations`,
`files`, `sessions`, `login_limits`, `members`. Schema nằm ở
`migrations/0001_alpha_hub.sql`.

```sh
npm run db:migrate         # áp dụng migration lên D1 production
npm run db:migrate:local   # áp dụng lên D1 cục bộ dùng cho dev và npm test
```

## Biến môi trường trên Worker

Đặt trong Settings của Worker (Variables and Secrets), không commit:

| Biến | Giá trị |
| --- | --- |
| `ALPHA_ADMIN_EMAIL` | Email Google duy nhất được quyền quản trị |
| `GOOGLE_CLIENT_ID` | OAuth client ID của Google |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret, đặt dạng Secret |
| `ALPHA_ENABLE_PASSWORD_LOGIN` | Để trống hoặc `false`; Google là cách chính |
| `ALPHA_ADMIN_PASSWORD_HASH` | Chỉ khi bật đăng nhập mật khẩu dự phòng |

Không đặt `ALPHA_SECURE_COOKIE` trên Cloudflare (cookie mặc định chỉ đi qua HTTPS).
`ALPHA_PUBLIC_ORIGIN` chỉ cần khi tên miền công khai khác Host của request.

`npm run setup` chỉ tạo thông tin đăng nhập cho máy cá nhân. Sao chép mã băm sang
Cloudflare bằng kênh riêng, không qua chat hay GitHub. Không commit `.env.local`.

Giới hạn tải lên 4 MiB mỗi file. File lớn hơn cần upload trực tiếp có chữ ký, chưa làm.

## Cấu hình đăng nhập Google

1. Trong Google Auth Platform, tạo OAuth client loại Web. Chỉ cấp scope `openid`, email và profile.
2. Authorized redirect URI: `https://websiteluancloudfare.luanlengoc1991.workers.dev/auth/callback`. Thêm cả tên miền riêng nếu dùng.
3. Đặt `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong Settings của Worker.
4. Đặt `ALPHA_ADMIN_EMAIL` bằng email Google của chủ website. Không có cơ chế tự cấp quyền admin và không cấp theo tên miền Gmail.
5. Nếu ứng dụng Google còn ở trạng thái Testing, thêm email quản trị vào danh sách test user.

Trình duyệt không nhận client secret, access token hay refresh token của Google.
Mã `code` được đổi lấy `id_token` ở máy chủ bằng client secret; máy chủ kiểm tra
`iss`, `aud`, `exp` và `email_verified` rồi đổi thành phiên Alpha HUB 7 ngày.
Mỗi request quản trị kiểm tra lại email cấu hình, nên đổi `ALPHA_ADMIN_EMAIL` là
thu hồi quyền cũ. Đăng xuất thu hồi phiên Alpha HUB, không đăng xuất khỏi Google.

## Tài khoản thành viên

- `/dang-ky`: đăng ký email/mật khẩu (tối thiểu 8 ký tự) hoặc Google; `/dang-nhap`: đăng nhập; `/tai-khoan`: xem email, quyền truy cập và đăng xuất.
- Tài khoản thành viên lưu trong bảng `members` của D1. Mật khẩu băm bằng scrypt kèm salt riêng cho từng người; tài khoản đăng nhập bằng Google có `password_hash` rỗng nên không thể dò mật khẩu.
- **Cloudflare không có dịch vụ gửi email trong kiến trúc này, nên đăng ký bằng email được kích hoạt ngay, không qua bước xác nhận email.** Thành viên chỉ xem được nội dung công khai và trang tài khoản, không ghi được dữ liệu, nên rủi ro giới hạn ở việc email chưa được xác minh. Nếu cần xác nhận email, phải thêm một dịch vụ gửi thư (ví dụ Cloudflare Email Sending) rồi bật lại luồng xác nhận.
- Đăng ký bằng email trùng `ALPHA_ADMIN_EMAIL` bị từ chối; quyền quản trị chỉ đến từ phiên Google khớp email cấu hình.
- Các API quản trị tiếp tục dùng `getCurrentUser()` (chỉ admin). `getSignedInUser()` chỉ dùng cho trang tài khoản và trạng thái thành viên. Không thay kiểm tra quản trị bằng kiểm tra đã đăng nhập.
- Cookie phiên HttpOnly chứa mã ngẫu nhiên; bảng `sessions` chỉ lưu SHA-256 của mã, `owner` là id thành viên hoặc `admin`. Đăng xuất thu hồi phiên hiện tại; hạn phiên 7 ngày.
- Đăng nhập mật khẩu quản trị dự phòng dùng `/api/auth/admin-password`, chỉ hoạt động khi đặt `ALPHA_ENABLE_PASSWORD_LOGIN=true`.

## Kiểm thử

`npm test` dựng Worker thật rồi chạy nó trên runtime Cloudflare cục bộ với D1 và
R2 dùng một lần trong thư mục tạm. Không chạm vào tài khoản production. Nội dung
kiểm tra: PKCE và ràng buộc `state` của Google, mã dùng một lần, danh sách email
quản trị, từ chối danh tính chưa xác minh, đăng ký và đăng nhập thành viên trong
D1, cách ly thành viên khỏi khu vực quản trị, từ chối header danh tính giả mạo,
CSRF, mật khẩu quản trị, cookie HttpOnly, lưu khách hàng, giữ chỗ nguyên tử,
gia hạn và hủy, tải lên và tải xuống có bảo vệ, form đăng ký tư vấn, dữ liệu
riêng tư không lộ qua API công khai, các trang Next.js, dữ liệu còn sau khi khởi
động lại, và thu hồi phiên khi đăng xuất.

Đăng nhập Google trong `npm test` dùng một endpoint giả lập chạy cục bộ. Luồng
Google thật vẫn cần cấu hình OAuth client và một lần đăng nhập của người dùng.

## Phạm vi và giới hạn còn lại

Một tài khoản quản trị; chưa có phân quyền nhân viên, luồng xóa/lưu trữ, email tự
động hay cập nhật thời gian thực. Thay đổi công khai xuất hiện sau khi tải lại
trang hoặc theo chu kỳ hỏi lại 60 giây.

## Màn hình chi tiết căn toàn màn hình

- Mở Dự án → Quỹ căn 360° / Bảng hàng → chọn căn để xem bố cục ba cột: tiện ích, ảnh/phiếu căn, thông tin thương mại.
- Trong Quản lý quỹ căn → Sửa căn, trường **Đường dẫn ảnh phiếu căn** nhận URL HTTPS hoặc đường dẫn file `/api/files/...` đã tải lên. Khi có ảnh này, màn hình hiển thị nguyên ảnh; khi chưa có, ghép thông tin căn với phối cảnh dự án và ghi rõ ảnh tham khảo.
- Trường **Đường dẫn mặt bằng căn** dành riêng cho layout của căn đó. Không tự lấy mặt bằng của căn khác.
- Cột ảnh bên trái lấy file loại **Tiện ích** của đúng dự án; nếu chưa có thì dùng Thư viện / Nhà mẫu / Panorama của dự án.
- Giá TTS, TTTĐ, giá vay, tổng giá trị, ngày chính sách và quà tặng lấy từ hồ sơ căn. Dữ liệu thiếu hiển thị “Chưa cập nhật”. Các căn mẫu vẫn là dữ liệu minh họa.
- Phiếu giá tải CSV; tính lãi vay dùng giả định người dùng nhập và không phải báo giá ngân hàng. Giữ căn dùng luồng quản trị hiện có; chức năng không gửi đặt chỗ đến chủ đầu tư.

## Bảng hàng tham khảo Masteri Grand Coast

- `lib/masteri-account-snapshot.ts` chứa 12 căn đọc được từ bảng hàng VHub trong phiên tài khoản của chủ website ngày 27/09/2026, thay cho 650 căn mô phỏng. Đây là snapshot ban đầu, không phải API đồng bộ VHub.
- Snapshot chỉ chứa thông tin sản phẩm hiển thị: mã, tòa, tầng, loại căn, diện tích, hướng, giá, phân khu, nhóm quỹ, trạng thái và nguồn/thời điểm. Không chứa thông tin tài khoản, khách hàng, cookie hoặc khóa truy cập.
- Giá TTS/TTTĐ, diện tích sàn, layout và ảnh phiếu căn chưa đọc được nên không tự suy đoán. Giá/trạng thái phải được xác nhận lại trước giao dịch.
- Admin có thể sửa từng căn bằng giao diện quản lý; thay đổi lưu vào D1 và được ưu tiên hơn snapshot cùng ID.
