"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PlanView from "@/components/PlanView";
import { rowToProfile, type ChildRow } from "@/lib/children";
import { buildPlan, type Profile } from "@/lib/engine";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function Child() {
  const { id } = useParams<{ id: string }>();
  const { ready } = useRequireAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [done, setDone] = useState<Record<number, number[]>>({});
  const [err, setErr] = useState("");
  const [progErr, setProgErr] = useState(false);
  const [moving, setMoving] = useState(false);
  const pending = useRef(new Set<string>());

  useEffect(() => {
    if (!ready) return;
    const sb = getSupabase();
    (async () => {
      const child = await sb.from("todug_children").select("*").eq("id", id).maybeSingle();
      if (child.error || !child.data) { setErr("Энэ хүүхдийн мэдээлэл олдсонгүй."); return; }
      const prog = await sb.from("todug_progress").select("unit, day").eq("child_id", id);
      const map: Record<number, number[]> = {};
      (prog.data ?? []).forEach((r: { unit: number; day: number }) => { (map[r.unit] ||= []).push(r.day); });
      setDone(map);
      setProgErr(!!prog.error);
      setProfile(rowToProfile(child.data as ChildRow));
    })();
  }, [ready, id]);

  /* Зөвхөн нэг (unit, day) нүдийг өөрчилнө: зэрэг явагдаж буй бусад өөрчлөлтийг дарж бичихгүй */
  function setCell(unit: number, day: number, on: boolean) {
    setDone(prev => {
      const rest = (prev[unit] ?? []).filter(d => d !== day);
      return { ...prev, [unit]: on ? [...rest, day] : rest };
    });
  }

  async function toggle(unit: number, day: number) {
    const key = unit + ":" + day;
    if (pending.current.has(key)) return;
    pending.current.add(key);
    const sb = getSupabase();
    const had = (done[unit] ?? []).includes(day);
    setCell(unit, day, !had);
    const { error } = had
      ? await sb.from("todug_progress").delete().eq("child_id", id).eq("unit", unit).eq("day", day)
      : await sb.from("todug_progress").insert({ child_id: id, unit, day });
    pending.current.delete(key);
    if (error) { setCell(unit, day, had); setErr("Тэмдэглэгээг хадгалж чадсангүй. Дахин оролдоно уу."); }
    else setErr("");
  }

  async function resetUnit(unit: number) {
    if (!window.confirm("Энэ долоо хоногийн тэмдэглэсэн өдрүүдийг арилгаж, дахин эхлүүлэх үү?")) return;
    const { error } = await getSupabase().from("todug_progress").delete().eq("child_id", id).eq("unit", unit);
    if (error) { setErr("Тэмдэглэгээг арилгаж чадсангүй. Дахин оролдоно уу."); return; }
    setDone(prev => ({ ...prev, [unit]: [] }));
    setErr("");
  }

  async function advance(delta: 4 | -4) {
    if (!profile || moving) return;
    const next = Math.max(0, buildPlan(profile).advance + delta);
    setMoving(true);
    const { error } = await getSupabase().from("todug_children").update({ advance: next }).eq("id", id);
    setMoving(false);
    if (error) { setErr("Шилжиж чадсангүй. Дахин оролдоно уу."); return; }
    setProfile(prev => (prev ? { ...prev, advance: next } : prev));
    setErr("");
  }

  async function remove() {
    if (!window.confirm("Энэ хүүхдийн мэдээлэл, ахицыг бүр мөсөн устгах уу?")) return;
    const { error } = await getSupabase().from("todug_children").delete().eq("id", id);
    if (error) { setErr("Устгаж чадсангүй. Дахин оролдоно уу."); return; }
    router.push("/children");
  }

  if (err && !profile) return <main><p className="err" role="alert">{err}</p><Link href="/children" className="ghost">Хүүхдүүд рүү буцах</Link></main>;
  if (!ready || !profile) return <main><p className="muted">Ачаалж байна…</p></main>;

  return (
    <main>
      {progErr && <p className="err" role="alert">Ахицыг ачаалж чадсангүй. Хуудсаа дахин ачаална уу.</p>}
      {err && <p className="err" role="alert">{err}</p>}
      <PlanView profile={profile} childId={id} done={done} onToggle={toggle} onAdvance={advance} onResetUnit={resetUnit} />
      <div className="rowbtns">
        <Link href={"/children/" + id + "/edit"} className="ghost">Мэдээлэл засах</Link>
        <button className="ghost danger" onClick={remove}>Хүүхдийг устгах</button>
      </div>
    </main>
  );
}
