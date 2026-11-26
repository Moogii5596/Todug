"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { normWord } from "@/lib/engine";
import { getSupabase } from "@/lib/supabase";

type Word = { word: string; kind: "says" | "understands"; created_at: string };

/* Хүүхдийн хэлдэг, ойлгодог үгсийн хувийн бүртгэл. Оноо, дүгнэлт гаргахгүй: зөвхөн өсөлтийг харуулна. */
export default function WordLog({ childId }: { childId: string }) {
  const [words, setWords] = useState<Word[] | null>(null);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<Word["kind"]>("says");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  /* Ачаалсан мөчийн цаг: "сүүлийн 7 хоног"-ийг тооцоход хэрэглэнэ */
  const [now, setNow] = useState(0);

  useEffect(() => {
    let off = false;
    getSupabase().from("words").select("word, kind, created_at").eq("child_id", childId).order("created_at")
      .then(({ data, error }) => { if (!off && !error) { setNow(Date.now()); setWords((data ?? []) as Word[]); } });
    return () => { off = true; };
  }, [childId]);

  /* Хүснэгт хараахан үүсээгүй эсвэл ачаалж чадаагүй бол картыг харуулахгүй */
  if (!words) return null;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const w = normWord(text);
    if (!w || busy) return;
    if (words!.some(x => x.word === w)) { setMsg("Энэ үг бүртгэлд байна."); return; }
    setBusy(true);
    const { error } = await getSupabase().from("words").insert({ child_id: childId, word: w, kind });
    setBusy(false);
    if (error) { setMsg("Үгийг хадгалж чадсангүй. Дахин оролдоно уу."); return; }
    setWords(prev => [...(prev ?? []), { word: w, kind, created_at: new Date().toISOString() }]);
    setText(""); setMsg("");
  }

  async function promote(w: Word) {
    const { error } = await getSupabase().from("words").update({ kind: "says" }).eq("child_id", childId).eq("word", w.word);
    if (error) { setMsg("Өөрчлөлтийг хадгалж чадсангүй. Дахин оролдоно уу."); return; }
    setWords(prev => (prev ?? []).map(x => (x.word === w.word ? { ...x, kind: "says" } : x)));
    setMsg("");
  }

  async function remove(w: Word) {
    const { error } = await getSupabase().from("words").delete().eq("child_id", childId).eq("word", w.word);
    if (error) { setMsg("Үгийг устгаж чадсангүй. Дахин оролдоно уу."); return; }
    setWords(prev => (prev ?? []).filter(x => x.word !== w.word));
    setMsg("");
  }

  const says = words.filter(w => w.kind === "says");
  const understands = words.filter(w => w.kind === "understands");
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recent = words.filter(w => new Date(w.created_at).getTime() >= weekAgo).length;

  return (
    <div className="card">
      <div className="cardhead"><span className="badge"><Icon name="chat" size={18} /></span><h3 className="round">Миний хүүхдийн үгс</h3></div>
      <p className="muted">
        Хэлдэг {says.length} үг, ойлгодог {understands.length} үг{recent > 0 ? ". Сүүлийн 7 хоногт " + recent + " үг нэмэгдсэн" : ""}.
        Энэ бол таны хувийн тэмдэглэл: оноо, онош биш.
      </p>
      <form onSubmit={add} className="wordform">
        <label className="sr" htmlFor="word-new">Шинэ үг</label>
        <input id="word-new" type="text" value={text} maxLength={30} placeholder="Шинэ үг" autoComplete="off" enterKeyHint="done" onChange={e => setText(e.target.value)} />
        <label className="sr" htmlFor="word-kind">Төрөл</label>
        <select id="word-kind" value={kind} onChange={e => setKind(e.target.value as Word["kind"])}>
          <option value="says">Хэлдэг</option>
          <option value="understands">Ойлгодог</option>
        </select>
        <button className="ghost" disabled={busy || !normWord(text)}><Icon name="plus" size={18} /> Нэмэх</button>
      </form>
      {msg && <p className="err" role="alert" style={{ marginTop: 8 }}>{msg}</p>}
      {says.length > 0 && (
        <>
          <div className="use" style={{ marginTop: 12 }}>Хэлдэг</div>
          <div className="words">
            {says.map(w => (
              <span key={w.word}>{w.word}<button className="x" aria-label={w.word + " гэдэг үгийг устгах"} onClick={() => remove(w)}>×</button></span>
            ))}
          </div>
        </>
      )}
      {understands.length > 0 && (
        <>
          <div className="use" style={{ marginTop: 12 }}>Ойлгодог (хэлдэг болбол үгэн дээр дарна)</div>
          <div className="words soft">
            {understands.map(w => (
              <span key={w.word}>
                <button className="w" aria-label={w.word + ": хэлдэг болсон гэж тэмдэглэх"} onClick={() => promote(w)}>{w.word}</button>
                <button className="x" aria-label={w.word + " гэдэг үгийг устгах"} onClick={() => remove(w)}>×</button>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
