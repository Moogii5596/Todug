import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { POSTS, dateText, getPost } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POSTS.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = "/blog/" + post.slug;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: post.title, description: post.description, publishedTime: post.date, locale: "mn_MN", siteName: SITE_NAME },
  };
}

export default async function PostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const others = POSTS.filter(p => p.slug !== post.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: "mn",
    mainEntityOfPage: SITE_URL + "/blog/" + post.slug,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <main className="doc">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/blog" className="link subtle back"><Icon name="back" size={18} /> Блог</Link>
      <article>
        <h1 className="page round">{post.title}</h1>
        <p className="sub">{dateText(post.date)} · {post.minutes} минут унших</p>
        {post.body.map((b, i) => {
          if ("h" in b) return <h2 key={i}>{b.h}</h2>;
          if ("p" in b) return <p key={i}>{b.p}</p>;
          if ("ul" in b) return <ul key={i}>{b.ul.map((x, j) => <li key={j}>{x}</li>)}</ul>;
          return <ol key={i}>{b.ol.map((x, j) => <li key={j}>{x}</li>)}</ol>;
        })}
      </article>

      <Link href="/children" className="cta" style={{ marginTop: 24 }}>Хүүхдэдээ тохирсон хичээл авах</Link>
      <p className="foot">Энэ нийтлэл ерөнхий мэдээлэл бөгөөд онош, эмчилгээний зөвлөгөө биш. Санаа зовоосон зүйл байвал хэл засалч, хүүхдийн эмчид хандаарай.</p>

      <h2 className="round" style={{ marginTop: 32 }}>Бусад нийтлэл</h2>
      <ul className="linklist">
        {others.map(p => <li key={p.slug}><Link href={"/blog/" + p.slug}>{p.title}<Icon name="chevron" size={18} /></Link></li>)}
      </ul>
    </main>
  );
}
