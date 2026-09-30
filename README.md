# Alpha HUB

Website bất động sản dùng Next.js App Router, React, TypeScript và Node.js 24. Mã nguồn và nhánh phát hành là `luanlengoc1991-art/websiteluancloudfare` (`main`). Cloudflare Workers Builds theo dõi nhánh này và tự triển khai mỗi lần push.

## Website và trang quản trị

- Website: `/quy-hang`, `/du-an`, `/tin-tuc`.
- Admin: `/admin` — tổng quan, dự án, quỹ căn, khách hàng, giao dịch, thư viện, bài viết, cài đặt.
- Đăng nhập: `/dang-nhap`.
- Khách gửi form đăng ký tư vấn sẽ xuất hiện trong Khách hàng của admin.

Admin sử dụng một tài khoản quản trị. Toàn bộ dữ liệu nằm trên Cloudflare: bản ghi trong D1 `alpha-hub`, ảnh và PDF trong bucket R2 `alpha-assets`, phiên đăng nhập và tài khoản thành viên cũng trong D1. Ảnh dự án hiển thị trên website; PDF cần đăng nhập để tải. Nội dung khách hàng không công khai.

**Production chạy tại `https://websiteluancloudfare.luanlengoc1991.workers.dev`, tự triển khai khi push `main`. Binding và biến môi trường xem [ADMIN_SETUP.md](ADMIN_SETUP.md).**

## Chạy trên máy tính

1. Cài Node.js 24.
2. Chạy `npm ci`.
3. Chạy `npm run setup` để tạo tài khoản quản trị local, hoặc dùng `.env.local` sẵn có.
4. Chạy `npm run db:migrate:local` để tạo bảng trong D1 cục bộ.
5. Chạy `npm run dev`, mở `http://127.0.0.1:3000`.

`next dev` dùng đúng binding D1 và R2 như trên Cloudflare, nhưng là bản cục bộ trong `.wrangler/`. Đăng nhập Google cần `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong `.env.local` cùng redirect URI trỏ về máy local.

Không commit `.env.local`, mật khẩu, khóa API bí mật hoặc dữ liệu khách hàng. Trên Cloudflare, để cookie dùng HTTPS mặc định; không sao chép `ALPHA_SECURE_COOKIE=false` từ môi trường local.

## Kiểm tra

```sh
npm run typecheck
npm run build
npm test
```

`npm test` dựng Worker thật rồi chạy trên runtime Cloudflare cục bộ với D1 và R2 dùng một lần, không chạm vào tài khoản production. Đăng nhập Google dùng endpoint giả lập, nên luồng Google thật vẫn cần kiểm tra một lần trên bản đã triển khai.

## Dữ liệu mẫu

Dự án và quỹ căn khởi tạo trong `lib/catalog.ts` là dữ liệu minh họa. Thay bằng bảng hàng chính thức trước khi tư vấn/giao dịch. Thao tác giữ chỗ chỉ ghi nhận nội bộ, không thu tiền hoặc gửi đặt chỗ tới chủ đầu tư.

Giới hạn upload hiện tại: 4 MiB/file, JPG/PNG/WEBP/PDF. Không có phân quyền nhân viên, tự động gửi email hoặc xóa/lưu trữ bản ghi trong phiên bản này.

Schema D1 nằm trong `migrations/`; `npm run db:migrate` áp dụng lên database thật.
