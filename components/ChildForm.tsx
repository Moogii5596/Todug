"use client";
import { useState } from "react";
import { COMP, FLAGS, LIKES, STAGES, TIMES, type Profile } from "@/lib/engine";

type Props = { initial?: Profile; submitLabel: string; onSubmit: (p: Profile) => Promise<string | void> };

function Opt(props: { type: "radio" | "checkbox"; name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="opt">
      <input type={props.type} name={props.name} checked={props.checked} onChange={props.onChange} />
      <span>{props.label}</span>
    </label>
  );
}

export default function ChildForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [years, setYears] = useState(Math.min(12, Math.max(1, initial?.years ?? 3)));
  const [months, setMonths] = useState(initial?.months ?? 0);
  const [sex, setSex] = useState<Profile["sex"] | "">(initial?.sex ?? "");
  const [stage, setStage] = useState<number | null>(initial?.stage ?? null);
  const [comp, setComp] = useState<Profile["comp"] | "">(initial?.comp ?? "");
  const [flags, setFlags] = useState<string[]>(initial?.flags ?? []);
  const [likes, setLikes] = useState<string[]>(initial?.likes ?? []);
  const [time, setTime] = useState(initial?.time ?? 20);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (list: string[], k: string) => (list.includes(k) ? list.filter(x => x !== k) : [...list, k]);

  async function submit() {
    if (!sex) return setErr("Хүү эсвэл охин гэдгийг сонгоно уу.");
    if (stage == null) return setErr("Одоо яаж ярьдгийг нь сонгоно уу.");
    if (!comp) return setErr("Хэлснийг ойлгодог эсэхийг сонгоно уу.");
    if (likes.length > 3) return setErr("Дуртай зүйлээс 3 хүртэлхийг сонгоно уу.");
    setErr(""); setBusy(true);
    const res = await onSubmit({
      name: name.trim(), years, months, sex, stage, comp, flags,
      likes: likes.length ? likes : ["ball", "food"], time,
      advance: initial?.advance ?? 0,
    });
    setBusy(false);
    if (res) setErr(res);
  }

  return (
    <div>
      <fieldset>
        <legend className="round">Хүүхэд</legend>
        <label className="f">Нэр (заавал биш)
          <input type="text" maxLength={20} autoComplete="off" placeholder="Жишээ нь: Тэмүүлэн"
            value={name} onChange={e => setName(e.target.value)} />
        </label>
        <div className="grid2" style={{ marginTop: 10 }}>
          <label className="f">Нас
            <select value={years} onChange={e => setYears(+e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(y => <option key={y} value={y}>{y} нас</option>)}
            </select>
          </label>
          <label className="f">Сар
            <select value={months} onChange={e => setMonths(+e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{i} сар</option>)}
            </select>
          </label>
        </div>
        <div className="chips" style={{ marginTop: 12 }}>
          <Opt type="radio" name="sex" label="Хүү" checked={sex === "boy"} onChange={() => setSex("boy")} />
          <Opt type="radio" name="sex" label="Охин" checked={sex === "girl"} onChange={() => setSex("girl")} />
        </div>
      </fieldset>

      <fieldset>
        <legend className="round">Одоо яаж ярьдаг вэ?</legend>
        <p className="hint">Хамгийн ойр тохирохыг нэгийг сонгоно.</p>
        <div className="opts">
          {STAGES.map((s, i) => <Opt key={i} type="radio" name="stage" label={s} checked={stage === i} onChange={() => setStage(i)} />)}
        </div>
      </fieldset>

      <fieldset>
        <legend className="round">Хэлснийг ойлгодог уу?</legend>
        <p className="hint">&quot;Бөмбөгөө аваад ир&quot; гэх мэт энгийн даалгаврыг биелүүлдэг үү.</p>
        <div className="chips">
          {Object.entries(COMP).map(([k, v]) =>
            <Opt key={k} type="radio" name="comp" label={v} checked={comp === k} onChange={() => setComp(k as Profile["comp"])} />)}
        </div>
      </fieldset>

      <fieldset>
        <legend className="round">Ажиглагддаг онцлог</legend>
        <p className="hint">Тохирох бүгдийг сонгоно. Байхгүй бол хоосон орхино.</p>
        <div className="opts">
          {Object.entries(FLAGS).map(([k, v]) =>
            <Opt key={k} type="checkbox" name="flags" label={v} checked={flags.includes(k)} onChange={() => setFlags(toggle(flags, k))} />)}
        </div>
      </fieldset>

      <fieldset>
        <legend className="round">Юунд дуртай вэ?</legend>
        <p className="hint">Хичээлийн үг, тоглоомыг үүгээр сонгоно. 1–3-ыг сонгоно.</p>
        <div className="chips">
          {Object.entries(LIKES).map(([k, v]) =>
            <Opt key={k} type="checkbox" name="likes" label={v.label} checked={likes.includes(k)} onChange={() => setLikes(toggle(likes, k))} />)}
        </div>
      </fieldset>

      <fieldset>
        <legend className="round">Өдөрт хэдэн минут гаргах вэ?</legend>
        <div className="chips">
          {Object.entries(TIMES).map(([k, v]) =>
            <Opt key={k} type="radio" name="time" label={v} checked={time === +k} onChange={() => setTime(+k)} />)}
        </div>
      </fieldset>

      <div className="formbar">
        {err && <p className="err" role="alert">{err}</p>}
        <button className="cta" onClick={submit} disabled={busy}>{busy && <span className="spin" />}{busy ? "Хадгалж байна…" : submitLabel}</button>
      </div>
    </div>
  );
}
