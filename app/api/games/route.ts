import { createClient } from "@supabase/supabase-js";
import { LIKES, STAGES, UNITS } from "@/lib/engine";
import { ageFromBirth } from "@/lib/children";
import { SCHEMA } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAILY_LIMIT = 10;

type Game = { name: string; steps: string[]; say?: string };

/* Текстээс эхний бүрэн JSON массивыг олж задлана (өмнө, хойно нь илүү үг байж болно). */
function firstJsonArray(text: string): unknown[] | null {
  for (let start = text.indexOf("["); start !== -1; start = text.indexOf("[", start + 1)) {
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === "[" || ch === "{") depth++;
      else if (ch === "]" || ch === "}") {
        if (--depth === 0) {
          try {
            const v: unknown = JSON.parse(text.slice(start, i + 1));
            if (Array.isArray(v)) return v;
          } catch { /* дараагийн "[" -ээс дахин оролдоно */ }
          break;
        }
      }
    }
  }
  return null;
}

function clean(v: unknown, max: number): string {
  if (typeof v !== "string" && typeof v !== "number") return "";
  return String(v).replace(/\s+/g, " ").trim().slice(0, max);
}

function parseGames(text: string): Game[] {
  const arr = firstJsonArray(text) ?? [];
  const games: Game[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const g = item as { name?: unknown; steps?: unknown; say?: unknown };
    const name = clean(g.name, 80);
    const steps = (Array.isArray(g.steps) ? g.steps : []).map(s => clean(s, 200)).filter(Boolean).slice(0, 5);
    if (!name || !steps.length) continue;
    const say = clean(g.say, 200);
    games.push(say ? { name, steps, say } : { name, steps });
    if (games.length === 3) break;
  }
  return games;
}

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

  let body: { childId?: unknown; unit?: unknown } | null;
  try { body = await request.json(); } catch { return Response.json({ error: "Буруу хүсэлт." }, { status: 400 }); }
  const childId = body && typeof body === "object" ? body.childId : undefined;
  const unitIdx = body && typeof body === "object" ? body.unit : undefined;
  if (typeof childId !== "string" || !UUID_RE.test(childId)) return Response.json({ error: "Буруу хүсэлт." }, { status: 400 });
  if (typeof unitIdx !== "number" || !Number.isInteger(unitIdx) || unitIdx < 0 || unitIdx >= UNITS.length)
    return Response.json({ error: "Буруу хүсэлт." }, { status: 400 });
  const unit = UNITS[unitIdx];

  // Хэрэглэгчийн токеноор уншина: RLS нь зөвхөн өөрийн хүүхдийг буцаана
  const sb = createClient(url, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false }, db: { schema: SCHEMA } });
  const { data: user } = await sb.auth.getUser(auth.slice(7));
  if (!user.user) return Response.json({ error: "Нэвтэрнэ үү." }, { status: 401 });
  const { data: c } = await sb.from("todug_children").select("*").eq("id", childId).maybeSingle();
  if (!c) return Response.json({ error: "Хүүхдийн мэдээлэл олдсонгүй." }, { status: 404 });

  // Хязгаар: сүүлийн 24 цагт хэрэглэгч бүр 10 удаа
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await sb.from("todug_game_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.user.id).gte("created_at", since);
  if (countError || count == null) {
    console.error("games route: rate limit count failed", countError);
    return Response.json({ error: "Тоглоом зохиох хэсэг түр ажиллахгүй байна. Дараа дахин оролдоно уу." }, { status: 503 });
  }
  if (count >= DAILY_LIMIT)
    return Response.json({ error: "Өнөөдрийн тоглоом зохиох хязгаарт хүрлээ. Маргааш дахин оролдоно уу." }, { status: 429 });
  // Загварыг дуудахаас өмнө хүсэлтийг бүртгэнэ; бүртгэж чадахгүй бол дуудахгүй
  const { error: insertError } = await sb.from("todug_game_requests").insert({ user_id: user.user.id });
  if (insertError) {
    console.error("games route: rate limit insert failed", insertError);
    return Response.json({ error: "Тоглоом зохиох хэсэг түр ажиллахгүй байна. Дараа дахин оролдоно уу." }, { status: 503 });
  }

  // Prompt-д зөвхөн серверийн тогтсон утгууд орно (хэрэглэгчийн чөлөөт бичвэр, хүүхдийн нэр орохгүй)
  const likes = (Array.isArray(c.likes) ? (c.likes as unknown[]) : [])
    .map(k => (typeof k === "string" ? LIKES[k]?.label : undefined)).filter(Boolean).join(", ") || "бөмбөг";
  const age = ageFromBirth(c.birth_month as string);
  const stage = STAGES[c.stage as number] ?? STAGES[STAGES.length - 1];
  const prompt =
    "Чи хүүхдийн хэл ярианы хөгжлийг дэмжих тоглоом зохиодог туслах. Эцэг эх гэртээ хийх 3 богино тоглоом зохио.\n" +
    `Хүүхэд: ${age.years} нас ${age.months} сар, ${c.sex === "boy" ? "хүү" : "охин"}.\n` +
    `Одоогийн яриа: ${stage}.\nДуртай зүйл: ${likes}.\n` +
    `Одоогийн хичээлийн шат: ${unit.title}.\nЭнэ шатны зорилго: ${unit.goal}\n` +
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
    const text: string = (Array.isArray(data?.content) ? data.content : [])
      .map((i: { type?: string; text?: unknown }) => (i?.type === "text" && typeof i.text === "string" ? i.text : "")).join("");
    const games = parseGames(text);
    if (!games.length) throw new Error("no valid games in model output");
    return Response.json({ games });
  } catch (e) {
    console.error("games route failed", e);
    return Response.json({ error: "Тоглоом зохиож чадсангүй. Дахин оролдоно уу." }, { status: 502 });
  }
}
