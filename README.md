# Alpha HUB

Website bất động sản dùng Next.js App Router, React, TypeScript và Node.js 24. Mã nguồn thuộc repository `luanlengoc1991-art/websiteluan`.

## Website và trang quản trị

- Website: `/quy-hang`, `/du-an`, `/tin-tuc`.
- Admin: `/admin` — tổng quan, dự án, quỹ căn, khách hàng, giao dịch, thư viện, bài viết, cài đặt.
- Đăng nhập: `/dang-nhap`.
- Khách gửi form đăng ký tư vấn sẽ xuất hiện trong Khách hàng của admin.

Admin sử dụng một tài khoản quản trị. Dữ liệu lưu tại Supabase Postgres; ảnh và PDF lưu trong Supabase Storage. Ảnh dự án được hiển thị trên website; PDF cần đăng nhập để tải. Nội dung khách hàng không công khai.

**Nhánh admin chưa được triển khai Production. Xem [ADMIN_SETUP.md](ADMIN_SETUP.md) để cấu hình Vercel và các bước kiểm tra còn lại.**

## Chạy trên máy tính

1. Cài Node.js 24.
2. Chạy `npm ci`.
3. Chạy `npm run setup` để tạo tài khoản local hoặc cấu hình tài khoản sẵn có trong `.env.local`.
4. Thêm `SUPABASE_URL` và `SUPABASE_SECRET_KEY` vào `.env.local`. Dùng project phát triển khi kiểm thử.
5. Chạy `npm run dev`, mở `http://127.0.0.1:3000`.

Không commit `.env.local`, mật khẩu, khóa API bí mật hoặc dữ liệu khách hàng. Trên Vercel, để cookie dùng HTTPS mặc định; không sao chép `ALPHA_SECURE_COOKIE=false` từ môi trường local.

## Kiểm tra

```sh
npm run typecheck
npm run build
npm test
```

`npm test` chạy Next.js với Supabase HTTP giả lập dùng dữ liệu tạm, không kết nối project thật. Cần kiểm tra riêng luồng đăng nhập, upload và đăng ký tư vấn trên Vercel Preview trước khi đưa lên Production.

## Dữ liệu mẫu

Dự án và quỹ căn khởi tạo trong `lib/catalog.ts` là dữ liệu minh họa. Thay bằng bảng hàng chính thức trước khi tư vấn/giao dịch. Thao tác giữ chỗ chỉ ghi nhận nội bộ, không thu tiền hoặc gửi đặt chỗ tới chủ đầu tư.

Giới hạn upload hiện tại: 4 MiB/file, JPG/PNG/WEBP/PDF. Không có phân quyền nhân viên, tự động gửi email hoặc xóa/lưu trữ bản ghi trong phiên bản này.

Các file SQL trong `sql/` đã áp dụng cho project Supabase `alphahub`; không chạy lại trên project này. Nếu tạo project khác, áp dụng theo thứ tự trong `ADMIN_SETUP.md`.
