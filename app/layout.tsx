import type { Metadata } from "next";
import "./globals.css";
import "./admin.css";
import "./project-unit.css";

export const metadata: Metadata = {
  title: "Alpha Hub | Quỹ căn & Dự án",
  description: "Tra cứu quỹ căn, khám phá dự án và quản lý giao dịch bất động sản.",
  icons: {
    icon: "/alpha-hub-logo.png",
    shortcut: "/alpha-hub-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}

