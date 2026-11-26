"use client";
import { useCallback, useEffect, useState } from "react";
import { STATUS, dateText, money, type AdminOrder, type OrderStatus } from "@/lib/billing";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

const FILTERS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "pending", label: "Хүлээгдэж буй" }, { id: "paid", label: "Төлсөн" },
  { id: "cancelled", label: "Цуцалсан" }, { id: "all", label: "Бүгд" },
];

export default function Admin() {
  const { ready } = useRequireAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("pending");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminOrder[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(0);

  useEffect(() => {
    if (!ready) return;
    getSupabase().rpc("is_admin").then(({ data }) => setAdmin(data === true));
  }, [ready]);

  const load = useCallback(async (status: string, query: string) => {
    const { data, error } = await getSupabase().rpc("admin_orders", { p_status: status, p_q: query });
    if (error) { setErr("Захиалгуудыг ачаалж чадсангүй. Дахин оролдоно уу."); setRows([]); return; }
    setErr(""); setRows((data as AdminOrder[]) ?? []);
  }, []);

  useEffect(() => {
    if (!admin) return;
    const t = setTimeout(() => load(filter, q), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [admin, filter, q, load]);

  async function setStatus(o: AdminOrder, status: "paid" | "cancelled") {
    const ask = status === "paid"
      ? o.code + " захиалгыг төлсөн болгох уу?\n" + o.email + "\n" + money(o.amount) + " · " + o.months + " сар\n\nДансны хуулга дээр дүн, гүйлгээний утга таарч байгааг шалгасан уу?"
      : o.code + " захиалгыг цуцлах уу?" + (o.status === "paid" ? " Хэрэглэгчийн эрх хаагдана." : "");
    if (!window.confirm(ask)) return;
    setBusy(o.id);
    const { error } = await getSupabase().rpc("admin_set_order", { p_id: o.id, p_status: status });
    setBusy(0);
    if (error) { setErr("Төлөвийг өөрчилж чадсангүй. Дахин оролдоно уу."); return; }
    await load(filter, q);
  }

  if (!ready || admin === null) return <main><p className="muted">Ачаалж байна…</p></main>;
  if (!admin) return <main><p className="err" role="alert">Энэ хуудсыг үзэх эрхгүй байна.</p></main>;

  return (
    <main>
      <h1 className="page round">Захиалгууд</h1>
      <div className="tabs" role="tablist" style={{ margin: "0 0 12px" }}>
        {FILTERS.map(f => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => { setRows(null); setFilter(f.id); }}>{f.label}</button>
        ))}
      </div>
      <label className="f">Захиалгын дугаар эсвэл имэйлээр хайх
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="T123456" autoCapitalize="characters" />
      </label>
      {err && <p className="err" role="alert" style={{ marginTop: 12 }}>{err}</p>}
      {rows === null && <p className="muted" style={{ marginTop: 12 }}>Ачаалж байна…</p>}
      {rows?.length === 0 && !err && <p className="muted" style={{ marginTop: 12 }}>Захиалга алга.</p>}
      <div style={{ marginTop: 12 }}>
        {rows?.map(o => (
          <div className="card" key={o.id}>
            <div className="orderhead">
              <b className="paycode">{o.code}</b>
              <span className={"tag " + o.status}>{STATUS[o.status]}</span>
            </div>
            <dl className="facts">
              <dt>Дүн</dt><dd><b>{money(o.amount)}</b> · {o.plan_label}</dd>
              <dt>Имэйл</dt><dd style={{ overflowWrap: "anywhere" }}>{o.email}</dd>
              <dt>Үүссэн</dt><dd>{dateText(o.created_at)}</dd>
              {o.status === "paid" && <><dt>Эрх</dt><dd>{dateText(o.access_until)} хүртэл</dd></>}
              {o.status !== "pending" && <><dt>Шийдсэн</dt><dd>{dateText(o.decided_at)}</dd></>}
            </dl>
            <div className="rowbtns">
              {o.status !== "paid" && <button className="cta" disabled={busy === o.id} onClick={() => setStatus(o, "paid")}>Төлсөн болгох</button>}
              {o.status !== "cancelled" && <button className="ghost danger" disabled={busy === o.id} onClick={() => setStatus(o, "cancelled")}>Цуцлах</button>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
