"use client";
import { useState } from "react";
import Icon from "@/components/Icon";

type Props = { label: string; value: string; onChange: (v: string) => void; autoComplete: "current-password" | "new-password"; minLength?: number; hint?: string };

/* Нууц үгийн талбар: бичсэнээ харах, нуух товчтой */
export default function PasswordField({ label, value, onChange, autoComplete, minLength, hint }: Props) {
  const [show, setShow] = useState(false);
  return (
    <label className="f">{label}
      <span className="pwd">
        <input type={show ? "text" : "password"} required minLength={minLength} autoComplete={autoComplete}
          autoCapitalize="none" spellCheck={false} value={value} onChange={e => onChange(e.target.value)} />
        <button type="button" aria-label={show ? "Нууц үгийг нуух" : "Нууц үгийг харах"} aria-pressed={show} onClick={() => setShow(s => !s)}>
          <Icon name={show ? "eyeOff" : "eye"} />
        </button>
      </span>
      {hint && <span className="hint" style={{ display: "block", margin: "6px 0 0", fontWeight: 400 }}>{hint}</span>}
    </label>
  );
}
