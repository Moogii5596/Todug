"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { configured, getSupabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!configured) { setMsg("Supabase тохируулагдаагүй байна. README-г үзнэ үү."); return; }
    if (password.length < 6) { setMsg("Нууц үг 6-аас дээш тэмдэгттэй байна."); return; }
    setBusy(true);
    const sb = getSupabase();
    const { data, error } = mode === "in"
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password });
    setBusy(false);
    if (error) { setMsg(mode === "in" ? "Имэйл эсвэл нууц үг буруу байна." : "Бүртгэж чадсангүй: " + error.message); return; }
    if (!data.session) { setMsg("Имэйл рүү тань баталгаажуулах холбоос илгээлээ. Баталгаажуулаад нэвтэрнэ үү."); return; }
    router.push("/children");
  }

  return (
    <main>
      <h1 className="page round">{mode === "in" ? "Нэвтрэх" : "Бүртгүүлэх"}</h1>
      <form onSubmit={submit} className="stack">
        <label className="f">Имэйл
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="f">Нууц үг
          <input type="password" required autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        {msg && <p className="err" role="alert">{msg}</p>}
        <button className="cta" disabled={busy}>{busy ? "Түр хүлээнэ үү…" : mode === "in" ? "Нэвтрэх" : "Бүртгүүлэх"}</button>
      </form>
      <button className="link" style={{ marginTop: 12 }} onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>
        {mode === "in" ? "Шинээр бүртгүүлэх" : "Бүртгэлтэй бол нэвтрэх"}
      </button>
    </main>
  );
}
