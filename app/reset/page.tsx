"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordField from "@/components/PasswordField";
import { getSupabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

/** Имэйлийн холбоосоор ирсэн токен URL-д байгаа эсэх (supabase-js түүнийг боловсруулж дуустал хүлээнэ) */
function urlHasToken() {
  if (typeof window === "undefined") return false;
  const u = window.location.hash + window.location.search;
  return /access_token=|[?&#]code=|token_hash=/.test(u) && !/[?&#]error=/.test(u);
}

export default function Reset() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [hadToken] = useState(urlHasToken);
  const [waited, setWaited] = useState(false);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // PASSWORD_RECOVERY үйлдэл getSession-оос хожуу ирж болох тул токентой үед түр хүлээнэ
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 5000);
    const { data: sub } = getSupabase().auth.onAuthStateChange(ev => {
      if (ev === "PASSWORD_RECOVERY" || ev === "SIGNED_IN") setWaited(true);
    });
    return () => { clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push("/children"), 1500);
    return () => clearTimeout(t);
  }, [done, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (password.length < 6) { setMsg("Нууц үг 6-аас дээш тэмдэгттэй байна."); return; }
    if (password !== repeat) { setMsg("Хоёр нууц үг таарахгүй байна."); return; }
    setBusy(true);
    const { error } = await getSupabase().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMsg(error.code === "same_password" ? "Шинэ нууц үг хуучнаасаа өөр байх ёстой."
        : error.code === "weak_password" ? "Нууц үг хэт богино эсвэл амархан байна. Өөр нууц үг сонгоно уу."
        : "Нууц үгийг сольж чадсангүй. Дахин оролдоно уу.");
      return;
    }
    setDone(true);
  }

  const pending = loading || (!session && hadToken && !waited);

  return (
    <main className="auth">
      <h1 className="page round">Шинэ нууц үг</h1>
      {done ? (
        <>
          <p className="ok" role="status">Нууц үг солигдлоо.</p>
          <Link href="/children" className="link">Үргэлжлүүлэх</Link>
        </>
      ) : pending ? (
        <p className="muted">Түр хүлээнэ үү…</p>
      ) : !session ? (
        <>
          <p className="err" role="alert">Холбоосын хугацаа дууссан эсвэл буруу байна.</p>
          <Link href="/login" className="link">Нэвтрэх хуудас руу буцах</Link>
        </>
      ) : (
        <form onSubmit={submit} className="card stack">
          <PasswordField label="Шинэ нууц үг" value={password} onChange={setPassword} autoComplete="new-password" minLength={6} hint="6-аас дээш тэмдэгт." />
          <PasswordField label="Шинэ нууц үгээ давтана уу" value={repeat} onChange={setRepeat} autoComplete="new-password" minLength={6} />
          {msg && <p className="err" role="alert">{msg}</p>}
          <button className="cta" disabled={busy}>{busy && <span className="spin" />}{busy ? "Түр хүлээнэ үү…" : "Нууц үг солих"}</button>
        </form>
      )}
    </main>
  );
}
