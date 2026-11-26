"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Opts = { title: string; body?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };
const Ctx = createContext<(o: Opts) => Promise<boolean>>(async () => false);

/** Хөтчийн window.confirm-ийн оронд хэрэглэх баталгаажуулах цонх: `if (!(await confirm({...}))) return;` */
export const useConfirm = () => useContext(Ctx);

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<Opts | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  const confirm = useCallback((o: Opts) => new Promise<boolean>(resolve => {
    resolver.current?.(false);
    resolver.current = resolve;
    setOpts(o);
  }), []);

  useEffect(() => {
    if (opts && ref.current && !ref.current.open) ref.current.showModal();
  }, [opts]);

  function close(v: boolean) {
    ref.current?.close();
    resolver.current?.(v);
    resolver.current = null;
    setOpts(null);
  }

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <dialog ref={ref} className="dialog" aria-labelledby="confirm-title"
        onCancel={e => { e.preventDefault(); close(false); }}
        onClick={e => { if (e.target === ref.current) close(false); }}>
        {opts && (
          <>
            <h2 id="confirm-title" className="round">{opts.title}</h2>
            {opts.body && <p>{opts.body}</p>}
            <div className="rowbtns">
              <button type="button" className="ghost" autoFocus onClick={() => close(false)}>{opts.cancelLabel ?? "Болих"}</button>
              <button type="button" className={"cta" + (opts.danger ? " danger" : "")} onClick={() => close(true)}>{opts.confirmLabel ?? "Тийм"}</button>
            </div>
          </>
        )}
      </dialog>
    </Ctx.Provider>
  );
}
