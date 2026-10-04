# Ảnh quản trị, chat và Cloudflare

Ảnh tải từ quản trị được lưu nguyên bản vào R2 `alpha-assets`, binding `MEDIA`. D1 `alpha-hub`, binding `DB`, giữ ID, tên, MIME và vị trí dùng ảnh. URL `/api/files/<id>` là URL lâu dài của ứng dụng; không lưu link đính kèm tạm của ChatGPT/Claude làm ảnh website. Ảnh mới nhận UUID mới. Thay ảnh không xóa ảnh cũ; có thể tìm lại và dùng lại trong Thư viện.

## Triển khai lần đầu sau bản sửa

Lấy `main` mới nhất, chạy `npm ci`, đăng nhập Cloudflare đúng tài khoản đang có Worker `websiteluancloudfare`, rồi:

```bash
npm run deploy
```

`npm run deploy` tự dựng Worker, áp dụng migration D1 cần thiết rồi deploy; giữ nguyên các biến runtime/secret hiện có bằng `--keep-vars`. Migration `0003_media_assistant.sql` thêm lịch sử đổi ảnh và thông tin OAuth cho kết nối AI. Phải chạy migration trước khi mở mục chat ảnh. Không đổi tên database, bucket hoặc binding; không dùng `wrangler deploy --temporary` thay website thật.

Sau triển khai, thử bằng một dự án thử: đổi ảnh trong Quản trị → Dự án, bấm Lưu thông tin, mở trang công khai trong cửa sổ chưa đăng nhập, rồi kiểm tra ảnh cũ trong Thư viện. Có thể quay lại ảnh cũ bằng danh sách ảnh đã lưu. Các lần đổi ảnh/nền tiếp theo chỉ cập nhật R2/D1, không cần triển khai lại code. Trang công khai đang mở nhận dữ liệu mới khi mở lại, đổi tab hoặc trong chu kỳ cập nhật 60 giây.

## Chat trong quản trị

Quản trị → AI sửa website hỗ trợ đính kèm ảnh, chọn nơi cần thay và nhập lệnh. `Áp dụng trực tiếp` luôn dùng được khi D1/R2 hoạt động. Chế độ ChatGPT hoặc Claude hiểu câu lệnh cần key riêng trên Cloudflare Worker:

- `OPENAI_API_KEY` hoặc `ANTHROPIC_API_KEY`, chỉ đặt trong Worker secrets, không đưa vào GitHub/chat.
- Model mặc định `gpt-5-mini` và `claude-sonnet-5-5`; có thể cấu hình `OPENAI_MEDIA_MODEL` và `ANTHROPIC_MEDIA_MODEL`.
- Tối đa 4 MB mỗi ảnh, JPG/PNG/WEBP. PDF chỉ dành cho Thư viện tài liệu; chat ảnh không nhận PDF.
- Vị trí hỗ trợ: ảnh đại diện dự án/bài viết, phiếu căn/mặt bằng căn, thêm ảnh thư viện/mặt bằng/360°/nhà mẫu/tiện ích dự án và nền của các tab đã có trong Cài đặt.
- Chat chỉ cập nhật ảnh. Không có quyền sửa mã nguồn, triển khai code, đọc khách hàng hoặc cấp quyền tài khoản. Lệnh mơ hồ cần chọn rõ vị trí.

## ChatGPT và Claude bên ngoài

URL MCP sau triển khai:

`https://websiteluancloudfare.luanlengoc1991.workers.dev/api/mcp`

Nếu dùng domain riêng, đặt `ALPHA_PUBLIC_ORIGIN` bằng HTTPS origin chính xác và dùng MCP URL trên domain đó.

1. **ChatGPT**: bật Developer mode trong Settings, thêm ứng dụng từ MCP URL, dùng OAuth và DCR (đăng ký client tự động). Đăng nhập bằng tài khoản quản trị Alpha HUB, đọc và cho phép quyền sửa ảnh. Bật ứng dụng Alpha HUB trong cuộc trò chuyện cần sửa website. Có thể gửi ảnh kèm lệnh: “Dùng Alpha HUB thay ảnh đại diện Vinhomes Green Paradise bằng ảnh đính kèm”. Tool `publish_chat_image` khai báo `openai/fileParams` để nhận file thật từ ChatGPT, tải nguyên bản sang R2 rồi cập nhật D1.
2. **Claude**: Add custom connector với MCP URL, Sign in, OAuth client **Register automatically**. Kết nối bằng cùng tài khoản quản trị. Tool nhận ảnh qua link tải đính kèm hoặc `publish_image_base64` cho client đọc được byte file thật (ví dụ Claude Code). Claude web không luôn cung cấp URL/byte của ảnh trong chat cho remote MCP; nếu client không cung cấp, cần tải ảnh trong quản trị rồi ra lệnh dùng lại ID ảnh trong Thư viện. Không thể hứa tự chuyển mọi ảnh hiển thị trong mọi phiên Claude.
3. Thư viện, dữ liệu và lịch sử dùng chung giữa các client. Thu hồi kết nối ở Quản trị → AI sửa website. OAuth dùng PKCE S256, mã một lần, access token 1 giờ, refresh token xoay vòng tối đa 30 ngày, hash token trong D1 và ID kết nối ổn định để thu hồi được cả khi token vừa xoay vòng và kiểm tra admin allowlist ở mỗi request. Cookie đăng nhập không được chuyển cho ứng dụng ngoài.

Nguồn đính kèm được giới hạn ở kho OpenAI và `files.claudeusercontent.com`. Nếu client dùng một hostname tải file khác, chỉ thêm hostname đáng tin vào `ALPHA_MEDIA_SOURCE_HOSTS` (phân cách dấu phẩy). Không dùng wildcard. Link nội bộ, HTTP, URL có thông tin đăng nhập và chuyển hướng sang hostname không được phép bị từ chối. Bộ đọc giới hạn 4 MB kể cả khi nguồn không khai báo Content-Length.

Cần thực hiện kết nối ứng dụng một lần trong tài khoản ChatGPT/Claude; deploy code không tự cài connector vào tài khoản của người dùng. ChatGPT/Claude ngoài không cần API key của website cho việc gọi MCP; key của website chỉ dùng ở chat quản trị.

## Kiểm thử

```bash
npm run typecheck
node scripts/test-media-ai.mjs
npm test
```

`npm test` dựng Worker thật và dùng D1/R2 local tạm, kiểm tra upload, thay ảnh, giữ ảnh cũ, public API, dữ liệu sau khởi động lại, phân quyền, OAuth PKCE/CSRF/audience/replay/refresh/revoke và MCP. `test-media-ai.mjs` kiểm tra hợp đồng request/response hai provider bằng API mô phỏng, không gọi API trả phí. Đây không phải bằng chứng đã deploy hay đã thử bằng tài khoản ChatGPT/Claude thực.

Tài liệu chính thức tham chiếu:
- https://developers.openai.com/api/docs/guides/developer-mode
- https://developers.openai.com/plugins/reference (file inputs)
- https://developers.openai.com/plugins/build/auth
- https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization
