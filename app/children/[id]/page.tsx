"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PlanView from "@/components/PlanView";
import { rowToProfile, type ChildRow } from "@/lib/children";
import type { Profile } from "@/lib/engine";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function Child() {
  const { id } = useParams<{ id: string }>();
  const { ready } = useRequireAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [done, setDone] = useState<Record<number, number[]>>({});
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!ready) return;
    const sb = getSupabase();
    (async () => {
      const child = await sb.from("todug_children").select("*").eq("id", id).maybeSingle();
      if (child.error || !child.data) { setErr("Энэ хүүхдийн мэдээлэл олдсонгүй."); return; }
      const prog = await sb.from("todug_progress").select("week, day").eq("child_id", id);
      const map: Record<number, number[]> = {};
      (prog.data ?? []).forEach((r: { week: number; day: number }) => { (map[r.week] ||= []).push(r.day); });
      setDone(map);
      setProfile(rowToProfile(child.data as ChildRow));
    })();
  }, [ready, id]);

  async function toggle(week: number, day: number) {
    const sb = getSupabase();
    const had = (done[week] ?? []).includes(day);
    const next = { ...done, [week]: had ? done[week].filter(d => d !== day) : [...(done[week] ?? []), day] };
    setDone(next);
    const { error } = had
      ? await sb.from("todug_progress").delete().eq("child_id", id).eq("week", week).eq("day", day)
      : await sb.from("todug_progress").insert({ child_id: id, week, day });
    if (error) { setDone(done); setErr("Тэмдэглэгээг хадгалж чадсангүй. Дахин оролдоно уу."); }
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
      {err && <p className="err" role="alert">{err}</p>}
      <PlanView profile={profile} childId={id} done={done} onToggle={toggle} />
      <div className="rowbtns">
        <Link href={"/children/" + id + "/edit"} className="ghost">Мэдээлэл засах</Link>
        <button className="ghost danger" onClick={remove}>Хүүхдийг устгах</button>
      </div>
    </main>
  );
}
