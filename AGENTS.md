# Alpha Hub

- Next.js App Router, React, TypeScript, Tailwind, Node.js 24.
- Keep Vietnamese user-facing text and the Alpha HUB green brand.
- Run npm run typecheck and npm run build after meaningful changes; npm test verifies the backend against disposable data.
- Never commit .env.local, admin passwords, session tokens, data/, uploads, or customer records.
- Preserve same-origin native links and per-project routes. Do not restore the ChatGPT Sites auth headers or cloudflare:workers imports.
- Everything runs on Cloudflare. Records, reservations, files metadata, sessions, login limits and members live in D1 `alpha-hub` (binding DB); uploads live in R2 `alpha-assets` (binding MEDIA). Reach them only through db/store.ts. Schema changes go in migrations/ and are applied with npm run db:migrate.
- Auth supports public email/password and Google members plus one allowlisted Google admin, with hashed opaque sessions in D1. Google OAuth talks to Google directly with PKCE and a state check; the id_token is validated for iss, aud, exp and email_verified. getCurrentUser is admin-only; getSignedInUser includes members. Never grant admin access from an id_token claim other than the allowlisted email, and never from email/password signup. GOOGLE_CLIENT_SECRET and the admin password hash are server-only. npm test runs the real Worker on a local Cloudflare runtime with disposable D1 and R2, not the production account.
- GitHub source and the old chatgpt.site deployment are separate. Do not claim automatic synchronization with chatgpt.site.

## Quy trình đã được chủ dự án xác nhận

- Kho mã nguồn: `luanlengoc1991-art/websiteluancloudfare`; nhánh phát hành: `main`. Remote `origin` là `https://github.com/luanlengoc1991-art/websiteluancloudfare.git`. Không đẩy sang `websiteluan`.
- Trước khi sửa, lấy phiên bản mới nhất từ GitHub (`git fetch` rồi cập nhật `origin/main`), đọc file này và bảo toàn thay đổi đang có.
- Với công việc chủ dự án yêu cầu, thực hiện đầy đủ, kiểm tra phù hợp, commit và push trực tiếp lên `origin/main`. Chủ dự án đã cho phép quy trình này; không hỏi lại xác nhận cho các bước thông thường.
- Push lên `main` chạy Cloudflare Workers Builds của Worker `websiteluancloudfare`: build `npx opennextjs-cloudflare build`, deploy `npx wrangler deploy`. Chỉ báo đã xuất bản khi bản build trên Cloudflare thành công và website phản hồi.
- Cloudflare dùng build token của chính Worker, không cần secret trên GitHub. Biến runtime (`ALPHA_ADMIN_EMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) đặt trong Settings của Worker, không commit.
- Báo ngắn gọn bằng tiếng Việt: nội dung cập nhật, mã commit, trạng thái website và phần nào chưa kiểm chứng hoặc bị chặn.
- Khi đổi thiết bị: clone/pull trước khi sửa; commit và push sau khi sửa để các thiết bị và Cloudflare dùng cùng nguồn.
- GitHub lưu mã nguồn. Cloudflare D1 và R2 lưu dữ liệu ứng dụng và file; không đưa dữ liệu khách hàng, file tải lên hay thông tin bí mật vào GitHub.
- Quy trình này áp dụng cho các tác vụ đã được yêu cầu; vẫn tuân thủ các yêu cầu quyền truy cập bắt buộc và không tự ý thực hiện thao tác phá hủy ngoài phạm vi công việc.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
