import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Todug: хүүхдэд тань тохирсон хэл ярианы хичээл",
  description: "Хүүхдийнхээ нас, одоогийн яриа, сонирхлыг оруулахад гэртээ хийх хэл ярианы дасгалын төлөвлөгөө гарна.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

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
