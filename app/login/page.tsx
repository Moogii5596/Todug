"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { configured, getSupabase } from "@/lib/supabase";

/* Vercel дээрх NEXT_PUBLIC_OAUTH_PROVIDERS хувьсагчид бичигдсэн үйлчилгээний товч л харагдана.
   Жишээ нь: google,facebook. Supabase дээр тухайн үйлчилгээг идэвхжүүлсний дараа нэмнэ. */
const PROVIDERS: { id: "google" | "facebook"; label: string }[] = [
  { id: "google", label: "Google-ээр нэвтрэх" },
  { id: "facebook", label: "Facebook-ээр нэвтрэх" },
];
const enabled = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? "").split(",").map(x => x.trim().toLowerCase());
const oauth = PROVIDERS.filter(p => enabled.includes(p.id));

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
      : await sb.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/children" } });
    setBusy(false);
    if (error) { setMsg(mode === "in" ? "Имэйл эсвэл нууц үг буруу байна." : "Бүртгэж чадсангүй: " + error.message); return; }
    if (!data.session) { setMsg("Имэйл рүү тань баталгаажуулах холбоос илгээлээ. Баталгаажуулаад нэвтэрнэ үү."); return; }
    router.push("/children");
  }

  async function social(provider: "google" | "facebook") {
    setMsg("");
    if (!configured) { setMsg("Supabase тохируулагдаагүй байна. README-г үзнэ үү."); return; }
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + "/children" },
    });
    if (error) setMsg("Нэвтэрч чадсангүй. Дахин оролдоно уу.");
  }

  return (
    <main>
      <h1 className="page round">{mode === "in" ? "Нэвтрэх" : "Бүртгүүлэх"}</h1>
      {oauth.length > 0 && (
        <div className="stack" style={{ marginBottom: 18 }}>
          {oauth.map(p => (
            <button key={p.id} type="button" className={"ghost social " + p.id} onClick={() => social(p.id)}>{p.label}</button>
          ))}
          <p className="or">эсвэл имэйлээр</p>
        </div>
      )}
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
