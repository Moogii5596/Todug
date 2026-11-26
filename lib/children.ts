import type { Profile } from "./engine";

export type ChildRow = {
  id: string; name: string; birth_month: string; sex: "boy" | "girl";
  stage: number; comp: "yes" | "some" | "no"; flags: string[]; likes: string[]; minutes: number;
  advance: number;
};

/* "YYYY-MM-01" мөрийг гараар задална: Date-ээр задлахад цагийн бүсээс болж сар гулсдаг. */
export function ageFromBirth(birthMonth: string, now: Date = new Date()): { years: number; months: number } {
  const m = /^(\d{4})-(\d{1,2})/.exec(birthMonth || "");
  if (!m) return { years: 0, months: 0 };
  const total = Math.max(0, (now.getFullYear() - Number(m[1])) * 12 + (now.getMonth() + 1 - Number(m[2])));
  return { years: Math.floor(total / 12), months: total % 12 };
}

export function birthFromAge(years: number, months: number, now: Date = new Date()): string {
  const age = Math.max(0, Math.floor(years || 0) * 12 + Math.floor(months || 0));
  const idx = now.getFullYear() * 12 + now.getMonth() - age;   /* 0-ээс эхэлсэн сарын дугаар */
  const y = Math.floor(idx / 12);
  const mo = idx - y * 12 + 1;
  return String(y).padStart(4, "0") + "-" + String(mo).padStart(2, "0") + "-01";
}

export function rowToProfile(r: ChildRow, now: Date = new Date()): Profile {
  const { years, months } = ageFromBirth(r.birth_month, now);
  return { name: r.name || "", years, months, sex: r.sex, stage: r.stage,
    comp: r.comp, flags: r.flags || [], likes: r.likes?.length ? r.likes : ["ball", "food"], time: r.minutes,
    advance: r.advance ?? 0 };
}
export function profileToRow(p: Profile, now: Date = new Date()) {
  return { name: p.name, birth_month: birthFromAge(p.years, p.months, now), sex: p.sex, stage: p.stage,
    comp: p.comp, flags: p.flags, likes: p.likes, minutes: p.time, advance: p.advance ?? 0 };
}
export function ageText(years: number, months: number) {
  return years + " нас" + (months ? " " + months + " сартай" : "");
}
