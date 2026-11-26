"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import Loading from "@/components/Loading";
import { STAGES } from "@/lib/engine";
import { ageFromBirth, ageText, type ChildRow } from "@/lib/children";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function Children() {
  const { ready } = useRequireAuth();
  const router = useRouter();
  const [rows, setRows] = useState<ChildRow[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!ready) return;
    getSupabase().from("todug_children").select("*").order("created_at").then(({ data, error }) => {
      if (error) setErr("Жагсаалтыг ачаалж чадсангүй. Хуудсаа дахин ачаална уу.");
      // Хүүхэд нэмээгүй бол хоосон жагсаалт харуулалгүй шууд нэмэх хуудас руу оруулна
      else if (!data?.length) { router.replace("/children/new"); return; }
      setRows((data as ChildRow[]) ?? []);
    });
  }, [ready, router]);

  if (!ready || rows === null) return <Loading />;

  return (
    <main>
      <h1 className="page round">Хүүхдүүд</h1>
      {err && <p className="err" role="alert">{err}</p>}
      {rows.map(r => {
        const age = ageFromBirth(r.birth_month);
        return (
        <Link key={r.id} href={"/children/" + r.id} className="card child">
          <span className={"avatar " + r.sex} aria-hidden="true">{(r.name || (r.sex === "boy" ? "Хүү" : "Охин")).charAt(0).toUpperCase()}</span>
          <span className="body">
            <b className="round">{r.name || (r.sex === "boy" ? "Хүү" : "Охин")}</b>
            <span className="muted">{ageText(age.years, age.months)} · {STAGES[r.stage]}</span>
          </span>
          <Icon name="chevron" />
        </Link>
        );
      })}
      <Link href="/children/new" className="ghost"><Icon name="plus" size={18} /> Хүүхэд нэмэх</Link>
    </main>
  );
}
