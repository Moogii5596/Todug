"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "@/components/Icon";
import Loading from "@/components/Loading";
import { rowToProfile, type ChildRow } from "@/lib/children";
import { LIKES, ROUTINES, UNITS, buildPlan, fill, type Profile, type UnitContent } from "@/lib/engine";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

const strip = (s: string) => s.replace(/<\/?mark>/g, "");

/* Долоо хоногийн хэвлэх хуудас: арга, хийх ба хийхгүй зүйл, 7 өдрийн хичээлийг нэг хуудсанд багтаана */
export default function WeekSheet() {
  const { id, unit } = useParams<{ id: string; unit: string }>();
  const { ready } = useRequireAuth();
  const [state, setState] = useState<{ profile: Profile; u: UnitContent | null; weekIdx: number } | null>(null);
  const [err, setErr] = useState("");
  const unitId = Number(unit);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const sb = getSupabase();
      if (!Number.isInteger(unitId) || unitId < 0 || unitId >= UNITS.length) { setErr("Ийм хичээл алга."); return; }
      const child = await sb.from("todug_children").select("*").eq("id", id).maybeSingle();
      if (child.error || !child.data) { setErr("Энэ хүүхдийн мэдээлэл олдсонгүй."); return; }
      const profile = rowToProfile(child.data as ChildRow);
      const { data } = await sb.auth.getSession();
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (data.session?.access_token ?? "") },
        body: JSON.stringify({ childId: id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setErr("Хичээлийг ачаалж чадсангүй. Хуудсаа дахин ачаална уу."); return; }
      const plan = buildPlan(profile);
      setState({ profile, u: (json.units ?? {})[unitId] ?? null, weekIdx: Math.max(0, plan.seq.indexOf(unitId)) });
    })();
  }, [ready, id, unitId]);

  if (err) return <main><p className="err" role="alert">{err}</p><Link href={"/children/" + id} className="ghost">Төлөвлөгөө рүү буцах</Link></main>;
  if (!ready || !state) return <Loading />;
  const { profile: p, u, weekIdx } = state;
  if (!u) return (
    <main>
      <div className="card">
        <h2 className="round">Энэ долоо хоногийн хуудас төлбөртэй</h2>
        <p className="muted">Хэвлэх хуудас нь нээлттэй долоо хоногийн хичээлд л гарна.</p>
        <Link href="/billing" className="cta" style={{ marginTop: 12 }}>Багц сонгох</Link>
      </div>
      <Link href={"/children/" + id} className="ghost">Төлөвлөгөө рүү буцах</Link>
    </main>
  );

  const like = (i: number) => LIKES[p.likes[(weekIdx + i) % p.likes.length]] ?? LIKES.ball;
  const words = [...new Set(u.words.map(w => fill(w, like(0))))];
  return (
    <main className="sheet">
      <Link href={"/children/" + id} className="link subtle back noprint"><Icon name="back" size={18} /> Төлөвлөгөө рүү буцах</Link>
      <button className="cta noprint" style={{ marginBottom: 16 }} onClick={() => window.print()}><Icon name="print" size={18} /> Хэвлэх эсвэл PDF болгон хадгалах</button>

      <div className="use">{p.name ? p.name + " · " : ""}Долоо хоногийн хуудас</div>
      <h1 className="page round" style={{ marginBottom: 4 }}>{UNITS[unitId].title}</h1>
      <p className="goal"><b>Зорилго:</b> {UNITS[unitId].goal}</p>

      <div className="card">
        <h3 className="round">Энэ долоо хоногийн арга: {u.strategy.name}</h3>
        <ul className="dolist">
          {u.strategy.how.map(s => <li key={s}><span className="mk yes"><Icon name="check" size={14} /></span>{s}</li>)}
          {u.avoid.map(s => <li key={s}><span className="mk nope"><Icon name="no" size={14} /></span>{s}</li>)}
        </ul>
        <div className="use" style={{ marginTop: 12 }}>Олон давтах үг, хэллэг</div>
        <p className="wordline">{words.join(" · ")}</p>
      </div>

      {u.days.map((d, i) => {
        const v = like(i);
        const say = d.talk.filter(t => t[0] === "p").map(t => strip(fill(t[1], v)));
        return (
          <div className="card sheetday" key={i}>
            <div className="dayhead">
              <span className="badge big"><Icon name={d.routine} size={24} /></span>
              <div>
                <div className="use">{i + 1}-р өдөр · {ROUTINES[d.routine]}</div>
                <h4 className="round">{fill(d.title, v)}</h4>
              </div>
              <span className="tick" aria-hidden="true" />
            </div>
            <p className="need"><b>Хэрэгтэй зүйл:</b> {fill(d.need, v)}</p>
            <ol className="numsteps">{d.steps.map(s => <li key={s}>{fill(s, v)}</li>)}</ol>
            <p className="need"><b>Хэлэх үг:</b> {say.join(" → ")}</p>
          </div>
        );
      })}
      <p className="foot">Todug онош тавихгүй. Гэрийн дасгал нь хэл засалч, эмчийн үзлэгийг орлохгүй.</p>
    </main>
  );
}
