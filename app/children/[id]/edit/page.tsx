"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ChildForm from "@/components/ChildForm";
import { profileToRow, rowToProfile, type ChildRow } from "@/lib/children";
import type { Profile } from "@/lib/engine";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function EditChild() {
  const { id } = useParams<{ id: string }>();
  const { ready } = useRequireAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!ready) return;
    getSupabase().from("todug_children").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error || !data) setErr("Энэ хүүхдийн мэдээлэл олдсонгүй.");
      else setProfile(rowToProfile(data as ChildRow));
    });
  }, [ready, id]);

  async function update(p: Profile) {
    const { error } = await getSupabase().from("todug_children").update(profileToRow(p)).eq("id", id);
    if (error) return "Хадгалж чадсангүй. Дахин оролдоно уу.";
    router.push("/children/" + id);
  }

  if (err) return <main><p className="err" role="alert">{err}</p></main>;
  if (!ready || !profile) return <main><p className="muted">Ачаалж байна…</p></main>;
  return (
    <main>
      <h1 className="page round">Мэдээлэл засах</h1>
      <ChildForm initial={profile} submitLabel="Хадгалах" onSubmit={update} />
    </main>
  );
}
