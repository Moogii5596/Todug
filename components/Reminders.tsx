"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { getSupabase } from "@/lib/supabase";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function keyBytes(base64url: string) {
  const b64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Status = "loading" | "unsupported" | "denied" | "off" | "on";

/* Долоо хоногт гурван сануулга (даваа, лхагва, бямба, орой 19 цагт). Энэ хөтөч дээр асааж, унтраана. */
export default function Reminders() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let off = false;
    (async () => {
      if (!VAPID || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (!off) setStatus("unsupported");
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (off) return;
      setStatus(Notification.permission === "denied" ? "denied" : sub ? "on" : "off");
    })().catch(() => { if (!off) setStatus("unsupported"); });
    return () => { off = true; };
  }, []);

  async function enable() {
    setBusy(true); setMsg("");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setStatus(perm === "denied" ? "denied" : "off"); setBusy(false); return; }
      const sub = (await reg.pushManager.getSubscription())
        ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID) }));
      const j = sub.toJSON();
      const sb = getSupabase();
      /* Энэ хөтчийн хуучин мөр байвал сольж бичнэ */
      await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      const { error } = await sb.from("push_subscriptions").insert({ endpoint: sub.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth });
      if (error) { await sub.unsubscribe(); throw error; }
      setStatus("on");
    } catch {
      setMsg("Сануулгыг асааж чадсангүй. Дахин оролдоно уу.");
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true); setMsg("");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const { error } = await getSupabase().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        if (error) throw error;
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setMsg("Сануулгыг унтрааж чадсангүй. Дахин оролдоно уу.");
    }
    setBusy(false);
  }

  return (
    <div className="card">
      <div className="cardhead"><span className="badge"><Icon name="bell" size={18} /></span><h3 className="round">Сануулга</h3></div>
      <p className="muted">
        Долоо хоногт гурван мэдэгдэл: даваа гарагт энэ долоо хоногийн зорилго, лхагва гарагт хийх зүйл, бямба гарагт ахицаа тэмдэглэх сануулга. Орой 19 цагийн орчим ирнэ.
      </p>
      {status === "unsupported" && (
        <p className="muted">Энэ хөтөч мэдэгдэл дэмжихгүй байна. iPhone дээр Safari-ийн «Хуваалцах» цэснээс «Нүүр дэлгэцэд нэмэх»-ийг сонгоод, нүүр дэлгэцээс нээсний дараа асаана.</p>
      )}
      {status === "denied" && <p className="muted">Мэдэгдлийг хөтчийн тохиргоонд хаасан байна. Сайтын тохиргооноос мэдэгдлийг зөвшөөрөөд хуудсаа дахин ачаална уу.</p>}
      {msg && <p className="err" role="alert">{msg}</p>}
      {status === "off" && <button className="ghost" disabled={busy} onClick={enable}>{busy ? "Асааж байна…" : "Сануулга асаах"}</button>}
      {status === "on" && (
        <>
          <p className="ok" role="status" style={{ marginBottom: 12 }}>Энэ төхөөрөмж дээр асаалттай.</p>
          <button className="ghost" disabled={busy} onClick={disable}>{busy ? "Унтрааж байна…" : "Сануулга унтраах"}</button>
        </>
      )}
    </div>
  );
}
