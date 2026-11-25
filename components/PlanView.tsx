"use client";
import { useMemo, useState } from "react";
import { LIKES, STAGES, UNITS, buildPlan, fill, type Like, type Profile, type Unit } from "@/lib/engine";
import { ageText } from "@/lib/children";
import { getSupabase } from "@/lib/supabase";

type Game = { name: string; steps: string[]; say?: string };
type Props = { profile: Profile; childId: string; done: Record<number, number[]>; onToggle: (week: number, day: number) => void };

function Talk({ talk, v, childName }: { talk: string[][]; v: Like; childName: string }) {
  return (
    <div className="talk">
      {talk.map((t, i) => {
        if (t[0] === "w") return <div key={i} className="say w">5–10 секунд хүлээнэ</div>;
        if (t[0] === "a") return <div key={i} className="say a" dangerouslySetInnerHTML={{ __html: fill(t[1], v) }} />;
        return (
          <div key={i} style={{ display: "contents" }}>
            <div className="cap" style={{ alignSelf: t[0] === "p" ? "flex-start" : "flex-end" }}>{t[0] === "p" ? "Та" : childName}</div>
            {/* Агуулга нь lib/engine.ts дахь тогтмол текст тул HTML-ээр оруулахад аюулгүй */}
            <div className={"say " + t[0]} dangerouslySetInnerHTML={{ __html: fill(t[1], v) }} />
          </div>
        );
      })}
    </div>
  );
}

function UnitBlock({ u, weekIdx, p }: { u: Unit; weekIdx: number; p: Profile }) {
  return (
    <>
      <h2 className="round" style={{ fontSize: 22, margin: "0 0 8px" }}>{u.title}</h2>
      <p className="goal"><b>Зорилго:</b> {u.goal}</p>
      {u.note && <div className="alert amber">{u.note}</div>}
      {u.lessons.map((l, i) => {
        const v = LIKES[p.likes[(weekIdx + i) % p.likes.length]] ?? LIKES.ball;
        return (
          <div className="card lesson" key={l.name}>
            <h3 className="round">{l.name}</h3>
            <div className="use">Хэрэглэх зүйл: {v.n}, {v.n2}</div>
            <ul className="steps">{l.steps.map(s => <li key={s}>{s}</li>)}</ul>
            <Talk talk={l.talk} v={v} childName={p.name || "Хүүхэд"} />
          </div>
        );
      })}
    </>
  );
}

export default function PlanView({ profile: p, childId, done, onToggle }: Props) {
  const plan = useMemo(() => buildPlan(p), [p]);
  const [week, setWeek] = useState<number | "x">(0);
  const [games, setGames] = useState<Game[]>([]);
  const [aiMsg, setAiMsg] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const who = p.name || (p.sex === "boy" ? "Таны хүү" : "Таны охин");
  const per = p.time === 10 ? 10 : p.time / 2;
  const times = p.time === 10 ? 1 : 2;
  const unit = week === "x" ? UNITS[plan.extra as number] : UNITS[plan.ids[week]];
  const weekDone = week === "x" ? [] : done[week] ?? [];

  async function makeGames() {
    setAiBusy(true); setAiMsg("");
    try {
      const { data } = await getSupabase().auth.getSession();
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (data.session?.access_token ?? "") },
        body: JSON.stringify({ childId, goal: unit.goal }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "error");
      setGames(json.games);
    } catch (e) {
      setGames([]);
      setAiMsg(e instanceof Error && e.message !== "error" ? e.message : "Тоглоом зохиож чадсангүй. Дахин оролдоно уу.");
    }
    setAiBusy(false);
  }

  return (
    <div>
      <div className="card">
        <h2 className="round">{who}: {plan.verdict}</h2>
        <dl className="facts">
          <dt>Нас, хүйс</dt><dd>{ageText(p.years, p.months)}, {p.sex === "boy" ? "хүү" : "охин"}</dd>
          <dt>Одоо</dt><dd>{STAGES[p.stage]}</dd>
          <dt>Энэ насанд</dt><dd>Ихэнх хүүхэд {plan.exp.text}</dd>
          <dt>Эхлэх шат</dt><dd>{UNITS[plan.ids[0]].title}</dd>
        </dl>
      </div>

      {plan.alerts.map(a => (
        <div key={a.t} className={"alert " + a.lvl}><b>{a.t}</b>{a.d}</div>
      ))}

      <div className="card">
        <h3 className="round">Өдөр бүр: {times} удаа, тус бүр {per} минут</h3>
        <ol className="routine">
          <li>2 минут: хөөс үлээх, амьтны дуу дуурайх</li>
          <li>{per - 4} минут: тухайн долоо хоногийн нэг хичээл</li>
          <li>2 минут: зурагтай ном эсвэл хүүхдийн дуу</li>
        </ol>
        <p className="muted" style={{ marginTop: 8 }}>
          Дэлгэцээ унтрааж, шалан дээр нүүр тулж сууна. Хүүхэд нэг үг хэлбэл та нэг үг нэмж давтана.
        </p>
      </div>

      <div className="tabs" role="tablist" style={{ gridTemplateColumns: `repeat(${plan.ids.length + (plan.extra != null ? 1 : 0)}, 1fr)` }}>
        {plan.ids.map((_, i) => (
          <button key={i} role="tab" aria-selected={week === i} onClick={() => setWeek(i)}>{i + 1}-р долоо хоног</button>
        ))}
        {plan.extra != null && <button role="tab" aria-selected={week === "x"} onClick={() => setWeek("x")}>Нэмэлт</button>}
      </div>

      <UnitBlock u={unit} weekIdx={week === "x" ? 0 : week} p={p} />

      {week !== "x" && (
        <div className="card">
          <h3 className="round">Хийсэн өдрөө тэмдэглэ</h3>
          <p className="muted">{weekDone.length} / 7 өдөр. Зорилго биелээгүй бол энэ долоо хоногоо давтана.</p>
          <div className="days">
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <button key={d} aria-pressed={weekDone.includes(d)} aria-label={d + "-р өдөр"} onClick={() => onToggle(week, d)}>{d}</button>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="round">Нэмэлт тоглоом</h3>
        <p className="muted">Хүүхдийн тань мэдээлэлд тулгуурлан хиймэл оюунаар шинэ тоглоом зохиолгоно.</p>
        <button className="ghost" onClick={makeGames} disabled={aiBusy}>
          {aiBusy ? "Зохиож байна…" : games.length ? "Өөр тоглоом зохиолгох" : "Шинэ тоглоом зохиолгох"}
        </button>
        {aiMsg && <p className="err" style={{ marginTop: 12 }}>{aiMsg}</p>}
        {games.map(g => (
          <div className="card lesson" key={g.name} style={{ background: "var(--bg)", marginTop: 12 }}>
            <h3 className="round">{g.name}</h3>
            <ul className="steps">{(g.steps || []).map(s => <li key={s}>{s}</li>)}</ul>
            {g.say && <div className="talk" style={{ background: "var(--surface)" }}><div className="say p">{g.say}</div></div>}
          </div>
        ))}
        {games.length > 0 && <p className="muted" style={{ marginTop: 8 }}>Хиймэл оюунаар зохиосон тул хүүхэддээ тохирох эсэхийг өөрөө нягтлаарай.</p>}
      </div>

      <p className="foot">Энэ төлөвлөгөө онош биш, гэрийн дэмжлэг юм. Санаа зовоосон зүйл байвал хэл засалч, хүүхдийн эмчид хандаарай.</p>
    </div>
  );
}
