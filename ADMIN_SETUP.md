# Alpha HUB Admin

Admin entry: `/admin`. This change stays on a feature branch until Vercel credentials are configured and the preview is verified.

## What is implemented

- Separate responsive green administration interface: overview, projects, inventory with CSV import, customers, reservations, image/PDF library, articles, settings.
- Public consultation form creates a new customer in the admin system. No email is sent.
- Google OAuth via Supabase with PKCE, a server-checked admin email allowlist, opaque HttpOnly session cookie, database-backed throttling and logout revocation.
- Data persisted in Supabase Postgres; uploads in private `alpha-assets` bucket. Images are intentionally served publicly through `/api/files/:id` for website use. PDF downloads require an admin session.
- Customer records, sessions, and reservation customer details are never returned by the public state endpoint. The public site reads published project/unit/article changes and contact settings.
- Initial catalogue and inventory contain demo data. Dashboard distinguishes saved units and demo catalogue. Replace sample inventory before commercial use.

## Already applied to Supabase

Project `alphahub` (`qhxjlqtuupisysdirwct`):

1. `sql/alpha-admin.sql`: five prefixed tables with RLS, private Storage bucket, server-only RPC functions.
2. `sql/alpha-atomic-records.sql`: atomic record writes, unit-code uniqueness, transaction locking for reservations.

The connected SQL reader is not allowed to call the service-role functions. Schema/RLS/bucket were inspected; a live service-role integration test remains required. No production service key or admin password was retrieved or created in this task.

Tables intentionally have no browser RLS policies: direct `anon` / `authenticated` access is revoked; the server enforces the single-admin access model and uses `service_role`.

## Vercel environment

Set these in the existing `websiteluan` project, on the appropriate Preview and Production environments:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://qhxjlqtuupisysdirwct.supabase.co` |
| `SUPABASE_SECRET_KEY` | Supabase secret key, server only; legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported |
| `ALPHA_ADMIN_EMAIL` | Owner's chosen admin email |
| `ALPHA_ENABLE_PASSWORD_LOGIN` | Leave unset or `false`; Google is the default |

Do not prefix secret keys with `NEXT_PUBLIC_`. Leave `ALPHA_SECURE_COOKIE` unset in Vercel. The optional `ALPHA_PUBLIC_ORIGIN` must match the environment's actual origin; normally leave it unset to support preview hosts.

`npm run setup` is for generating local credentials. Copy the hash to Vercel privately, not through chat or GitHub. Never commit `.env.local`.

Node.js 24; `npm run build`. Upload cap is 4 MiB per file to fit the Vercel request body limit. Larger uploads need signed direct uploads and are not implemented here.

## Validation performed

- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm test`: passed against a disposable local HTTP contract fixture (authentication, CSRF, public/private separation, customer save, reservation operations, upload/download, restart persistence, logout, admin server rendering, lead form API).
- Cloud database schema: five tables with RLS enabled and private 4 MiB Storage bucket verified.
- Cloud browser could not open the local test server (`ERR_BLOCKED_BY_CLIENT`); responsive styling is implemented but visual browser verification remains pending.

Before merging: restore Vercel access, configure environment, open the branch preview, test real admin login, image upload and consultation submission, then merge and verify Production.

## Scope and remaining limits

Single admin; no staff roles, delete/archive workflow, automated emails, or real-time subscriptions. Public changes refresh on reload or the current 60-second polling cycle. No old SQLite database/files were migrated because no source runtime data was accessible. The existing source catalogue remains intact.

## Google login configuration

1. In Google Auth Platform, create a Web OAuth client. Configure only `openid`, email and profile scopes.
2. Google authorized redirect URI: `https://qhxjlqtuupisysdirwct.supabase.co/auth/v1/callback`.
3. In Supabase Authentication → Sign In / Providers → Google, enable Google and enter the OAuth Client ID and Client Secret privately. Keep nonce checks enabled.
4. Supabase URL Configuration: Site URL `https://websiteluan.vercel.app`; add `https://websiteluan.vercel.app/auth/callback` and the exact active Preview URL ending `/auth/callback`. Avoid broad wildcard redirects.
5. Set `ALPHA_ADMIN_EMAIL` in Vercel to the owner's chosen Google email. No automatic admin assignment and no Gmail-domain-wide permission. Redeploy after configuration.
6. If the Google app is in Testing, add the chosen admin email as a test user.

The browser receives neither Supabase secret keys nor OAuth access/refresh tokens. A successful PKCE exchange is checked with Supabase's user endpoint and converted to the existing seven-day opaque admin session. Each admin request rechecks the configured email, so changing that email revokes previous access. Logout revokes the Alpha HUB session; it does not sign out of the user's Google account.
Password login is disabled unless `ALPHA_ENABLE_PASSWORD_LOGIN=true` is explicitly set with the legacy hash. The local backend fixture enables this only to retain existing regression tests. OAuth tests cover the success callback, denied email/unverified/non-Google accounts, PKCE challenge, replay rejection and unsafe redirects. These are simulated provider tests; a real Google sign-in still requires provider configuration and the user's account interaction.

## Tài khoản thành viên

- `/dang-ky`: đăng ký email/mật khẩu (tối thiểu 8 ký tự) hoặc Google; `/dang-nhap`: đăng nhập; `/tai-khoan`: xem email, quyền truy cập và đăng xuất.
- Bật Email và Google trong Supabase Auth; cho phép đăng ký mới. Giữ xác nhận email. Cấu hình Custom SMTP để gửi thư xác nhận cho người dùng công khai; dịch vụ email mặc định Supabase có giới hạn người nhận và tần suất.
- Redirect URL xác nhận/Google: `https://websiteluan.vercel.app/auth/callback`. Xác nhận email sử dụng PKCE; mở thư trên cùng trình duyệt trong 1 giờ. Nếu đã xác nhận nhưng cookie hết hạn, đăng nhập lại bằng mật khẩu.
- Tài khoản mới luôn là thành viên. Chỉ phiên Google có email khớp `ALPHA_ADMIN_EMAIL` được truy cập quản trị. Email/mật khẩu không cấp quyền admin, kể cả email trùng cấu hình admin.
- Các API quản trị tiếp tục dùng `getCurrentUser()` (admin-only). `getSignedInUser()` chỉ dùng cho trang tài khoản và trạng thái thành viên. Không thay kiểm tra quản trị bằng kiểm tra đã đăng nhập.
- Cookie phiên HttpOnly chứa mã ngẫu nhiên; chỉ lưu hash trong `alpha_sessions`, owner là UUID Supabase cho thành viên và `admin` cho quản trị. Đăng xuất thu hồi phiên hiện tại; hạn phiên 7 ngày.
- Đăng nhập mật khẩu quản trị cũ, nếu được bật rõ ràng bằng `ALPHA_ENABLE_PASSWORD_LOGIN=true`, dùng `/api/auth/admin-password`; mặc định bị tắt. `/api/auth/login` dành cho Supabase email/password.
- `npm test` kiểm thử đăng ký, xác nhận, đăng nhập, đăng xuất và cách ly quyền thành viên bằng dữ liệu giả lập, không gửi thư hay tạo người dùng thật.

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
- Kết nối quản trị Supabase hiện từ chối ghi (read-only transaction); snapshot chưa được nhập vào database. Admin vẫn có thể sửa từng căn bằng giao diện quản lý hiện có, các thay đổi được lưu qua backend Supabase và ưu tiên hơn snapshot cùng ID.
