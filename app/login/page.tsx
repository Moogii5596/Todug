"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordField from "@/components/PasswordField";
import { configured, getSupabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

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
const LEAD: Record<Mode, string> = {
  in: "Хүүхдийнхээ хичээл, ахицыг үргэлжлүүлнэ.",
  up: "Эхний долоо хоногийн хичээл үнэгүй.",
  forgot: "Бүртгэлтэй имэйлээ бичнэ үү. Нууц үг сэргээх холбоос илгээнэ.",
};
const ICONS = {
  google: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.500Z"/><path fill="#34A853" d="M12 23.500c3.100 0 5.700-1 7.600-2.800l-3.700-2.900c-1 .700-2.300 1.100-3.900 1.100-3 0-5.500-2-6.400-4.700H1.800v3A11.500 11.500 0 0 0 12 23.500Z"/><path fill="#FBBC05" d="M5.600 14.200a6.900 6.900 0 0 1 0-4.400v-3H1.800a11.500 11.500 0 0 0 0 10.400l3.800-3Z"/><path fill="#EA4335" d="M12 5.100c1.700 0 3.200.600 4.400 1.700l3.300-3.300A11.500 11.500 0 0 0 1.800 6.800l3.800 3C6.500 7.100 9 5.100 12 5.100Z"/></svg>,
  facebook: <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M13.500 21v-8h2.700l.4-3.100h-3.100v-2c0-.900.300-1.500 1.600-1.500h1.700V3.600c-.300 0-1.300-.100-2.400-.100-2.400 0-4.100 1.500-4.100 4.200v2.300H7.600V13h2.700v8h3.200Z"/></svg>,
};
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

  // Аль хэдийн нэвтэрсэн хэрэглэгчид нэвтрэх, бүртгүүлэх маягт харуулахгүй
  const { session, loading } = useSession();
  useEffect(() => {
    if (!loading && session) router.replace("/children");
  }, [loading, session, router]);

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
    // Бүртгэлтэй имэйлээр дахин бүртгүүлэхэд Supabase алдаа буцаахгүй, identities нь хоосон хэрэглэгч буцаадаг
    if (mode === "up" && !data.session && data.user && data.user.identities?.length === 0) {
      setMsg("Энэ имэйл бүртгэлтэй байна. Нэвтэрнэ үү. Нууц үгээ мартсан бол сэргээнэ үү.");
      return;
    }
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
    <main className="auth">
      <h1 className="page round">{TITLE[mode]}</h1>
      <p className="sub">{LEAD[mode]}</p>
      <div className="card">
      {mode !== "forgot" && oauth.length > 0 && (
        <div className="stack" style={{ marginBottom: 18 }}>
          {oauth.map(p => (
            <button key={p.id} type="button" className={"ghost social " + p.id} onClick={() => social(p.id)}>{ICONS[p.id]} {p.label}</button>
          ))}
          <p className="or">эсвэл имэйлээр</p>
        </div>
      )}
      <form onSubmit={submit} className="stack">
        <label className="f">Имэйл
          <input type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="ner@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        {mode !== "forgot" && (
          <PasswordField label="Нууц үг" value={password} onChange={setPassword}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            hint={mode === "up" ? "6-аас дээш тэмдэгт." : undefined} />
        )}
        {msg && <p className="err" role="alert">{msg}</p>}
        {ok && <p className="ok" role="status">{ok}</p>}
        <button className="cta" disabled={busy}>{busy && <span className="spin" />}{busy ? "Түр хүлээнэ үү…" : SUBMIT[mode]}</button>
        {mode === "up" && (
          <p className="muted" style={{ margin: 0, textAlign: "center" }}>
            Бүртгүүлснээр <Link href="/privacy">Нууцлалын бодлого</Link>-ыг зөвшөөрсөнд тооцно.
          </p>
        )}
      </form>
      </div>
      <div className="authlinks">
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
