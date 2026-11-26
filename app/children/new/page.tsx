"use client";
import { useRouter } from "next/navigation";
import ChildForm from "@/components/ChildForm";
import Loading from "@/components/Loading";
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

  if (!ready) return <Loading />;
  return (
    <main>
      <h1 className="page round">Хүүхдийн мэдээлэл</h1>
      <p className="sub">6 богино асуулт. Хариултаар нь хичээлийн шат, үг, тоглоомыг сонгоно.</p>
      <ChildForm submitLabel="Хичээл боловсруулах" onSubmit={create} />
    </main>
  );
}
