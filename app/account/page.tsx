"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useConfirm } from "@/components/Confirm";
import Icon from "@/components/Icon";
import Loading from "@/components/Loading";
import Reminders from "@/components/Reminders";

export default function Account() {
  const router = useRouter();
  const confirm = useConfirm();
  const { session, ready } = useRequireAuth();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (!ready) return;
    getSupabase().rpc("is_admin").then(({ data }) => setAdmin(data === true));
  }, [ready]);

  async function signOut() {
    await getSupabase().auth.signOut();
    router.push("/");
  }

  async function remove() {
    setMsg("");
    if (!(await confirm({ title: "Бүртгэлээ бүрмөсөн устгах уу?", body: "Бүх хүүхдийн профайл, ахиц устаж, төлбөртэй эрх хаагдана. Буцаах боломжгүй.", confirmLabel: "Устгах", danger: true }))) return;
    setBusy(true);
    const sb = getSupabase();
    const { error } = await sb.rpc("todug_delete_account");
    if (error) { setBusy(false); setMsg("Бүртгэлийг устгаж чадсангүй. Дахин оролдоно уу."); return; }
    // Хэрэглэгч серверт байхгүй болсон тул зөвхөн энэ төхөөрөмжийн сешнийг цэвэрлэнэ
    await sb.auth.signOut({ scope: "local" });
    router.push("/");
  }

  if (!ready || !session) return <Loading label="Түр хүлээнэ үү…" />;

  return (
    <main>
      <h1 className="page round">Бүртгэл</h1>
      <div className="card">
        <p className="muted">Нэвтэрсэн имэйл</p>
        <p style={{ overflowWrap: "anywhere", marginBottom: 14 }}><b>{session.user.email ?? "Имэйлгүй"}</b></p>
        <button className="ghost" onClick={signOut}><Icon name="logout" size={18} /> Гарах</button>
      </div>
      <div className="card">
        <h3 className="round">Төлбөр</h3>
        <p className="muted">Багц сонгох, төлбөрийн заавар, захиалгын төлөвөө харах.</p>
        <Link href="/billing" className="ghost" style={{ marginTop: 12 }}>Төлбөрийн хуудас</Link>
        {admin && <Link href="/admin" className="ghost" style={{ marginTop: 10 }}>Захиалгууд (админ)</Link>}
      </div>
      <Reminders />
      <div className="card">
        <h3 className="round">Бүртгэлээ устгах</h3>
        <p className="muted">Бүртгэлээ устгахад бүх хүүхдийн профайл, тэмдэглэсэн ахиц бүрмөсөн устаж, төлбөртэй эрх хаагдана. Төлсөн захиалгын бүртгэл (дугаар, дүн, огноо, имэйл) санхүүгийн тооцооны зорилгоор хадгалагдана. Сэргээх боломжгүй.</p>
        {msg && <p className="err" role="alert">{msg}</p>}
        <button className="ghost danger" style={{ marginTop: 12 }} disabled={busy} onClick={remove}>{busy ? "Устгаж байна…" : "Бүртгэлээ устгах"}</button>
      </div>
    </main>
  );
}
