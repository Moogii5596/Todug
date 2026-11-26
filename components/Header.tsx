"use client";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { useSession } from "@/lib/useSession";

/* usePathname нь динамик замд урьдчилан зурагдахгүй тул цэсийг Suspense дотор тусад нь зурна */
function Nav({ session }: { session: Session | null }) {
  const path = usePathname();
  const item = (href: string, label: string, cls = "") => (
    <Link href={href} className={"navlink " + cls} aria-current={path === href || path.startsWith(href + "/") ? "page" : undefined}>{label}</Link>
  );
  return session
    ? <>{item("/children", "Хүүхдүүд")}{item("/account", "Бүртгэл")}</>
    : <>{item("/blog", "Блог")}{path !== "/login" && item("/login", "Нэвтрэх", "solid")}</>;
}

export default function Header() {
  const { session, loading } = useSession();
  return (
    <header className="top">
      <Link href={session ? "/children" : "/"} className="brand round" aria-label="Todug, эхлэл">Tod<span>ug</span></Link>
      <nav aria-label="Үндсэн цэс">
        {!loading && <Suspense fallback={null}><Nav session={session} /></Suspense>}
      </nav>
    </header>
  );
}
