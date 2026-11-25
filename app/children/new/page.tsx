"use client";
import { useRouter } from "next/navigation";
import ChildForm from "@/components/ChildForm";
import { profileToRow } from "@/lib/children";
import type { Profile } from "@/lib/engine";
import { getSupabase } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function NewChild() {
  const { ready } = useRequireAuth();
  const router = useRouter();

  async function create(p: Profile) {
    const { data, error } = await getSupabase().from("todug_children").insert(profileToRow(p)).select("id").single();
    if (error || !data) return "Хадгалж чадсангүй. Дахин оролдоно уу.";
    router.push("/children/" + data.id);
  }

  if (!ready) return <main><p className="muted">Ачаалж байна…</p></main>;
  return (
    <main>
      <h1 className="page round">Хүүхдийн мэдээлэл</h1>
      <ChildForm submitLabel="Хичээл боловсруулах" onSubmit={create} />
    </main>
  );
}
