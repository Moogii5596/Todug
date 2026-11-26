"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useConfirm } from "@/components/Confirm";
import Icon from "@/components/Icon";
import Loading from "@/components/Loading";
import { BANK, STATUS, activeUntil, dateText, money, type Order, type PlanRow } from "@/lib/billing";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

function Copy({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* хуулж чадахгүй бол гараар бичнэ */ }
  }
  return <button type="button" className="link copy" onClick={copy} aria-label={label + " хуулах"}><Icon name={done ? "check" : "copy"} size={15} /> <span aria-live="polite">{done ? "Хууллаа" : "Хуулах"}</span></button>;
}

export default function Billing() {
  const { ready } = useRequireAuth();
  const confirm = useConfirm();
  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  const [until, setUntil] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const sb = getSupabase();
    const [p, o] = await Promise.all([
      sb.from("plans").select("id, label, months, amount").order("sort"),
      sb.from("orders").select("id, code, plan_id, months, amount, status, created_at, decided_at, access_until").order("created_at", { ascending: false }).limit(20),
    ]);
    return { failed: !!(p.error || o.error), plans: (p.data as PlanRow[]) ?? [], orders: (o.data as Order[]) ?? [] };
  }, []);
  const apply = useCallback((r: Awaited<ReturnType<typeof fetchAll>>) => {
    if (r.failed) setErr("Төлбөрийн мэдээллийг ачаалж чадсангүй. Хуудсаа дахин ачаална уу.");
    setPlans(r.plans); setOrders(r.orders); setUntil(activeUntil(r.orders));
  }, []);
  const load = useCallback(async () => apply(await fetchAll()), [apply, fetchAll]);

  useEffect(() => {
    if (!ready) return;
    fetchAll().then(apply);
  }, [ready, fetchAll, apply]);

  const pending = orders.find(o => o.status === "pending");

  async function choose(plan: PlanRow) {
    if (pending && pending.plan_id !== plan.id
      && !(await confirm({ title: "Багцаа солих уу?", body: "Хүлээгдэж буй " + pending.code + " захиалга цуцлагдаж, шинэ дугаар үүснэ. Хэрэв аль хэдийн мөнгөө шилжүүлсэн бол бүү солиорой.", confirmLabel: "Солих" }))) return;
    setErr(""); setBusy(plan.id);
    const { error } = await getSupabase().rpc("create_order", { p_plan: plan.id });
    setBusy("");
    if (error) {
      setErr(/too many orders/.test(error.message) ? "Өнөөдөр хэт олон захиалга үүсгэлээ. Маргааш дахин оролдоно уу." : "Захиалга үүсгэж чадсангүй. Дахин оролдоно уу.");
      return;
    }
    await load();
    window.scrollTo({ top: 0 });
  }

  if (!ready || plans === null) return <Loading />;

  return (
    <main>
      <h1 className="page round">Төлбөр</h1>
      {err && <p className="err" role="alert">{err}</p>}

      {until && (
        <div className="alert green"><b>Эрх идэвхтэй</b>{dateText(until)} хүртэл бүх хичээл, нэмэлт тоглоом нээлттэй.</div>
      )}

      {pending && (
        <div className="card">
          <h2 className="round">Төлбөрөө шилжүүлнэ үү</h2>
          <p className="muted">Доорх данс руу шилжүүлэхдээ гүйлгээний утга дээр <b>зөвхөн захиалгын дугаараа</b> бичнэ.</p>
          <dl className="facts pay">
            <dt>Банк</dt><dd>{BANK.bank}</dd>
            <dt>Данс</dt><dd><span className="mono">{BANK.account}</span> <Copy text={BANK.account} label="Дансны дугаар" /></dd>
            {BANK.holder && <><dt>Хүлээн авагч</dt><dd>{BANK.holder}</dd></>}
            <dt>Дүн</dt><dd><b>{money(pending.amount)}</b> <Copy text={String(pending.amount)} label="Дүн" /></dd>
            <dt>Гүйлгээний утга</dt><dd><span className="paycode">{pending.code}</span> <Copy text={pending.code} label="Захиалгын дугаар" /></dd>
          </dl>
          <p className="muted" style={{ marginTop: 10 }}>
            Төлбөрийг дансны хуулгаар гараар шалгаж баталгаажуулдаг тул эрх шууд нээгдэхгүй. Баталгаажсаны дараа энэ хуудсанд &ldquo;Эрх идэвхтэй&rdquo; гэж гарна.
          </p>
          <button className="ghost" style={{ marginTop: 12 }} onClick={load}>Төлөвийг шинэчлэх</button>
        </div>
      )}

      <div className="card">
        <h2 className="round">{until ? "Эрхээ сунгах" : "Багц сонгох"}</h2>
        <p className="muted">Эхний долоо хоногийн хичээл үнэгүй. Багц авснаар бүх долоо хоногийн хичээл, нэмэлт тоглоом бүх хүүхдэд тань нээгдэнэ.</p>
        <ul className="dolist" style={{ marginBottom: 4 }}>
          {["11 шатны 77 хичээл: өдөр бүр гурван алхам, ярианы жишээ, хүүхдийн хариунд тохирсон зөвлөгөө",
            "Хүүхдийн тань одоогийн ярианд тааруулсан долоо хоног бүрийн төлөвлөгөө",
            "Долоо хоног бүрийг хөргөгчин дээрээ наах хэвлэх хуудсаар",
            "Долоо хоногийн аргад тааруулан хиймэл оюунаар зохиосон нэмэлт тоглоом",
            "Үгийн бүртгэл, ахицын тайлан: эмч, хэл засалчид үзүүлэхэд бэлэн",
            "Нэг багцаар бүх хүүхдэд тань"].map(t => (
            <li key={t}><span className="mk yes"><Icon name="check" size={14} /></span>{t}</li>
          ))}
        </ul>
        {plans.length === 0 && <p className="muted">Одоогоор багц алга.</p>}
        <div className="stack" style={{ marginTop: 12 }}>
          {plans.map(pl => (
            <button key={pl.id} className={"plan" + (pending?.plan_id === pl.id ? " on" : "")} disabled={!!busy || pending?.plan_id === pl.id} onClick={() => choose(pl)}>
              <span>
                <b className="round">{pl.label}</b>
                <small>{busy === pl.id ? "Түр хүлээнэ үү…" : pending?.plan_id === pl.id ? "Сонгосон багц" : pl.months > 1 ? "Сард " + money(Math.round(pl.amount / pl.months)) : "Сонгох"}</small>
              </span>
              <span className="price">{busy === pl.id ? <span className="spin" /> : <b>{money(pl.amount)}</b>}</span>
            </button>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 10 }}>Автоматаар сунгагдахгүй. Хугацаа дуусахад дахин захиалж сунгана.</p>
      </div>

      {orders.length > 0 && (
        <div className="card">
          <h3 className="round">Захиалгын түүх</h3>
          <ul className="orders">
            {orders.map(o => (
              <li key={o.id}>
                <span><b className="mono">{o.code}</b> · {o.months} сар · {money(o.amount)}<br />
                  <span className="muted">{dateText(o.created_at)}{o.status === "paid" && o.access_until ? " · " + dateText(o.access_until) + " хүртэл" : ""}</span></span>
                <span className={"tag " + o.status}>{STATUS[o.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="foot">Асуух зүйл байвал <Link href="/privacy">Нууцлалын бодлого</Link> хуудасны холбоо барих хэсгийг үзнэ үү.</p>
    </main>
  );
}
