"use client";
import { useState } from "react";
import Link from "next/link";
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

type Mode = "in" | "up" | "forgot";
type AuthErr = { code?: string; status?: number; message?: string };

const RATE = "Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.";
const NOT_SET = "Supabase тохируулагдаагүй байна. README-г үзнэ үү.";
const TITLE: Record<Mode, string> = { in: "Нэвтрэх", up: "Бүртгүүлэх", forgot: "Нууц үг сэргээх" };
const SUBMIT: Record<Mode, string> = { in: "Нэвтрэх", up: "Бүртгүүлэх", forgot: "Холбоос авах" };

function isRate(e: AuthErr) {
  return e.status === 429 || e.code === "over_request_rate_limit" || e.code === "over_email_send_rate_limit"
    || /rate limit|too many/i.test(e.message ?? "");
}

/** Supabase-ийн алдааг (code, эсвэл message) монгол мессеж болгоно */
function explain(e: AuthErr, mode: Mode): string {
  const m = e.message ?? "";
  // Supabase-ийн имэйл илгээх хязгаар (цагт цөөн тооны имэйл): оролдлогын тооноос өөр шалтгаан
  if (e.code === "over_email_send_rate_limit" || /email rate limit/i.test(m))
    return "Баталгаажуулах имэйл илгээх хязгаарт хүрлээ. 1 цагийн дараа дахин оролдоно уу.";
  if (isRate(e)) return RATE;
  if (mode === "up") {
    if (e.code === "user_already_exists" || e.code === "email_exists" || /already registered/i.test(m))
      return "Энэ имэйл бүртгэлтэй байна. Нэвтэрнэ үү.";
    if (e.code === "weak_password" || /password should be/i.test(m))
      return "Нууц үг хэт богино эсвэл амархан байна. Өөр нууц үг сонгоно уу.";
    // Supabase дээр "Allow new users to sign up" эсвэл Email provider унтраалттай үед
    if (e.code === "signup_disabled" || e.code === "email_provider_disabled" || /signups not allowed/i.test(m))
      return "Одоогоор шинэ бүртгэл хаалттай байна. Удахгүй нээгдэнэ.";
    return "Бүртгэж чадсангүй. Дахин оролдоно уу.";
  }
  if (e.code === "email_not_confirmed" || /email not confirmed/i.test(m))
    return "Имэйлээ баталгаажуулаагүй байна. Имэйл рүү ирсэн холбоосыг дарна уу.";
  if (e.code === "invalid_credentials" || /invalid login credentials/i.test(m))
    return "Имэйл эсвэл нууц үг буруу байна.";
  return "Нэвтэрч чадсангүй. Дахин оролдоно уу.";
}

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  function go(m: Mode) { setMode(m); setMsg(""); setOk(""); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setOk("");
    if (!configured) { setMsg(NOT_SET); return; }
    const sb = getSupabase();

    if (mode === "forgot") {
      setBusy(true);
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset" });
      setBusy(false);
      // Имэйл бүртгэлтэй эсэхийг задлахгүйн тулд хариу үргэлж ижил
      if (error && isRate(error)) { setMsg(RATE); return; }
      setOk("Хэрэв энэ имэйл бүртгэлтэй бол нууц үг сэргээх холбоос илгээлээ.");
      return;
    }

    if (password.length < 6) { setMsg("Нууц үг 6-аас дээш тэмдэгттэй байна."); return; }
    setBusy(true);
    const { data, error } = mode === "in"
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/children" } });
    setBusy(false);
    if (error) { setMsg(explain(error, mode)); return; }
    if (!data.session) { setOk("Имэйл рүү тань баталгаажуулах холбоос илгээлээ. Баталгаажуулаад нэвтэрнэ үү."); return; }
    router.push("/children");
  }

  async function social(provider: "google" | "facebook") {
    setMsg(""); setOk("");
    if (!configured) { setMsg(NOT_SET); return; }
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + "/children" },
    });
    if (error) setMsg("Нэвтэрч чадсангүй. Дахин оролдоно уу.");
  }

  return (
    <main>
      <h1 className="page round">{TITLE[mode]}</h1>
      {mode !== "forgot" && oauth.length > 0 && (
        <div className="stack" style={{ marginBottom: 18 }}>
          {oauth.map(p => (
            <button key={p.id} type="button" className={"ghost social " + p.id} onClick={() => social(p.id)}>{p.label}</button>
          ))}
          <p className="or">эсвэл имэйлээр</p>
        </div>
      )}
      <form onSubmit={submit} className="stack">
        {mode === "forgot" && <p className="muted" style={{ margin: 0 }}>Бүртгэлтэй имэйлээ бичнэ үү. Нууц үг сэргээх холбоос илгээнэ.</p>}
        <label className="f">Имэйл
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        {mode !== "forgot" && (
          <label className="f">Нууц үг
            <input type="password" required autoComplete={mode === "in" ? "current-password" : "new-password"}
              value={password} onChange={e => setPassword(e.target.value)} />
          </label>
        )}
        {msg && <p className="err" role="alert">{msg}</p>}
        {ok && <p className="ok" role="status">{ok}</p>}
        <button className="cta" disabled={busy}>{busy ? "Түр хүлээнэ үү…" : SUBMIT[mode]}</button>
        {mode === "up" && (
          <p className="muted" style={{ margin: 0 }}>
            Бүртгүүлснээр <Link href="/privacy">Нууцлалын бодлого</Link>-ыг зөвшөөрсөнд тооцно.
          </p>
        )}
      </form>
      <div className="stack" style={{ marginTop: 12, gap: 0, alignItems: "flex-start" }}>
        {mode === "in" && <button className="link" onClick={() => go("forgot")}>Нууц үгээ мартсан уу?</button>}
        {mode === "forgot"
          ? <button className="link" onClick={() => go("in")}>Нэвтрэх рүү буцах</button>
          : <button className="link" onClick={() => go(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "Шинээр бүртгүүлэх" : "Бүртгэлтэй бол нэвтрэх"}
            </button>}
      </div>
    </main>
  );
}
