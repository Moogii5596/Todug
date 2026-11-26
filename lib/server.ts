import { createClient } from "@supabase/supabase-js";
import { SCHEMA } from "./supabase";

/* API маршрутад: хүсэлтийн Bearer токеноор хэрэглэгчийн эрхтэй Supabase клиент үүсгэнэ.
   RLS үйлчилнэ: хэрэглэгч зөвхөн өөрийн мөрийг уншина. Алдаатай бол бэлэн Response буцаана. */
export async function userClient(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { fail: Response.json({ error: "Сервер тохируулагдаагүй байна." }, { status: 503 }) };
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ") || auth.length < 20) return { fail: Response.json({ error: "Нэвтэрнэ үү." }, { status: 401 }) };
  const sb = createClient(url, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false }, db: { schema: SCHEMA } });
  const { data } = await sb.auth.getUser(auth.slice(7));
  if (!data.user) return { fail: Response.json({ error: "Нэвтэрнэ үү." }, { status: 401 }) };
  return { sb, user: data.user };
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
