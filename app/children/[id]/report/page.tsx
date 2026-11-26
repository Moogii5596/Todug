"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "@/components/Icon";
import Loading from "@/components/Loading";
import { ageText, rowToProfile, type ChildRow } from "@/lib/children";
import { FLAGS, STAGES, UNITS, buildPlan, type Profile } from "@/lib/engine";
import { daysByUnit, runningTotal, weeklyCounts } from "@/lib/report";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

type Prog = { unit: number; day: number; created_at: string };
type Word = { word: string; kind: "says" | "understands"; created_at: string };
type Data = { profile: Profile; prog: Prog[]; words: Word[]; signs: Record<number, number>; now: number };

function Bars({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="bars" role="img" aria-label={label + ": " + values.join(", ")}>
      {values.map((v, i) => (
        <div key={i}>
          <span>{v}</span>
          <i style={{ height: Math.max(4, (v / max) * 100) + "%" }} className={v === 0 ? "zero" : ""} />
          <small>{i === values.length - 1 ? "одоо" : "-" + (values.length - 1 - i)}</small>
        </div>
      ))}
    </div>
  );
}

/* Ахицын тайлан: хийсэн дасгал, шат бүрийн байдал, үгийн сангийн өсөлт. Хэвлэж эмч, хэл засалчид үзүүлж болно. */
export default function Report() {
  const { id } = useParams<{ id: string }>();
  const { ready } = useRequireAuth();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!ready) return;
    const sb = getSupabase();
    (async () => {
      const child = await sb.from("todug_children").select("*").eq("id", id).maybeSingle();
      if (child.error || !child.data) { setErr("Энэ хүүхдийн мэдээлэл олдсонгүй."); return; }
      const [prog, words, checks] = await Promise.all([
        sb.from("todug_progress").select("unit, day, created_at").eq("child_id", id),
        sb.from("words").select("word, kind, created_at").eq("child_id", id).order("created_at"),
        sb.from("checkins").select("unit, signs").eq("child_id", id),
      ]);
      const signs: Record<number, number> = {};
      for (const c of (checks.data ?? []) as { unit: number; signs: number[] }[]) signs[c.unit] = Array.isArray(c.signs) ? c.signs.length : 0;
      setData({
        profile: rowToProfile(child.data as ChildRow), prog: (prog.data ?? []) as Prog[],
        words: (words.data ?? []) as Word[], signs, now: Date.now(),
      });
    })();
  }, [ready, id]);

  if (err) return <main><p className="err" role="alert">{err}</p><Link href="/children" className="ghost">Хүүхдүүд рүү буцах</Link></main>;
  if (!ready || !data) return <Loading />;

  const { profile: p, prog, words } = data;
  const now = new Date(data.now);
  const plan = buildPlan(p);
  const per = daysByUnit(prog);
  const total = Object.values(per).reduce((a, b) => a + b, 0);
  const says = words.filter(w => w.kind === "says");
  const understands = words.filter(w => w.kind === "understands");
  const practice = weeklyCounts(prog.map(r => r.created_at), now);
  const wordGrowth = runningTotal(says.map(w => w.created_at), now);
  const units = plan.seq.filter(u => (per[u] ?? 0) > 0 || (data.signs[u] ?? 0) > 0);
  const today = now.getFullYear() + "." + String(now.getMonth() + 1).padStart(2, "0") + "." + String(now.getDate()).padStart(2, "0");

  return (
    <main className="report">
      <Link href={"/children/" + id} className="link subtle back noprint"><Icon name="back" size={18} /> Төлөвлөгөө рүү буцах</Link>
      <h1 className="page round">Ахицын тайлан</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        {p.name || (p.sex === "boy" ? "Хүү" : "Охин")} · {ageText(p.years, p.months)} · {today}
      </p>

      <div className="tiles">
        <div><b className="round">{total}</b><span>хийсэн өдөр</span></div>
        <div><b className="round">{units.length}</b><span>ажилласан шат</span></div>
        <div><b className="round">{says.length}</b><span>хэлдэг үг</span></div>
        <div><b className="round">{understands.length}</b><span>ойлгодог үг</span></div>
      </div>

      <div className="card">
        <h3 className="round">Эхлэх үеийн байдал</h3>
        <dl className="facts">
          <dt>Яриа</dt><dd>{STAGES[p.stage]}</dd>
          <dt>Энэ насанд</dt><dd>Ихэнх хүүхэд {plan.exp.text}</dd>
          <dt>Одоогийн шат</dt><dd>{UNITS[plan.ids[0]].title}</dd>
          {p.flags.length > 0 && <><dt>Анзаарсан зүйл</dt><dd>{p.flags.map(f => FLAGS[f]).filter(Boolean).join("; ")}</dd></>}
        </dl>
      </div>

      <div className="card">
        <h3 className="round">Сүүлийн 8 долоо хоногт хийсэн өдөр</h3>
        <p className="muted">Долоо хоног бүрд тэмдэглэсэн дасгалын өдрийн тоо.</p>
        <Bars values={practice} label="Долоо хоног бүрд хийсэн өдөр" />
      </div>

      <div className="card">
        <h3 className="round">Хэлдэг үгийн тоо</h3>
        <p className="muted">Үгийн бүртгэлд «хэлдэг» гэж тэмдэглэсэн үгийн нийт тоо, долоо хоногоор.</p>
        <Bars values={wordGrowth} label="Хэлдэг үгийн нийт тоо" />
      </div>

      <div className="card">
        <h3 className="round">Шат бүрийн байдал</h3>
        {units.length === 0 ? <p className="muted">Одоогоор тэмдэглэсэн өдөр алга. Өдрийн хичээлээ хийгээд «хийлээ» гэж тэмдэглээрэй.</p> : (
          <ul className="stagerows">
            {units.map(u => (
              <li key={u}>
                <span><b>{UNITS[u].title}</b><small>{UNITS[u].goal}</small></span>
                <span className="nums"><b>{per[u] ?? 0}/7</b><small>{data.signs[u] ? data.signs[u] + " шинж ажиглагдсан" : "шинж тэмдэглээгүй"}</small></span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 className="round">Үгийн бүртгэл</h3>
        {words.length === 0 ? <p className="muted">Үг бүртгээгүй байна. Төлөвлөгөөний хуудасны «Миний хүүхдийн үгс» хэсэгт нэмээрэй.</p> : (
          <>
            {says.length > 0 && <><div className="use" style={{ marginTop: 8 }}>Хэлдэг ({says.length})</div><p className="wordline">{says.map(w => w.word).join(", ")}</p></>}
            {understands.length > 0 && <><div className="use" style={{ marginTop: 12 }}>Ойлгодог ({understands.length})</div><p className="wordline">{understands.map(w => w.word).join(", ")}</p></>}
          </>
        )}
      </div>

      {plan.alerts.length > 0 && (
        <div className="card">
          <h3 className="round">Мэргэжилтэнд хандах зөвлөмж</h3>
          <ul className="steps">{plan.alerts.map(a => <li key={a.t}><b>{a.t}.</b> {a.d}</li>)}</ul>
        </div>
      )}

      <button className="cta noprint" onClick={() => window.print()}><Icon name="print" size={18} /> Хэвлэх эсвэл PDF болгон хадгалах</button>
      <p className="foot">Энэ тайлан эцэг эхийн тэмдэглэлд тулгуурласан бөгөөд онош, үнэлгээ биш. Эмч, хэл засалчид үзүүлэхдээ нэмэлт мэдээлэл болгон ашиглаж болно.</p>
    </main>
  );
}
