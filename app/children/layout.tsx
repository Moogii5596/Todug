import type { Metadata } from "next";

/* Хувийн хуудас: хайлтын системд оруулахгүй */
export const metadata: Metadata = { title: "Хүүхдүүд", robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
