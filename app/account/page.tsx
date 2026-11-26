"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function Account() {
  const router = useRouter();
  const { session, ready } = useRequireAuth();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (!ready) return;
    getSupabase().rpc("is_admin").then(({ data }) => setAdmin(data === true));
  }, [ready]);

  async function remove() {
    setMsg("");
    if (!window.confirm("Бүртгэлээ бүрмөсөн устгах уу? Бүх хүүхдийн профайл, ахиц, захиалга, төлбөртэй эрх устана. Буцаах боломжгүй.")) return;
    setBusy(true);
    const sb = getSupabase();
    const { error } = await sb.rpc("todug_delete_account");
    if (error) { setBusy(false); setMsg("Бүртгэлийг устгаж чадсангүй. Дахин оролдоно уу."); return; }
    // Хэрэглэгч серверт байхгүй болсон тул зөвхөн энэ төхөөрөмжийн сешнийг цэвэрлэнэ
    await sb.auth.signOut({ scope: "local" });
    router.push("/");
  }

  if (!ready || !session) return <main><p className="muted">Түр хүлээнэ үү…</p></main>;

  return (
    <main>
      <h1 className="page round">Бүртгэл</h1>
      <div className="card">
        <p className="muted">Нэвтэрсэн имэйл</p>
        <p style={{ overflowWrap: "anywhere" }}><b>{session.user.email ?? "Имэйлгүй"}</b></p>
        <p><Link href="/privacy">Нууцлалын бодлого</Link></p>
      </div>
      <div className="card">
        <h3>Төлбөр</h3>
        <p className="muted">Багц сонгох, төлбөрийн заавар, захиалгын төлөвөө харах.</p>
        <Link href="/billing" className="ghost">Төлбөрийн хуудас</Link>
        {admin && <Link href="/admin" className="ghost" style={{ marginTop: 10 }}>Захиалгууд (админ)</Link>}
      </div>
      <div className="card">
        <h3>Бүртгэлээ устгах</h3>
        <p className="muted">Бүртгэлээ устгахад бүх хүүхдийн профайл, тэмдэглэсэн ахиц, захиалгын түүх, төлбөртэй эрх бүрмөсөн устана. Сэргээх боломжгүй.</p>
        {msg && <p className="err" role="alert">{msg}</p>}
        <button className="ghost danger" disabled={busy} onClick={remove}>{busy ? "Устгаж байна…" : "Бүртгэлээ устгах"}</button>
      </div>
    </main>
  );
}
