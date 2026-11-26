import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/lib/blog";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/* Хайлтын системд сайтын төрлийг ойлгуулах бүтэцлэгдсэн өгөгдөл */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "mn",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  audience: { "@type": "Audience", audienceType: "Бага насны хүүхэдтэй эцэг эх" },
};

export default function Home() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="hero">
        <h1 className="round">Хүүхдийнхээ тухай хэлээрэй, хичээлийг нь тааруулъя</h1>
        <p>Нас, одоогийн яриа, сонирхлыг нь оруулахад 4 долоо хоногийн гэрийн дасгалын төлөвлөгөө гарна.</p>
        <div className="demo" aria-hidden="true">
          <div className="say c">Машин</div>
          <div className="say p"><mark>Том</mark> машин.</div>
        </div>
      </section>

      <ol className="how">
        <li>Бүртгүүлж, хүүхдийнхээ мэдээллийг оруулна.</li>
        <li>Ярианы түвшинд нь тохирсон шатнаас хичээл эхэлнэ.</li>
        <li>Өдөр бүр 10–30 минут тоглож, хийсэн өдрөө тэмдэглэнэ.</li>
        <li>Долоо хоног бүр дараагийн шат руу ахина.</li>
      </ol>

      <Link href="/children" className="cta">Хичээл боловсруулах</Link>
      <p className="foot">Todug онош тавихгүй. Гэрийн дасгал нь хэл засалч, эмчийн үзлэгийг орлохгүй.</p>

      <section className="doc" style={{ marginTop: 28 }}>
        <h2 className="round">Эцэг эхэд зориулсан зөвлөмж</h2>
        <ul>
          {POSTS.map(p => <li key={p.slug}><Link href={"/blog/" + p.slug}>{p.title}</Link></li>)}
        </ul>
      </section>
      <p className="foot" style={{ marginTop: 6 }}><Link href="/blog">Блог</Link> · <Link href="/privacy">Нууцлалын бодлого</Link></p>
    </main>
  );
}
