import type { Metadata } from "next";
import localFont from "next/font/local";
import SiteAtmosphere from "@/components/site-atmosphere";
import SiteEffects from "@/components/site-effects";
import "./globals.css";
import "./admin.css";
import "./admin-projects.css";
// news.css: legacy page styles, no longer rendered (08/10/2026)
// projects.css: legacy page styles, no longer rendered (08/10/2026)
import "./project-unit.css";
import "./inventory-market.css";
// about.css: legacy page styles, no longer rendered (08/10/2026)
// alphahub.css: legacy page styles, no longer rendered (08/10/2026)
import "./site-shell.css";
import "./content-sidebar.css";
import "./typography.css";
import "./atmosphere.css";
import "./be-vietnam-pro.css";
import "./skin.css";
import "./spaciaz.css";

const playfairDisplay = localFont({
  src: [
    { path: "./fonts/PlayfairDisplay-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/PlayfairDisplay-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/PlayfairDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-playfair-display",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
});

const mulish = localFont({
  src: [
    { path: "./fonts/Mulish-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Mulish-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Mulish-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Mulish-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Mulish-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-mulish",
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

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
    <html lang="vi" data-skin="emerald" className={`${playfairDisplay.variable} ${mulish.variable}`}>
      <body className="antialiased"><SiteAtmosphere/><SiteEffects/>{children}</body>
    </html>
  );
}
