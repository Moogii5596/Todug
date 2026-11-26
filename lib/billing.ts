/* Todug: төлбөрийн тохиргоо ба туслах функцүүд.
   Багц, үнэ нь өгөгдлийн сангийн todug.plans хүснэгтэд байна. */

/* Шилжүүлэг хүлээн авах данс. Хүлээн авагчийн нэрийг NEXT_PUBLIC_BANK_HOLDER хувьсагчаар өгнө. */
export const BANK = {
  bank: "М банк",
  account: "MN470039008734099978",
  holder: process.env.NEXT_PUBLIC_BANK_HOLDER ?? "",
};

export type PlanRow = { id: string; label: string; months: number; amount: number };
export type OrderStatus = "pending" | "paid" | "cancelled";
export type Order = {
  id: number; code: string; plan_id: string; months: number; amount: number; status: OrderStatus;
  created_at: string; decided_at: string | null; access_until: string | null;
};
export type AdminOrder = Omit<Order, "plan_id"> & { email: string; plan_label: string };

export const STATUS: Record<OrderStatus, string> = {
  pending: "Төлбөр хүлээгдэж байна", paid: "Төлсөн", cancelled: "Цуцалсан",
};

/* 19900 -> "19,900₮" */
export function money(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "₮";
}

/* ISO огноог Улаанбаатарын цагаар "2026.11.26" болгоно */
export function dateText(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const ub = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const p = (x: number) => String(x).padStart(2, "0");
  return ub.getUTCFullYear() + "." + p(ub.getUTCMonth() + 1) + "." + p(ub.getUTCDate());
}

/* Хүчинтэй эрхийн дуусах хугацаа (байхгүй бол null) */
export function activeUntil(orders: Pick<Order, "status" | "access_until">[], now: Date = new Date()): string | null {
  let best: string | null = null;
  for (const o of orders) {
    if (o.status !== "paid" || !o.access_until) continue;
    if (new Date(o.access_until).getTime() <= now.getTime()) continue;
    if (!best || new Date(o.access_until).getTime() > new Date(best).getTime()) best = o.access_until;
  }
  return best;
}
