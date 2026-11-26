"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { weekRecap } from "@/lib/engine";
import { getSupabase } from "@/lib/supabase";

/* Долоо хоногийн өөрийн зорилго ба тайлан: "зорилго 4, хийсэн 5". Тасралтгүй өдрийн тоолуур биш. */
export default function WeekGoal({ childId, unitId, done, access }: { childId: string; unitId: number; done: number; access: boolean }) {
  /* undefined = ачаалж байна эсвэл боломжгүй; null = зорилго тавиагүй */
  const [goal, setGoal] = useState<number | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let off = false;
    getSupabase().from("week_goals").select("days").eq("child_id", childId).eq("unit", unitId).maybeSingle()
      .then(({ data, error }) => { if (!off && !error) setGoal(data ? (data.days as number) : null); });
    return () => { off = true; };
  }, [childId, unitId]);

  if (goal === undefined) return null;

  async function save(days: number) {
    const { error } = await getSupabase().from("week_goals").upsert({ child_id: childId, unit: unitId, days });
    if (error) { setMsg("Зорилгыг хадгалж чадсангүй. Дахин оролдоно уу."); return; }
    setGoal(days); setEditing(false); setMsg("");
  }

  const r = weekRecap(done, goal);
  return (
    <div className="goalbox">
      {goal == null || editing ? (
        <>
          <b>Энэ долоо хоногт хэдэн өдөр хийх вэ?</b>
          <div className="days" role="group" aria-label="Долоо хоногийн зорилго">
            {[3, 4, 5, 6, 7].map(n => (
              <button key={n} aria-pressed={goal === n} aria-label={n + " өдөр"} onClick={() => save(n)}>{n}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <b>Зорилго {r.goal} өдөр, хийсэн {r.done} өдөр.</b>{" "}
          {r.met ? "Зорилгодоо хүрлээ!" : "Үлдсэн " + ((r.goal ?? 0) - r.done) + " өдөр."}{" "}
          <button className="link" style={{ padding: 0 }} onClick={() => setEditing(true)}>Зорилгоо өөрчлөх</button>
          {r.met && !access && (
            <p style={{ margin: "8px 0 0" }}>
              Үнэгүй долоо хоногоо амжилттай хийлээ. <Link href="/billing">Дараагийн долоо хоногуудыг нээх</Link>
            </p>
          )}
        </>
      )}
      {msg && <p className="err" role="alert" style={{ margin: "8px 0 0" }}>{msg}</p>}
    </div>
  );
}
