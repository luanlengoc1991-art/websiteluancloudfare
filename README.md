# Alpha HUB

Website bất động sản dùng Next.js App Router, React, TypeScript và Node.js 24. Mã nguồn và nhánh phát hành là `luanlengoc1991-art/websiteluancloudfare` (`main`). Cloudflare Workers Builds theo dõi nhánh này và tự triển khai mỗi lần push có thay đổi mã nguồn.

## Website và trang quản trị

- Website: `/quy-hang`, `/du-an`, `/tin-tuc`.
- Trang thương hiệu: `/alphahub` — giới thiệu nền tảng AlphaHub với giao diện xanh trong suốt, nhóm giá trị cốt lõi và tab theo vai trò. Dự án, số căn và liên hệ đọc từ dữ liệu dùng chung; các mục 3D chưa triển khai được ghi rõ là định hướng phát triển. Trang `/gioi-thieu` và phần quản trị nội dung hiện có vẫn được giữ riêng.
- Admin: `/admin` — tổng quan, giới thiệu, dự án, quỹ căn, tin tức, hướng dẫn, khách hàng, giao dịch, thư viện, tài khoản và cài đặt.
- Đăng nhập: `/dang-nhap`.
- Khách gửi form đăng ký tư vấn sẽ xuất hiện trong Khách hàng của admin.

Admin sử dụng một tài khoản quản trị. Toàn bộ dữ liệu nằm trên Cloudflare: bản ghi trong D1 `alpha-hub`, ảnh và PDF trong bucket R2 `alpha-assets`, phiên đăng nhập và tài khoản thành viên cũng trong D1. Ảnh dự án hiển thị trên website; PDF cần đăng nhập để tải. Nội dung khách hàng không công khai.

Ảnh/video lớn và media gốc lưu ở object storage, ưu tiên R2 hiện có. Repository chỉ giữ code cùng asset cần thiết cho giao diện/build (logo, icon, font, ảnh mẫu nhỏ); D1 giữ metadata và tham chiếu file. Không đưa kho media vào GitHub hoặc checkout Codex. `uploads/` và `media-originals/` được bỏ qua bởi Git. Giới hạn upload hiện tại vẫn là JPG/PNG/WEBP/PDF, 4 MiB/file; quy tắc lưu trữ này chưa bổ sung chức năng upload video.

**Website chạy tại `https://websiteluancloudfare.luanlengoc1991.workers.dev`. Cập nhật mã nguồn trên GitHub; chủ dự án tự triển khai bằng Cursor. Binding và biến môi trường xem [ADMIN_SETUP.md](ADMIN_SETUP.md).**

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

## Đồng bộ nội dung website

Menu admin dùng chung ánh xạ với năm tab công khai: Giới thiệu, Dự án, Quỹ căn, Tin tức và Hướng dẫn. Mỗi tab có nút mở trang tương ứng. Nội dung Giới thiệu lưu dưới bản ghi `about/main`; Hướng dẫn lưu theo từng bản ghi `guide`. Không cần migration mới vì sử dụng bảng records hiện có.

Nội dung mặc định được giữ cho tới khi lưu chỉnh sửa. Dự án nổi bật và dự án gợi ý trong Giới thiệu tham chiếu ID từ danh mục Dự án; tên, ảnh, vị trí và số căn đọc cùng dữ liệu với trang ngoài. Hướng dẫn có thứ tự và công tắc hiển thị; bản ẩn không công khai nội dung. Hotline, email và Zalo trên chân trang, Giới thiệu, khung tư vấn và chatbot lấy chung từ Cài đặt (để trống dùng thông tin mặc định).

Sau khi lưu, các tab cùng trình duyệt được thông báo tải dữ liệu mới. Khi quay lại tab, dữ liệu được làm mới; các thiết bị khác cập nhật qua chu kỳ 60 giây. Khách hàng, giao dịch, cấu hình riêng và PDF giữ nguyên kiểm soát quyền.
