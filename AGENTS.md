# Alpha Hub

- Next.js App Router, React, TypeScript, Tailwind, Node.js 24.
- Keep Vietnamese user-facing text and the Alpha HUB green brand.
- Run npm run typecheck and npm run build after meaningful changes; npm test verifies the backend against disposable data.
- Never commit .env.local, admin passwords, session tokens, data/, uploads, or customer records.
- Preserve same-origin native links and per-project routes. Do not restore the ChatGPT Sites auth headers or cloudflare:workers imports.
- Everything runs on Cloudflare. Records, reservations, files metadata, sessions, login limits and members live in D1 `alpha-hub` (binding DB); uploads live in R2 `alpha-assets` (binding MEDIA). Reach them only through db/store.ts. Schema changes go in migrations/ and are applied with npm run db:migrate.
- Auth supports public email/password and Google members plus one allowlisted admin, with hashed opaque sessions in D1. The admin signs in on /dang-nhap with ALPHA_ADMIN_EMAIL and the scrypt hash in ALPHA_ADMIN_PASSWORD_HASH, or with the allowlisted Google identity; Google credentials are optional. Google OAuth talks to Google directly with PKCE and a state check; the id_token is validated for iss, aud, exp and email_verified. getCurrentUser is admin-only; getSignedInUser includes members. Never grant admin access from an id_token claim other than the allowlisted email, and never from email/password signup. Members stay view-only until the administrator sets members.can_edit; that flag allows project, unit, article, about, guide and library edits only and never opens customers, reservations, settings or the member list. GOOGLE_CLIENT_SECRET and the admin password hash are server-only. npm test runs the real Worker on a local Cloudflare runtime with disposable D1 and R2, not the production account.
- GitHub source and the old chatgpt.site deployment are separate. Do not claim automatic synchronization with chatgpt.site.

## Quy trình đã được chủ dự án xác nhận

- Kho mã nguồn: `luanlengoc1991-art/websiteluancloudfare`; nhánh phát hành: `main`. Remote `origin` là `https://github.com/luanlengoc1991-art/websiteluancloudfare.git`. Không đẩy sang `websiteluan`.
- Trước khi sửa, lấy phiên bản mới nhất từ GitHub (`git fetch` rồi cập nhật `origin/main`), đọc file này và bảo toàn thay đổi đang có.
- Với công việc chủ dự án yêu cầu, thực hiện đầy đủ, kiểm tra phù hợp, commit và push trực tiếp lên `origin/main`. Chủ dự án đã cho phép quy trình này; không hỏi lại xác nhận cho các bước thông thường.
- Chủ dự án yêu cầu chỉ cập nhật GitHub để tự triển khai bằng Cursor. Codex commit và push lên `main`, không chạy lệnh triển khai, không điều khiển Cloudflare hoặc chờ triển khai. Báo kết quả theo commit GitHub. Kết nối Workers Builds có sẵn có thể vẫn tự build khi push; không tự thay đổi cấu hình kết nối này.
- Cloudflare dùng build token của chính Worker, không cần secret trên GitHub. Biến runtime (`ALPHA_ADMIN_EMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) đặt trong Settings của Worker, không commit.
- Báo ngắn gọn bằng tiếng Việt: nội dung cập nhật, mã commit trên GitHub, kiểm tra đã thực hiện và phần nào chưa kiểm chứng hoặc bị chặn.
- Khi đổi thiết bị: clone/pull trước khi sửa; commit và push sau khi sửa để các thiết bị và Cloudflare dùng cùng nguồn.
- GitHub lưu mã nguồn. Cloudflare D1 và R2 lưu dữ liệu ứng dụng và file; không đưa dữ liệu khách hàng, file tải lên hay thông tin bí mật vào GitHub.
- Quy trình này áp dụng cho các tác vụ đã được yêu cầu; vẫn tuân thủ các yêu cầu quyền truy cập bắt buộc và không tự ý thực hiện thao tác phá hủy ngoài phạm vi công việc.

## Ảnh, video và dung lượng repository

- Repository chỉ giữ code và asset thật sự cần cho giao diện/build, như logo, icon, font và ảnh mẫu nhỏ. Ảnh/video dung lượng lớn, media gốc và file người dùng tải lên lưu ở object storage; không đưa vào GitHub hoặc checkout Codex nếu công việc không cần đến chúng.
- Dự án này ưu tiên R2 `alpha-assets` đang có, qua binding `MEDIA` và `db/store.ts`. Metadata và tham chiếu file lưu ở D1. Chỉ bổ sung Supabase Storage hoặc dịch vụ khác khi chủ dự án yêu cầu; không tạo thêm hệ thống lưu trữ chỉ để áp dụng quy tắc này.
- Khi cần xử lý media, chỉ tải file cần thiết vào thư mục tạm ngoài repository. Không tải toàn bộ kho media vào repo, nhúng ảnh/video lớn dạng base64 trong code hoặc commit bản xuất, bản sao dự phòng.
- Với media đã được Git theo dõi, kiểm tra tham chiếu và xác minh file đọc được từ object storage trước khi gỡ bản trong repo. Giữ asset cần thiết cho website hoạt động; không tự viết lại lịch sử Git.
- `.gitignore` loại trừ `uploads/` và `media-originals/`. Các quy tắc ignore không tự gỡ file đã được Git theo dõi.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
