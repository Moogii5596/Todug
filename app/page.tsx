import Link from "next/link";

export default function Home() {
  return (
    <main>
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
    </main>
  );
}
