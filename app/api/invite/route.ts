import { createClient } from "@supabase/supabase-js";
import { userClient } from "@/lib/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Админ: имэйлээр урилгын холбоос үүсгэнэ. Имэйл илгээхгүй: холбоосыг админ өөрөө хэрэглэгчид дамжуулна.
   Хэрэглэгч холбоосоор орж /reset хуудсанд нууц үгээ өөрөө зохионо.
   SUPABASE_SERVICE_ROLE_KEY зөвхөн сервер талд ашиглагдана. */
export async function POST(request: Request) {
  const ctx = await userClient(request);
  if (ctx.fail) return ctx.fail;
  const { data: admin } = await ctx.sb.rpc("is_admin");
  if (admin !== true) return Response.json({ error: "Эрхгүй байна." }, { status: 403 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service)
    return Response.json({ error: "Урилга үүсгэх хэсэг тохируулагдаагүй байна (SUPABASE_SERVICE_ROLE_KEY)." }, { status: 503 });

  let body: { email?: unknown } | null;
  try { body = await request.json(); } catch { return Response.json({ error: "Буруу хүсэлт." }, { status: 400 }); }
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) return Response.json({ error: "Имэйл хаяг буруу байна." }, { status: 400 });

  // Холбоос зөвхөн энэ сайтын /reset рүү буцна (хүсэлтийн Origin-д найдахгүй, серверийн хаягаас авна)
  const redirectTo = new URL("/reset", request.url).toString();
  const sb = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  // Шинэ хэрэглэгч бол урилга; аль хэдийн бүртгэлтэй бол нууц үг тохируулах холбоос
  let existing = false;
  let res = await sb.auth.admin.generateLink({ type: "invite", email, options: { redirectTo } });
  if (res.error) {
    existing = true;
    res = await sb.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
  }
  const link = res.data?.properties?.action_link;
  if (res.error || !link) {
    console.error("invite route failed", res.error);
    return Response.json({ error: "Урилга үүсгэж чадсангүй. Дахин оролдоно уу." }, { status: 502 });
  }
  return Response.json({ email, link, existing }, { headers: { "Cache-Control": "no-store" } });
}
