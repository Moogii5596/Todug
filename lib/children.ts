import type { Profile } from "./engine";

export type ChildRow = {
  id: string; name: string; years: number; months: number; sex: "boy" | "girl";
  stage: number; comp: "yes" | "some" | "no"; flags: string[]; likes: string[]; minutes: number;
};

export function rowToProfile(r: ChildRow): Profile {
  return { name: r.name || "", years: r.years, months: r.months, sex: r.sex, stage: r.stage,
    comp: r.comp, flags: r.flags || [], likes: r.likes?.length ? r.likes : ["ball", "food"], time: r.minutes };
}
export function profileToRow(p: Profile) {
  return { name: p.name, years: p.years, months: p.months, sex: p.sex, stage: p.stage,
    comp: p.comp, flags: p.flags, likes: p.likes, minutes: p.time };
}
export function ageText(years: number, months: number) {
  return years + " нас" + (months ? " " + months + " сартай" : "");
}
