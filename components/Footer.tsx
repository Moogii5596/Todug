import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site">
      <nav aria-label="Хөлийн цэс">
        <Link href="/blog">Блог</Link>
        <Link href="/privacy">Нууцлалын бодлого</Link>
        <Link href="/billing">Төлбөр</Link>
      </nav>
      <p>Todug онош тавихгүй. Гэрийн дасгал нь хэл засалч, эмчийн үзлэгийг орлохгүй.</p>
    </footer>
  );
}
