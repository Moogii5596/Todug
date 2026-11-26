import { CONTENT } from "@/lib/content";
import { rowToProfile, type ChildRow } from "@/lib/children";
import { buildPlan, unlockedIds, type UnitContent } from "@/lib/engine";
import { userClient, UUID_RE } from "@/lib/server";

/* Хүүхдийн одоогийн 4 долоо хоногийн хичээлийн агуулгыг буцаана.
   Төлбөргүй хэрэглэгчид зөвхөн үнэгүй (хөтөлбөрийн эхний) долоо хоногийн агуулга очно:
   түгжээг энд, сервер талд шийднэ. */
export async function POST(request: Request) {
  const ctx = await userClient(request);
  if (ctx.fail) return ctx.fail;

  let body: { childId?: unknown } | null;
  try { body = await request.json(); } catch { return Response.json({ error: "Буруу хүсэлт." }, { status: 400 }); }
  const childId = body && typeof body === "object" ? body.childId : undefined;
  if (typeof childId !== "string" || !UUID_RE.test(childId)) return Response.json({ error: "Буруу хүсэлт." }, { status: 400 });

  const { data: c } = await ctx.sb.from("todug_children").select("*").eq("id", childId).maybeSingle();
  if (!c) return Response.json({ error: "Хүүхдийн мэдээлэл олдсонгүй." }, { status: 404 });

  const { data: access, error } = await ctx.sb.rpc("has_access");
  if (error) {
    console.error("lessons route: has_access failed", error);
    return Response.json({ error: "Хичээлийг ачаалж чадсангүй. Дахин оролдоно уу." }, { status: 503 });
  }

  const plan = buildPlan(rowToProfile(c as ChildRow));
  const units: Record<number, UnitContent> = {};
  for (const id of unlockedIds(plan, access === true)) units[id] = CONTENT[id];
  return Response.json({ access: access === true, units }, { headers: { "Cache-Control": "no-store" } });
}
