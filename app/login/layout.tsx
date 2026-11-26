import type { Metadata } from "next";

/* Нэвтрэх хуудас хайлтын үр дүнд гарах шаардлагагүй, гэхдээ холбоосыг нь дагаж болно */
export const metadata: Metadata = { title: "Нэвтрэх", robots: { index: false, follow: true } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
