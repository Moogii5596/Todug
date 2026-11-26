"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LIKES, STAGES, UNITS, buildPlan, fill, type Like, type Profile, type Unit, type UnitContent } from "@/lib/engine";
import { ageText } from "@/lib/children";
import { getSupabase } from "@/lib/supabase";

type Game = { name: string; steps: string[]; say?: string };
type Props = {
  profile: Profile; childId: string;
  done: Record<number, number[]>;   /* түлхүүр нь UNITS-ийн индекс */
  onToggle: (unit: number, day: number) => void;
  onAdvance: (delta: 4 | -4) => void;
  onResetUnit: (unit: number) => void;
};

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

function UnitHead({ u }: { u: Unit }) {
  return (
    <>
      <h2 className="round" style={{ fontSize: 22, margin: "0 0 8px" }}>{u.title}</h2>
      <p className="goal"><b>Зорилго:</b> {u.goal}</p>
    </>
  );
}

function Paywall({ what }: { what: string }) {
  return (
    <div className="card">
      <h3 className="round">{what} төлбөртэй</h3>
      <p className="muted">Эхний долоо хоногийн хичээл үнэгүй. Үлдсэн долоо хоногууд болон нэмэлт тоглоомыг нээхийн тулд багцаа сонгоно уу.</p>
      <Link href="/billing" className="cta" style={{ marginTop: 12 }}>Багц сонгох</Link>
    </div>
  );
}

function UnitBlock({ u, weekIdx, p }: { u: UnitContent; weekIdx: number; p: Profile }) {
  return (
    <>
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
      <div className="card">
        <h3 className="round">Өдөр тутамд</h3>
        <p className="muted">Тусгай цаг гаргахаас гадна өдрийн ажилдаа шингээвэл үр дүн нь хурдан гарна.</p>
        <ul className="steps">{u.daily.map(s => <li key={s}>{s}</li>)}</ul>
      </div>
      <div className="card">
        <h3 className="round">Зорилго биелсний шинж</h3>
        <p className="muted">Эдгээрийн ихэнх нь ажиглагдвал дараагийн долоо хоног руу шилжинэ.</p>
        <ul className="steps">{u.signs.map(s => <li key={s}>{s}</li>)}</ul>
      </div>
      <div className="alert amber"><b>Хэцүү байвал</b>{u.stuck}</div>
    </>
  );
}

export default function PlanView({ profile: p, childId, done, onToggle, onAdvance, onResetUnit }: Props) {
  const plan = useMemo(() => buildPlan(p), [p]);
  /* Сонгосон таб нь аль 4 долоо хоногийн цонхонд хамаарахыг хамт хадгална: цонх солигдоход эхний таб руу буцна */
  const [sel, setSel] = useState<{ adv: number; tab: number | "x" }>({ adv: plan.advance, tab: 0 });
  const [ai, setAi] = useState<{ key: string; games: Game[]; msg: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  /* Хичээлийн агуулгыг серверээс авна: төлбөргүй бол зөвхөн үнэгүй долоо хоногийнх ирнэ */
  const [content, setContent] = useState<{ key: string; access: boolean; units: Record<number, UnitContent>; err: string } | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const shownAdv = useRef(plan.advance);

  useEffect(() => {
    if (shownAdv.current === plan.advance) return;
    shownAdv.current = plan.advance;
    tabsRef.current?.scrollIntoView({ block: "start" });
  }, [plan.advance]);

  const contentKey = childId + ":" + plan.ids.join(",") + ":" + plan.extra + ":" + plan.seq[0];
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const { data } = await getSupabase().auth.getSession();
        const res = await fetch("/api/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + (data.session?.access_token ?? "") },
          body: JSON.stringify({ childId }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("load");
        if (!off) setContent({ key: contentKey, access: json.access === true, units: json.units ?? {}, err: "" });
      } catch {
        if (!off) setContent({ key: contentKey, access: false, units: {}, err: "Хичээлийг ачаалж чадсангүй. Хуудсаа дахин ачаална уу." });
      }
    })();
    return () => { off = true; };
  }, [childId, contentKey]);
  const loaded = content?.key === contentKey ? content : null;

  const who = p.name || (p.sex === "boy" ? "Таны хүү" : "Таны охин");
  const per = p.time === 10 ? 10 : p.time / 2;
  const times = p.time === 10 ? 1 : 2;
  let week: number | "x" = sel.adv === plan.advance ? sel.tab : 0;
  if (week === "x" ? plan.extra == null : week >= plan.ids.length) week = 0;
  const unitId = week === "x" ? (plan.extra as number) : plan.ids[week];
  const unit = UNITS[unitId];
  const weekDone = done[unitId] ?? [];
  /* Зохиосон тоглоом зөвхөн хүссэн табдаа харагдана */
  const aiKey = plan.advance + ":" + week;
  const games = ai?.key === aiKey ? ai.games : [];
  const aiMsg = ai?.key === aiKey ? ai.msg : "";
  const tabId = (t: number | "x") => "plan-tab-" + t;

  async function makeGames() {
    const key = aiKey;
    setAiBusy(true); setAi(null);
    try {
      const { data } = await getSupabase().auth.getSession();
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (data.session?.access_token ?? "") },
        body: JSON.stringify({ childId, unit: unitId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "error");
      setAi({ key, games: Array.isArray(json.games) ? json.games : [], msg: "" });
    } catch (e) {
      setAi({ key, games: [], msg: e instanceof Error && e.message !== "error" ? e.message : "Тоглоом зохиож чадсангүй. Дахин оролдоно уу." });
    }
    setAiBusy(false);
  }

  function pick(tab: number | "x") {
    setSel({ adv: plan.advance, tab });
    setAi(null);
  }

  return (
    <div>
      <div className="card">
        <h2 className="round">{who}: {plan.verdict}</h2>
        <dl className="facts">
          <dt>Нас, хүйс</dt><dd>{ageText(p.years, p.months)}, {p.sex === "boy" ? "хүү" : "охин"}</dd>
          <dt>Одоо</dt><dd>{STAGES[p.stage]}</dd>
          <dt>Энэ насанд</dt><dd>Ихэнх хүүхэд {plan.exp.text}</dd>
          <dt>Эхлэх шат</dt><dd>{UNITS[plan.seq[0]].title}</dd>
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

      <div ref={tabsRef} className="tabs" role="tablist" style={{ gridTemplateColumns: `repeat(${plan.ids.length + (plan.extra != null ? 1 : 0)}, 1fr)` }}>
        {plan.ids.map((_, i) => (
          <button key={i} id={tabId(i)} role="tab" aria-selected={week === i} aria-controls="plan-panel" onClick={() => pick(i)}>
            {plan.advance + i + 1}-р долоо хоног
          </button>
        ))}
        {plan.extra != null && (
          <button id={tabId("x")} role="tab" aria-selected={week === "x"} aria-controls="plan-panel" onClick={() => pick("x")}>Нэмэлт</button>
        )}
      </div>

      <div id="plan-panel" role="tabpanel" aria-labelledby={tabId(week)}>
        <UnitHead u={unit} />
        {!loaded && <p className="muted">Хичээлийг ачаалж байна…</p>}
        {loaded?.err && <p className="err" role="alert">{loaded.err}</p>}
        {loaded && !loaded.err && (loaded.units[unitId]
          ? <UnitBlock u={loaded.units[unitId]} weekIdx={week === "x" ? 0 : plan.advance + week} p={p} />
          : <Paywall what="Энэ долоо хоногийн хичээл" />)}

        {week !== "x" && (
          <div className="card">
            <h3 className="round">Хийсэн өдрөө тэмдэглэ</h3>
            <p className="muted">{weekDone.length} / 7 өдөр. Зорилго биелээгүй бол энэ долоо хоногоо давтана.</p>
            <div className="days">
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <button key={d} aria-pressed={weekDone.includes(d)} aria-label={d + "-р өдөр"} onClick={() => onToggle(unitId, d)}>{d}</button>
              ))}
            </div>
            {weekDone.length > 0 && (
              <button className="link" style={{ marginTop: 10, padding: 0 }} onClick={() => onResetUnit(unitId)}>
                Энэ долоо хоногийг дахин эхлүүлэх
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="round">Цааш үргэлжлүүлэх</h3>
        {plan.hasNext ? (
          <>
            <p className="muted">Долоо хоног бүрийн зорилго биелсэн бол дараагийн шат руу шилжээрэй. Яарах хэрэггүй, хүүхдийнхээ хэмнэлээр явна.</p>
            <button className="cta" style={{ marginTop: 12 }} onClick={() => onAdvance(4)}>Дараагийн 4 долоо хоног руу шилжих</button>
          </>
        ) : (
          <p className="muted">Эдгээр нь хөтөлбөрийн сүүлийн шатууд. Зорилго бүрэн биелтэл долоо хоногуудаа хэрэгцээгээрээ давтаарай.</p>
        )}
        {plan.hasPrev && (
          <button className="ghost" style={{ marginTop: 12 }} onClick={() => onAdvance(-4)}>Өмнөх 4 долоо хоног руу буцах</button>
        )}
      </div>

      <div className="card">
        <h3 className="round">Нэмэлт тоглоом</h3>
        <p className="muted">Хүүхдийн тань мэдээлэлд тулгуурлан хиймэл оюунаар шинэ тоглоом зохиолгоно.</p>
        {loaded && !loaded.access ? (
          <>
            <p className="muted" style={{ marginTop: 8 }}>Нэмэлт тоглоом төлбөртэй багцад багтана.</p>
            <Link href="/billing" className="ghost" style={{ marginTop: 12 }}>Багц сонгох</Link>
          </>
        ) : (
          <>
        <button className="ghost" onClick={makeGames} disabled={aiBusy}>
          {aiBusy ? "Зохиож байна…" : games.length ? "Өөр тоглоом зохиолгох" : "Шинэ тоглоом зохиолгох"}
        </button>
        {aiMsg && <p className="err" style={{ marginTop: 12 }}>{aiMsg}</p>}
        {games.map((g, gi) => (
          <div className="card lesson" key={gi} style={{ background: "var(--bg)", marginTop: 12 }}>
            <h3 className="round">{g.name}</h3>
            <ul className="steps">{(g.steps || []).map((s, si) => <li key={si}>{s}</li>)}</ul>
            {g.say && <div className="talk" style={{ background: "var(--surface)" }}><div className="say p">{g.say}</div></div>}
          </div>
        ))}
        {games.length > 0 && <p className="muted" style={{ marginTop: 8 }}>Хиймэл оюунаар зохиосон тул хүүхэддээ тохирох эсэхийг өөрөө нягтлаарай.</p>}
          </>
        )}
      </div>

      <p className="foot">Энэ төлөвлөгөө онош биш, гэрийн дэмжлэг юм. Санаа зовоосон зүйл байвал хэл засалч, хүүхдийн эмчид хандаарай.</p>
    </div>
  );
}
