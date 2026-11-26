"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LIKES, ROUTINES, STAGES, UNITS, buildPlan, fill, type Like, type Profile, type Unit, type UnitContent } from "@/lib/engine";
import { ageText } from "@/lib/children";
import { getSupabase } from "@/lib/supabase";
import Icon, { type IconName } from "@/components/Icon";
import SignCheck from "@/components/SignCheck";
import WeekGoal from "@/components/WeekGoal";
import WordLog from "@/components/WordLog";

type Game = { name: string; steps: string[]; say?: string };
type Props = {
  profile: Profile; childId: string;
  done: Record<number, number[]>;   /* түлхүүр нь UNITS-ийн индекс */
  onToggle: (unit: number, day: number) => void;
  onAdvance: (delta: number) => void;
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
            {/* Агуулга нь серверийн lib/content.ts дахь тогтмол текст тул HTML-ээр оруулахад аюулгүй */}
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
      <h2 className="round unit-title">{u.title}</h2>
      <p className="goal"><b>Зорилго:</b> {u.goal}</p>
    </>
  );
}

function Head({ icon, tone = "", children }: { icon: IconName; tone?: string; children: React.ReactNode }) {
  return (
    <div className="cardhead">
      <span className={"badge " + tone}><Icon name={icon} size={18} /></span>
      <h3 className="round">{children}</h3>
    </div>
  );
}

function Paywall({ what, freeUsed }: { what: string; freeUsed: boolean }) {
  return (
    <div className="card">
      <h3 className="round">{what} төлбөртэй</h3>
      <p className="muted">
        {freeUsed
          ? "Та үнэгүй долоо хоногоо өөр шатанд ашигласан байна. Бүх долоо хоногийн хичээл, нэмэлт тоглоомыг нээхийн тулд багцаа сонгоно уу."
          : "Эхний долоо хоногийн хичээл үнэгүй. Үлдсэн долоо хоногууд болон нэмэлт тоглоомыг нээхийн тулд багцаа сонгоно уу."}
      </p>
      <Link href="/billing" className="cta" style={{ marginTop: 12 }}>Багц сонгох</Link>
    </div>
  );
}

type BlockProps = {
  u: UnitContent; unitId: number; weekIdx: number; p: Profile; childId: string; access: boolean;
  weekDone: number[]; trackable: boolean; onNext?: () => void;
  onToggle: (unit: number, day: number) => void; onResetUnit: (unit: number) => void;
};

/* Долоо хоногийн нэг арга ба 7 өдрийн хувилбар. Өдрийн товч нь тухайн өдрийн картыг нээнэ. */
function UnitBlock({ u, unitId, weekIdx, p, childId, access, weekDone, trackable, onNext, onToggle, onResetUnit }: BlockProps) {
  const [picked, setPicked] = useState<number | null>(null);
  /* Сонгоогүй бол эхний хийгээгүй өдөр нээгдэнэ */
  const day = picked ?? ([1, 2, 3, 4, 5, 6, 7].find(d => !weekDone.includes(d)) ?? 7);
  const tip = u.days[day - 1];
  const v = LIKES[p.likes[(weekIdx + day - 1) % p.likes.length]] ?? LIKES.ball;
  const first = LIKES[p.likes[weekIdx % p.likes.length]] ?? LIKES.ball;
  const words = [...new Set(u.words.map(w => fill(w, first)))];
  const isDone = weekDone.includes(day);
  return (
    <>
      {u.note && <div className="alert amber">{u.note}</div>}
      <div className="card">
        <div className="use">Энэ долоо хоногийн арга</div>
        <Head icon="bulb">{u.strategy.name}</Head>
        <p className="muted">{u.why}</p>
        <ul className="steps">{u.strategy.how.map(s => <li key={s}>{s}</li>)}</ul>
        <div className="use" style={{ marginTop: 12 }}>Энэ долоо хоногт олон давтах үг, хэллэг</div>
        <div className="words">{words.map(w => <span key={w}>{w}</span>)}</div>
      </div>

      <div className="card lesson">
        <Head icon="calendar">Өдөр бүр нэг хэвшилд</Head>
        <p className="muted">
          {trackable ? <b>{weekDone.length} / 7 өдөр хийсэн. </b> : ""}Нэг аргаа өдөр бүр өөр хэвшил дотор давтана. Өдрөө сонгоно уу.
        </p>
        {trackable && (
          <div className="meter" role="progressbar" aria-label="Энэ долоо хоногийн ахиц" aria-valuemin={0} aria-valuemax={7} aria-valuenow={weekDone.length}>
            <i style={{ width: (weekDone.length / 7) * 100 + "%" }} />
          </div>
        )}
        {trackable && <WeekGoal childId={childId} unitId={unitId} done={weekDone.length} access={access} />}
        <div className="week7" role="group" aria-label="Өдөр сонгох">
          {[1, 2, 3, 4, 5, 6, 7].map(d => (
            <button key={d} aria-pressed={weekDone.includes(d)} aria-current={d === day ? "true" : undefined}
              aria-label={d + "-р өдөр" + (weekDone.includes(d) ? ", хийсэн" : "")} onClick={() => setPicked(d)}>
              {weekDone.includes(d) ? <Icon name="check" size={18} /> : d}
            </button>
          ))}
        </div>
        <div className="daycard">
          <div className="use">{day}-р өдөр · {ROUTINES[tip.routine]} · {p.time} минут орчим</div>
          <p>{fill(tip.todo, v)}</p>
          <Talk talk={tip.talk} v={v} childName={p.name || "Хүүхэд"} />
          {trackable && (
            <button className={isDone ? "ghost" : "cta"} style={{ marginTop: 14 }} onClick={() => { setPicked(day); onToggle(unitId, day); }}>
              {isDone ? "Хийгээгүй болгох" : <><Icon name="check" size={18} /> {day}-р өдрийг хийлээ</>}
            </button>
          )}
          {trackable && weekDone.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 6 }}>
              <button className="link subtle" onClick={() => onResetUnit(unitId)}>
                <Icon name="repeat" size={16} /> Энэ долоо хоногийг дахин эхлүүлэх
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="alert green"><b>Урам</b>{u.cheer}</div>
      <SignCheck childId={childId} unitId={unitId} signs={u.signs} onNext={onNext} />
      <div className="alert amber"><b>Хэцүү байвал</b>{u.stuck}</div>
      <div className="card">
        <Head icon="steth" tone="amber">Мэргэжилтэнд хандах үе</Head>
        <ul className="steps">{u.refer.map(s => <li key={s}>{s}</li>)}</ul>
      </div>
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
  const [content, setContent] = useState<{ key: string; access: boolean; freeUsed: boolean; units: Record<number, UnitContent>; err: string } | null>(null);
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
        if (!off) setContent({ key: contentKey, access: json.access === true, freeUsed: json.freeUsed === true, units: json.units ?? {}, err: "" });
      } catch {
        if (!off) setContent({ key: contentKey, access: false, freeUsed: false, units: {}, err: "Хичээлийг ачаалж чадсангүй. Хуудсаа дахин ачаална уу." });
      }
    })();
    return () => { off = true; };
  }, [childId, contentKey]);
  const loaded = content?.key === contentKey ? content : null;

  const who = p.name || (p.sex === "boy" ? "Таны хүү" : "Таны охин");
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
        <div className="who">
          <span className={"avatar " + p.sex} aria-hidden="true">{(p.name || (p.sex === "boy" ? "Хүү" : "Охин")).charAt(0).toUpperCase()}</span>
          <h2 className="round">{who}: {plan.verdict}</h2>
        </div>
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

      <h2 className="round" style={{ fontSize: 20, margin: "26px 0 4px" }}>{Math.floor(plan.advance / 4) + 1}-р мөчлөг · долоо хоногууд</h2>
      <p className="muted" style={{ margin: 0 }}>
        Үр дүнтэй хөтөлбөрүүд 10–13 долоо хоног үргэлжилдэг тул нэг мөчлөгөөр дүгнэхгүй, гурван мөчлөг үргэлжлүүлэхийг зорино уу.
      </p>

      <div ref={tabsRef} className="tabs" role="tablist" aria-label="Долоо хоног сонгох" style={{ gridTemplateColumns: `repeat(${plan.ids.length + (plan.extra != null ? 1 : 0)}, 1fr)` }}>
        {plan.ids.map((_, i) => (
          <button key={i} id={tabId(i)} role="tab" aria-selected={week === i} aria-controls="plan-panel" onClick={() => pick(i)}>
            <span className="sr">{plan.advance + i + 1}-р долоо хоног</span>
            <b aria-hidden="true">{plan.advance + i + 1}</b>
            <small className={(done[plan.ids[i]] ?? []).length >= 7 ? "full" : ""} aria-label={(done[plan.ids[i]] ?? []).length + " өдөр хийсэн"}>
              {(done[plan.ids[i]] ?? []).length}/7
            </small>
          </button>
        ))}
        {plan.extra != null && (
          <button id={tabId("x")} role="tab" aria-selected={week === "x"} aria-controls="plan-panel" onClick={() => pick("x")}><b aria-hidden="true">+</b><small>Нэмэлт</small></button>
        )}
      </div>

      <div id="plan-panel" role="tabpanel" aria-labelledby={tabId(week)}>
        <UnitHead u={unit} />
        {!loaded && <div className="skel" role="status" aria-label="Хичээлийг ачаалж байна"><i className="l" /><i className="l" /></div>}
        {loaded?.err && <p className="err" role="alert">{loaded.err}</p>}
        {loaded && !loaded.err && (loaded.units[unitId]
          ? <UnitBlock key={unitId} u={loaded.units[unitId]} unitId={unitId} weekIdx={week === "x" ? 0 : plan.advance + week} p={p}
              childId={childId} access={loaded.access}
              weekDone={weekDone} trackable={week !== "x"} onToggle={onToggle} onResetUnit={onResetUnit}
              onNext={week === 0 && plan.advance + 1 < plan.seq.length ? () => onAdvance(1) : undefined} />
          : <Paywall what={week === "x" ? "Нэмэлт хичээл" : "Энэ долоо хоногийн хичээл"} freeUsed={loaded.freeUsed} />)}

      </div>

      <WordLog childId={childId} />

      <div className="card">
        <Head icon="flag">Цааш үргэлжлүүлэх</Head>
        {plan.hasNext ? (
          <>
            <p className="muted">Долоо хоног бүрийн зорилго биелсэн бол дараагийн шат руу шилжээрэй. Яарах хэрэггүй, хүүхдийнхээ хэмнэлээр явна.</p>
            <button className="cta" style={{ marginTop: 12 }} onClick={() => onAdvance(4)}>Дараагийн мөчлөг рүү шилжих (4 долоо хоног)</button>
          </>
        ) : (
          <p className="muted">Эдгээр нь хөтөлбөрийн сүүлийн шатууд. Зорилго бүрэн биелтэл долоо хоногуудаа хэрэгцээгээрээ давтаарай.</p>
        )}
        {plan.hasPrev && (
          <button className="ghost" style={{ marginTop: 12 }} onClick={() => onAdvance(-4)}>Өмнөх мөчлөг рүү буцах</button>
        )}
      </div>

      <div className="card">
        <Head icon="spark">Нэмэлт тоглоом</Head>
        <p className="muted">Энэ долоо хоногийн аргад тааруулан хиймэл оюунаар шинэ тоглоом зохиолгоно.</p>
        {loaded && !loaded.access ? (
          <>
            <p className="muted" style={{ marginTop: 8 }}>Нэмэлт тоглоом төлбөртэй багцад багтана.</p>
            <Link href="/billing" className="ghost" style={{ marginTop: 12 }}>Багц сонгох</Link>
          </>
        ) : (
          <>
        <button className="ghost" onClick={makeGames} disabled={aiBusy}>
          {aiBusy && <span className="spin" />}{aiBusy ? "Зохиож байна…" : games.length ? "Өөр тоглоом зохиолгох" : "Шинэ тоглоом зохиолгох"}
        </button>
        {aiMsg && <p className="err" role="alert" style={{ marginTop: 12 }}>{aiMsg}</p>}
        {games.map((g, gi) => (
          <div className="card flat lesson" key={gi} style={{ marginTop: 12, marginBottom: 0 }}>
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
