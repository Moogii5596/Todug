import { createClient } from "@supabase/supabase-js";
import { LIKES, STAGES } from "@/lib/engine";

/* Хүүхдийн мэдээлэлд тулгуурлан нэмэлт тоглоом зохионо.
   Anthropic-ийн түлхүүр зөвхөн сервер талд байна. */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!url || !anon) return Response.json({ error: "Сервер тохируулагдаагүй байна." }, { status: 503 });
  if (!apiKey) return Response.json({ error: "Тоглоом зохиох хэсэг одоогоор идэвхгүй байна." }, { status: 503 });

  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ") || auth.length < 20) return Response.json({ error: "Нэвтэрнэ үү." }, { status: 401 });

  let body: { childId?: string; goal?: string };
  try { body = await request.json(); } catch { return Response.json({ error: "Буруу хүсэлт." }, { status: 400 }); }
  if (!body.childId) return Response.json({ error: "Буруу хүсэлт." }, { status: 400 });

  // Хэрэглэгчийн токеноор уншина: RLS нь зөвхөн өөрийн хүүхдийг буцаана
  const sb = createClient(url, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: user } = await sb.auth.getUser(auth.slice(7));
  if (!user.user) return Response.json({ error: "Нэвтэрнэ үү." }, { status: 401 });
  const { data: c } = await sb.from("todug_children").select("*").eq("id", body.childId).maybeSingle();
  if (!c) return Response.json({ error: "Хүүхдийн мэдээлэл олдсонгүй." }, { status: 404 });

  const likes = ((c.likes as string[]) ?? []).map(k => LIKES[k]?.label).filter(Boolean).join(", ") || "бөмбөг";
  const goal = String(body.goal ?? "").slice(0, 300);
  const prompt =
    "Чи хүүхдийн хэл ярианы хөгжлийг дэмжих тоглоом зохиодог туслах. Эцэг эх гэртээ хийх 3 богино тоглоом зохио.\n" +
    `Хүүхэд: ${c.years} нас ${c.months} сар, ${c.sex === "boy" ? "хүү" : "охин"}.\n` +
    `Одоогийн яриа: ${STAGES[c.stage]}.\nДуртай зүйл: ${likes}.\nЭнэ долоо хоногийн зорилго: ${goal}\n` +
    "Шаардлага: гэрт байдаг аюулгүй эд зүйл ашиглана (жижиг, залгих эрсдэлтэй зүйл хэрэглэхгүй). " +
    "Онош, эмчилгээний зөвлөгөө бичихгүй. Хүүхдийг шахахгүй, тоглоомын хэлбэртэй. " +
    "Энгийн, зөв бичгийн дүрэмтэй монгол кирилл хэлээр, богино бич.\n" +
    'Зөвхөн JSON буцаа, өөр юу ч бичихгүй: [{"name":"...","steps":["...","...","..."],"say":"эцэг эхийн хэлэх нэг жишээ өгүүлбэр"}]';

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error("anthropic " + res.status);
    const data = await res.json();
    const text: string = (data.content ?? []).map((i: { type: string; text?: string }) => (i.type === "text" ? i.text : "")).join("");
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const games = (Array.isArray(parsed) ? parsed : []).slice(0, 3).map((g: { name?: unknown; steps?: unknown; say?: unknown }) => ({
      name: String(g.name ?? ""),
      steps: Array.isArray(g.steps) ? g.steps.map(String).slice(0, 5) : [],
      say: g.say ? String(g.say) : undefined,
    }));
    return Response.json({ games });
  } catch (e) {
    console.error("games route failed", e);
    return Response.json({ error: "Тоглоом зохиож чадсангүй. Дахин оролдоно уу." }, { status: 502 });
  }
}
