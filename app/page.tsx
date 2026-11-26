import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
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
        <p className="eyebrow">Хэл ярианы гэрийн хөтөлбөр</p>
        <h1 className="round">Хүүхдийнхээ тухай хэлээрэй, хичээлийг нь тааруулъя</h1>
        <p className="lead">Нас, одоогийн яриа, сонирхлыг нь оруулахад 4 долоо хоногийн гэрийн дасгалын төлөвлөгөө гарна.</p>
        <Link href="/children" className="cta">Хичээл боловсруулах <Icon name="chevron" size={18} /></Link>
        <p className="note"><Icon name="check" size={16} /> Эхний долоо хоногийн хичээл үнэгүй</p>
        <div className="demo" aria-hidden="true">
          <div className="cap r">Хүүхэд</div>
          <div className="say c">Машин</div>
          <div className="cap">Та</div>
          <div className="say p"><mark>Том</mark> машин.</div>
          <p className="tip">Хүүхдийн хэлсэн үг дээр нэг үг нэмж хариулна. Хичээл бүр ийм бэлэн жишээтэй.</p>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <h2 id="how-title" className="round">Хэрхэн ажилладаг вэ</h2>
        <ol className="how">
          <li>Бүртгүүлж, хүүхдийнхээ мэдээллийг оруулна.</li>
          <li>Ярианы түвшинд нь тохирсон шатнаас хичээл эхэлнэ.</li>
          <li>Өдөр бүр 10–30 минут тоглож, хийсэн өдрөө тэмдэглэнэ.</li>
          <li>Долоо хоног бүр дараагийн шат руу ахина.</li>
        </ol>
      </section>

      <section className="section" aria-labelledby="tips-title">
        <h2 id="tips-title" className="round">Эцэг эхэд зориулсан зөвлөмж</h2>
        <ul className="linklist">
          {POSTS.map(p => <li key={p.slug}><Link href={"/blog/" + p.slug}>{p.title}<Icon name="chevron" size={18} /></Link></li>)}
        </ul>
      </section>
    </main>
  );
}
