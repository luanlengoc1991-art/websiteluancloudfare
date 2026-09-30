'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="container section-space"><h1>Chưa thể mở trang quản trị</h1><p>Kiểm tra kết nối dữ liệu Cloudflare trên máy chủ rồi thử lại.</p><button className="button dark" onClick={reset}>Thử lại</button></section>;}
