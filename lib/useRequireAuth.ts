"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./useSession";

/** Нэвтрээгүй хэрэглэгчийг нэвтрэх хуудас руу шилжүүлнэ */
export function useRequireAuth() {
  const { session, loading } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);
  return { session, ready: !loading && !!session };
}
