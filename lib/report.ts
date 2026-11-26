/* Todug: ахицын тайлангийн тооцоо. Зөвхөн цэвэр функц: дэлгэц, өгөгдлийн сангаас хамаарахгүй. */

const WEEK = 7 * 24 * 60 * 60 * 1000;

/* Огноонуудыг одоогоос ухраасан 7 хоногийн цонхнуудад тоолно. Буцаах дараалал: хамгийн хуучнаас шинэ рүү. */
export function weeklyCounts(dates: string[], now: Date, weeks = 8): number[] {
  const out = new Array<number>(weeks).fill(0);
  for (const d of dates) {
    const t = new Date(d).getTime();
    if (!Number.isFinite(t)) continue;
    const back = Math.floor((now.getTime() - t) / WEEK);
    if (back >= 0 && back < weeks) out[weeks - 1 - back]++;
  }
  return out;
}

/* Цонх бүрийн төгсгөл дэх нийт тоо: цонхноос өмнөх бүртгэлийг суурь болгон нэмнэ */
export function runningTotal(dates: string[], now: Date, weeks = 8): number[] {
  const counts = weeklyCounts(dates, now, weeks);
  const inWindow = counts.reduce((a, b) => a + b, 0);
  const valid = dates.filter(d => { const t = new Date(d).getTime(); return Number.isFinite(t) && t <= now.getTime(); }).length;
  let sum = valid - inWindow;
  return counts.map(c => (sum += c));
}

/* Шат бүрд хийсэн өдрийн тоо */
export function daysByUnit(rows: { unit: number; day: number }[]): Record<number, number> {
  const seen: Record<number, Set<number>> = {};
  for (const r of rows) (seen[r.unit] ||= new Set()).add(r.day);
  const out: Record<number, number> = {};
  for (const k of Object.keys(seen)) out[Number(k)] = seen[Number(k)].size;
  return out;
}
