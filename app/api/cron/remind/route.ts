import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { timingSafeEqual } from "node:crypto";
import { rowToProfile, type ChildRow } from "@/lib/children";
import { buildPlan } from "@/lib/engine";
import { reminderFor, reminderKind, ubWeekday } from "@/lib/reminders";
import { SCHEMA } from "@/lib/supabase";

/* Сануулга илгээх. Vercel Cron (vercel.json) даваа, лхагва, бямба гарагт 11:00 UTC (УБ 19:00)-д дуудна.
   Vercel нь CRON_SECRET-ийг Authorization: Bearer толгойгоор дамжуулдаг: өөр хэн ч дуудаж чадахгүй. */
function authorized(request: Request, secret: string) {
  const got = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from("Bearer " + secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

type Sub = { endpoint: string; user_id: string; p256dh: string; auth: string };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!secret || !url || !service || !pub || !priv) return Response.json({ error: "not configured" }, { status: 503 });
  if (!authorized(request, secret)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const kind = reminderKind(ubWeekday(new Date()));
  if (!kind) return Response.json({ sent: 0, skipped: "not a reminder day" });

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", pub, priv);
  const sb = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: SCHEMA } });

  const { data: subs, error } = await sb.from("push_subscriptions").select("endpoint, user_id, p256dh, auth").limit(5000);
  if (error) { console.error("remind: subscriptions read failed", error); return Response.json({ error: "read failed" }, { status: 503 }); }
  const list = (subs ?? []) as Sub[];
  if (!list.length) return Response.json({ sent: 0 });

  /* Хэрэглэгч бүрийн хамгийн сүүлд нэмсэн хүүхдийн одоогийн шат */
  const users = [...new Set(list.map(s => s.user_id))];
  const { data: kids } = await sb.from("todug_children").select("*").in("user_id", users).order("created_at", { ascending: false });
  const unitOf = new Map<string, number>();
  for (const k of (kids ?? []) as (ChildRow & { user_id: string })[]) {
    if (unitOf.has(k.user_id)) continue;
    try { unitOf.set(k.user_id, buildPlan(rowToProfile(k)).ids[0]); } catch { /* буруу мөрийг алгасна */ }
  }

  let sent = 0, removed = 0, failed = 0;
  await Promise.all(list.map(async s => {
    const payload = JSON.stringify(reminderFor(kind, unitOf.get(s.user_id) ?? null));
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 12 * 60 * 60 });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      /* Бүртгэл хүчингүй болсон (хэрэглэгч зөвшөөрлөө цуцалсан): мөрийг устгана */
      if (code === 404 || code === 410) { await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint); removed++; }
      else { failed++; console.error("remind: send failed", code); }
    }
  }));
  return Response.json({ kind, sent, removed, failed });
}
