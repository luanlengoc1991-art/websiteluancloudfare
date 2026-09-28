# Alpha Hub

- Next.js App Router, React, TypeScript, Tailwind, Node.js 24.
- Keep Vietnamese user-facing text and the Alpha HUB green brand.
- Run npm run typecheck and npm run build after meaningful changes; npm test verifies the backend against disposable data.
- Never commit .env.local, admin passwords, session tokens, data/, uploads, or customer records.
- Preserve same-origin native links and per-project routes. Do not restore the ChatGPT Sites auth headers or cloudflare:workers imports.
- Auth supports public Supabase email/Google members and one allowlisted Google admin, with hashed opaque sessions in Supabase. getCurrentUser is admin-only; getSignedInUser includes members. Never grant admin access from user_metadata or email/password signup. Records use Supabase Postgres and files use the private alpha-assets Storage bucket. Secret keys are server-only. Keep RLS enabled and browser roles denied direct access. npm test uses a disposable HTTP fixture, not a live Supabase project.
- GitHub source and the old chatgpt.site deployment are separate. Do not claim automatic synchronization.

## Quy trình đã được chủ dự án xác nhận

- Kho mã nguồn chính: `luanlengoc1991-art/websiteluan`; nhánh phát hành: `main`. GitHub là nguồn chuẩn để tiếp tục công việc trên mọi thiết bị.
- Trước khi sửa, lấy phiên bản mới nhất từ GitHub (clone hoặc fetch/pull), đọc file này và bảo toàn thay đổi đang có.
- Với công việc chủ dự án yêu cầu, thực hiện đầy đủ, kiểm tra phù hợp, commit và push trực tiếp lên `main`. Chủ dự án đã cho phép quy trình cập nhật và xuất bản này; không hỏi lại xác nhận cho các bước thông thường.
- Vercel triển khai website `https://websiteluan.vercel.app` từ GitHub `main`. Sau khi push, kiểm tra commit trên GitHub và trạng thái triển khai Vercel; chỉ báo đã xuất bản khi có bằng chứng deployment tương ứng thành công.
- Báo ngắn gọn bằng tiếng Việt: nội dung cập nhật, mã commit, trạng thái website và phần nào chưa kiểm chứng hoặc bị chặn.
- Khi đổi thiết bị: clone/pull trước khi sửa; commit và push sau khi sửa để các thiết bị và Vercel dùng cùng nguồn.
- GitHub lưu mã nguồn. Supabase lưu dữ liệu ứng dụng và Storage; không đưa dữ liệu khách hàng, file tải lên hay thông tin bí mật vào GitHub.
- Quy trình này áp dụng cho các tác vụ đã được yêu cầu; vẫn tuân thủ các yêu cầu quyền truy cập bắt buộc và không tự ý thực hiện thao tác phá hủy ngoài phạm vi công việc.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
