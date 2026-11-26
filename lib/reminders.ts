/* Todug: сануулгын мэдэгдлийн агуулга. Долоо хоногт гурав: яагаад → юу хийх → яаж болов.
   Зөвхөн нийтэд нээлттэй UNITS-ийг ашиглана: төлбөртэй агуулга (lib/content.ts) мэдэгдэлд орохгүй.
   Түгжигдсэн дэлгэцэд харагдах тул хүүхдийн нэр оруулахгүй. */
import { UNITS } from "./engine";

export type Reminder = { title: string; body: string };
export type ReminderKind = "why" | "do" | "recap";

/* Улаанбаатарын цагаар (UTC+8) гараг: 0 = ням … 6 = бямба */
export function ubWeekday(now: Date): number {
  return new Date(now.getTime() + 8 * 60 * 60 * 1000).getUTCDay();
}
/* Даваа: яагаад; лхагва: юу хийх; бямба: яаж болов. Бусад өдөр илгээхгүй. */
export function reminderKind(weekday: number): ReminderKind | null {
  return weekday === 1 ? "why" : weekday === 3 ? "do" : weekday === 6 ? "recap" : null;
}
export function reminderFor(kind: ReminderKind, unitIdx: number | null): Reminder {
  const unit = unitIdx != null ? UNITS[unitIdx] : undefined;
  if (kind === "why") return unit
    ? { title: "Энэ долоо хоног: " + unit.title, body: "Зорилго: " + unit.goal }
    : { title: "Шинэ долоо хоног эхэллээ", body: "Хүүхдийнхээ энэ долоо хоногийн аргыг нээж үзээрэй." };
  if (kind === "do") return {
    title: "Өнөөдөр нэг хэвшилд",
    body: "Энэ долоо хоногийн аргаа хооллох, усанд орох, хувцаслах үедээ нэг удаа хийгээрэй. Хэлж үзүүлээд хүлээнэ.",
  };
  return {
    title: "Долоо хоног яаж өнгөрөв?",
    body: "Хийсэн өдрөө тэмдэглэж, ажиглагдсан шинж, шинэ үгээ бүртгээрэй.",
  };
}
