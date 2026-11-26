"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

export default function Header() {
  const { session, loading } = useSession();
  const router = useRouter();
  async function signOut() {
    await getSupabase().auth.signOut();
    router.push("/");
  }
  return (
    <header className="top">
      <Link href="/" className="brand round">Tod<span>ug</span></Link>
      <nav>
        {!loading && session && (
          <>
            <Link href="/children" className="link">Хүүхдүүд</Link>
            <Link href="/account" className="link">Бүртгэл</Link>
            <button className="link" onClick={signOut}>Гарах</button>
          </>
        )}
        {!loading && !session && (
          <>
            <Link href="/blog" className="link">Блог</Link>
            <Link href="/login" className="link">Нэвтрэх</Link>
          </>
        )}
      </nav>
    </header>
  );
}
