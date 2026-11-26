"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { STAGES } from "@/lib/engine";
import { ageFromBirth, ageText, type ChildRow } from "@/lib/children";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function Children() {
  const { ready } = useRequireAuth();
  const [rows, setRows] = useState<ChildRow[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!ready) return;
    getSupabase().from("todug_children").select("*").order("created_at").then(({ data, error }) => {
      if (error) setErr("Жагсаалтыг ачаалж чадсангүй. Хуудсаа дахин ачаална уу.");
      setRows((data as ChildRow[]) ?? []);
    });
  }, [ready]);

  if (!ready || rows === null) return <main><p className="muted">Ачаалж байна…</p></main>;

  return (
    <main>
      <h1 className="page round">Хүүхдүүд</h1>
      {err && <p className="err" role="alert">{err}</p>}
      {rows.length === 0 && !err && (
        <p className="muted" style={{ marginBottom: 14 }}>Одоогоор хүүхэд нэмээгүй байна. Эхний хүүхдээ нэмээд хичээлийг нь аваарай.</p>
      )}
      {rows.map(r => {
        const age = ageFromBirth(r.birth_month);
        return (
        <Link key={r.id} href={"/children/" + r.id} className="card child">
          <span>
            <b className="round">{r.name || (r.sex === "boy" ? "Хүү" : "Охин")}</b><br />
            <span className="muted">{ageText(age.years, age.months)}. {STAGES[r.stage]}</span>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
        );
      })}
      <Link href="/children/new" className="cta">Хүүхэд нэмэх</Link>
    </main>
  );
}
