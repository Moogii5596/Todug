"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { suggestNext } from "@/lib/engine";
import { getSupabase } from "@/lib/supabase";

type Props = {
  childId: string; unitId: number; signs: string[];
  /* Дараагийн шат руу шууд шилжих боломжтой үед л өгнө */
  onNext?: () => void;
};

/* "Зорилго биелсний шинж"-ийг тэмдэглэж, дараагийн шат руу шилжих эсвэл давтахыг санал болгоно */
export default function SignCheck({ childId, unitId, signs, onNext }: Props) {
  /* null = ачаалж байна эсвэл хадгалах боломжгүй: энгийн жагсаалтаар харуулна */
  const [checked, setChecked] = useState<number[] | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let off = false;
    getSupabase().from("checkins").select("signs").eq("child_id", childId).eq("unit", unitId).maybeSingle()
      .then(({ data, error }) => { if (!off && !error) setChecked(Array.isArray(data?.signs) ? (data.signs as number[]) : []); });
    return () => { off = true; };
  }, [childId, unitId]);

  async function toggle(i: number) {
    if (!checked) return;
    const prev = checked;
    const next = prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort((a, b) => a - b);
    setChecked(next);
    const { error } = await getSupabase().from("checkins")
      .upsert({ child_id: childId, unit: unitId, signs: next, updated_at: new Date().toISOString() });
    if (error) { setChecked(prev); setMsg("Тэмдэглэгээг хадгалж чадсангүй. Дахин оролдоно уу."); }
    else setMsg("");
  }

  const seen = (checked ?? []).filter(i => i < signs.length).length;
  const ready = checked != null && suggestNext(seen, signs.length) === "advance";
  return (
    <div className="card">
      <div className="cardhead"><span className="badge green"><Icon name="check" size={18} /></span><h3 className="round">Зорилго биелсний шинж</h3></div>
      <p className="muted">
        {checked ? "Ажиглагдсан шинжээ тэмдэглээрэй. " : ""}Талаас илүү нь ажиглагдвал дараагийн шат руу шилжинэ. Үгүй бол энэ долоо хоногоо давтана.
      </p>
      {checked ? (
        <div className="checks">
          {signs.map((s, i) => (
            <label key={s}><input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} /><span>{s}</span></label>
          ))}
        </div>
      ) : (
        <ul className="steps">{signs.map(s => <li key={s}>{s}</li>)}</ul>
      )}
      {msg && <p className="err" role="alert" style={{ marginTop: 8 }}>{msg}</p>}
      {ready && (
        <div className="alert green" style={{ margin: "12px 0 0" }}>
          <b>{signs.length} шинжээс {seen} нь ажиглагдлаа</b>
          {onNext ? "Дараагийн шат руу шилжихэд бэлэн байна." : "Дараагийн долоо хоногийн хичээл рүү шилжээрэй."}
          {onNext && <button className="cta" style={{ marginTop: 10 }} onClick={onNext}>Дараагийн шат руу шилжих</button>}
        </div>
      )}
    </div>
  );
}
