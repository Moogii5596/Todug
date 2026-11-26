import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

/* Хайлтын системийн баталгаажуулах кодыг Vercel-ийн орчны хувьсагчаар өгнө (.env.example-г үзнэ үү) */
const other: Record<string, string> = {};
if (process.env.BING_SITE_VERIFICATION) other["msvalidate.01"] = process.env.BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s | " + SITE_NAME },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["хэл яриа", "хэл ярианы хоцрогдол", "хүүхдийн хэл яриа", "хэл засал", "хэл засалч", "ярианы дасгал", "хүүхэд хэлд оруулах", "Todug"],
  openGraph: {
    type: "website", locale: "mn_MN", url: "/", siteName: SITE_NAME,
    title: SITE_TITLE, description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.YANDEX_SITE_VERIFICATION || undefined,
    other,
  },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EEF3F8" },
    { media: "(prefers-color-scheme: dark)", color: "#111922" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>
        <div className="app">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
