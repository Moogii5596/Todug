import type { Metadata } from "next";
import Link from "next/link";
import { POSTS, dateText } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Блог: хүүхдийн хэл ярианы зөвлөмж",
  description: "Хүүхдийн хэл ярианы хөгжил, хоцрогдлын шинж, гэртээ хийх дасгал, дэлгэцийн цагийн тухай эцэг эхэд зориулсан нийтлэлүүд.",
  alternates: { canonical: "/blog" },
};

export default function Blog() {
  return (
    <main>
      <h1 className="page round">Блог</h1>
      <p className="sub">Хүүхдийн хэл ярианы хөгжлийн тухай эцэг эхэд зориулсан зөвлөмж.</p>
      {POSTS.map(p => (
        <Link key={p.slug} href={"/blog/" + p.slug} className="card post">
          <h2 className="round">{p.title}</h2>
          <p>{p.description}</p>
          <p className="muted">{dateText(p.date)} · {p.minutes} минут унших</p>
        </Link>
      ))}
    </main>
  );
}
