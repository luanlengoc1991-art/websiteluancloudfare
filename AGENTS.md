# Alpha Hub

- Next.js App Router, React, TypeScript, Tailwind, Node.js 24.
- Keep Vietnamese user-facing text and the Alpha HUB green brand.
- Riêng `/alphahub`: theo yêu cầu mới nhất, bám sát bố cục `https://market.vinhomes.vn/tu-van`, chỉ chuyển blue sang green transparent sáng hơn có gradient mượt. Giữ ảnh nền hiện có, kính mờ và tỷ lệ hero 2:1:1. Cụm câu hỏi có sidebar 430px, panel trắng chữ xanh, sáu dòng accordion đóng mặc định; tiếp theo là form Góc chia sẻ và ba bài Tin tức lấy từ dữ liệu hiện có. Nội dung giới thiệu/giá trị/góc nhìn thị trường của AlphaHub nằm trong accordion. Không thêm section hay biến tấu layout. Logo, liên hệ, tra cứu mã căn, form tư vấn/tham quan và đường dẫn vẫn dùng riêng của AlphaHub. Không đưa lại các lớp emerald quá tối hoặc đường bóng đen ngắt nền. Theo mẫu màu được duyệt ngày 03/10/2026, nền các shape xanh dùng gradient dọc từ #02cf52 qua #01853e, #006837, #015d36 đến #005332, opacity 88% để giữ transparent. Chỉ đổi nền các thẻ kính xanh và dialog; giữ panel trắng, ô nhập liệu, ảnh nền, bố cục, nội dung và chức năng.
- Run npm run typecheck and npm run build after meaningful changes; npm test verifies the backend against disposable data.
- Never commit .env.local, admin passwords, session tokens, data/, uploads, or customer records.
- Preserve same-origin native links and per-project routes. Do not restore the ChatGPT Sites auth headers or cloudflare:workers imports.
- Everything runs on Cloudflare. Records, reservations, files metadata, sessions, login limits and members live in D1 `alpha-hub` (binding DB); uploads live in R2 `alpha-assets` (binding MEDIA). Reach them only through db/store.ts. Schema changes go in migrations/ and are applied with npm run db:migrate.
- Auth supports public email/password and Google members plus one allowlisted admin, with hashed opaque sessions in D1. The admin signs in on /dang-nhap with ALPHA_ADMIN_EMAIL and the scrypt hash in ALPHA_ADMIN_PASSWORD_HASH, or with the allowlisted Google identity; Google credentials are optional. Google OAuth talks to Google directly with PKCE and a state check; the id_token is validated for iss, aud, exp and email_verified. getCurrentUser is admin-only; getSignedInUser includes members. Never grant admin access from an id_token claim other than the allowlisted email, and never from email/password signup. Members stay view-only until the administrator sets members.can_edit; that flag allows project, unit, article, about, guide and library edits only and never opens customers, reservations, settings or the member list. GOOGLE_CLIENT_SECRET and the admin password hash are server-only. npm test runs the real Worker on a local Cloudflare runtime with disposable D1 and R2, not the production account.
- GitHub source and the old chatgpt.site deployment are separate. Do not claim automatic synchronization with chatgpt.site.

## Quy trình đã được chủ dự án xác nhận

- Kho mã nguồn: `luanlengoc1991-art/websiteluancloudfare`; nhánh phát hành: `main`. Remote `origin` là `https://github.com/luanlengoc1991-art/websiteluancloudfare.git`. Không đẩy sang `websiteluan`.
- GitHub tại repository này là nguồn mã chung và nơi lưu kết quả cuối cùng. Dù dùng Codex, Cursor, model khác hay máy khác để code, mọi thay đổi hoàn tất phải được kiểm tra và đưa về `main` của cùng repository để tiếp tục sửa và triển khai từ đó.
- Trước mỗi lần sửa, luôn `git fetch origin main`, đọc hướng dẫn mới nhất và cập nhật checkout theo `origin/main` trước khi bắt đầu. Kiểm tra và bảo toàn thay đổi chưa commit hoặc commit local; không ghi đè công việc của model hoặc thiết bị khác. Nếu không lấy được bản mới nhất, báo blocker thay vì coi checkout cũ là bản hiện hành.
- Chủ dự án có thể yêu cầu sửa code và giao diện ngay trong cuộc trò chuyện Codex này. Codex xử lý trong checkout cloud hiện có, kiểm tra rồi cập nhật GitHub; không cần chuyển yêu cầu sang GPT khác. Quy tắc được lưu trong repository để các thiết bị và phiên làm việc lấy cùng hướng dẫn khi clone/pull.
- Với công việc chủ dự án yêu cầu, thực hiện đầy đủ, kiểm tra phù hợp, commit và push trực tiếp lên `origin/main`. Chủ dự án đã cho phép quy trình này; không hỏi lại xác nhận cho các bước thông thường.
- Trước khi push, fetch lại để phát hiện thay đổi từ model hoặc thiết bị khác; nếu `main` đã tiến thêm, tích hợp thay đổi, xử lý xung đột và kiểm tra lại phần bị ảnh hưởng rồi mới push. Không force-push hoặc bỏ commit của người khác. Sau khi push, xác nhận commit đã có trên GitHub và báo mã commit.
- Chủ dự án yêu cầu chỉ cập nhật GitHub để tự triển khai bằng Cursor. Codex commit và push lên `main`, không chạy lệnh triển khai, không điều khiển Cloudflare hoặc chờ triển khai. Báo kết quả theo commit GitHub. Kết nối Workers Builds có sẵn có thể vẫn tự build khi push; không tự thay đổi cấu hình kết nối này.
- Khi triển khai bằng Cursor, lấy bản `main` mới nhất từ đúng repository GitHub này, bảo toàn thay đổi local và xác nhận phiên bản triển khai đã được push lên GitHub. Mã dùng để triển khai phải khớp commit trên GitHub; không dùng bản sửa chỉ còn ở một máy hoặc cuộc trò chuyện. Nếu GitHub có cập nhật mới trong lúc chuẩn bị, đồng bộ và kiểm tra lại trước khi triển khai.
- Code và giao diện phải phù hợp với Cloudflare Workers qua OpenNext và các binding D1/R2 hiện có. Không dựa vào server Node chạy lâu dài hoặc filesystem local để lưu dữ liệu bền vững; kiểm tra tương thích runtime khi thêm dependency hoặc API mới. Với thay đổi ứng dụng, chạy typecheck/build và test phù hợp; thay đổi backend hoặc binding cần kiểm thử Worker local trước khi push. Nếu cần migration hay biến môi trường mới, báo rõ hướng dẫn để chủ dự án thực hiện khi triển khai bằng Cursor.
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
