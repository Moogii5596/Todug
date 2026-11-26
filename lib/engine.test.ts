import { describe, it, expect } from "vitest";
import { buildPlan, fill, STAGES, UNITS, LIKES, type Profile } from "./engine";

const RED_SLP = "Хэл засалчид үзүүлээрэй";
const AMBER_WATCH = "Ахицыг нь ажиглаарай";
const AMBER_COMP = "Ойлголтыг нь ажиглаарай";

function prof(over: Partial<Profile> = {}): Profile {
  return { name: "Тэмүүлэн", years: 2, months: 0, sex: "boy", stage: 3, comp: "yes",
    flags: [], likes: ["ball"], time: 20, advance: 0, ...over };
}
const titles = (p: Profile) => buildPlan(p).alerts.map(a => a.t);
const atMonths = (m: number, over: Partial<Profile> = {}) =>
  prof({ years: Math.floor(m / 12), months: m % 12, ...over });

describe("STAGES", () => {
  it("has a 6th option for age-appropriate speech", () => {
    expect(STAGES).toHaveLength(6);
    expect(STAGES[5]).toBe("Насандаа тохирсон, чөлөөтэй ярьдаг");
  });
});

describe("expected stage by age", () => {
  const cases: [number, number][] = [
    [0, 0], [11, 0], [12, 1], [23, 1], [24, 3], [35, 3], [36, 4], [47, 4], [48, 5], [72, 5], [120, 5],
  ];
  it.each(cases)("%i months → expected stage %i", (m, s) => {
    const plan = buildPlan(atMonths(m));
    expect(plan.months).toBe(m);
    expect(plan.exp.s).toBe(s);
    expect(plan.exp.text.length).toBeGreaterThan(0);
  });
});

describe("verdict and gap alerts: stage × age matrix", () => {
  const ages = [6, 12, 18, 23, 24, 30, 35, 36, 47, 48, 59, 60, 72, 96];
  const expS = (m: number) => (m < 12 ? 0 : m < 24 ? 1 : m < 36 ? 3 : m < 48 ? 4 : 5);

  for (const m of ages) {
    for (let stage = 0; stage < STAGES.length; stage++) {
      it(`age ${m}m, stage ${stage}`, () => {
        const plan = buildPlan(atMonths(m, { stage }));
        const gap = expS(m) - stage;
        expect(plan.gap).toBe(gap);

        if (gap <= 0) expect(plan.verdict).toContain("ойрхон");
        else if (gap === 1) expect(plan.verdict).toContain("бага зэрэг хоцорч");
        else expect(plan.verdict).toContain("нэлээд хоцорч");

        const t = plan.alerts.map(a => a.t);
        const red = (gap >= 2 && m >= 24) || (gap >= 1 && m >= 60);
        const amber = !red && gap === 1 && m >= 24;
        expect(t.includes(RED_SLP)).toBe(red);
        expect(t.includes(AMBER_WATCH)).toBe(amber);
        if (red) expect(plan.alerts.find(a => a.t === RED_SLP)!.lvl).toBe("red");
        if (amber) expect(plan.alerts.find(a => a.t === AMBER_WATCH)!.lvl).toBe("amber");
      });
    }
  }

  it("regression: 6-year-old at stage 4 is not 'ойрхон' and gets the red speech-therapist alert", () => {
    const plan = buildPlan(prof({ years: 6, months: 0, stage: 4 }));
    expect(plan.gap).toBe(1);
    expect(plan.verdict).not.toContain("ойрхон");
    expect(plan.verdict).toBe("Яриа нь насны түвшнээс бага зэрэг хоцорч байж болзошгүй.");
    expect(plan.alerts).toContainEqual(expect.objectContaining({ lvl: "red", t: RED_SLP }));
    expect(titles(prof({ years: 6, stage: 4 }))).not.toContain(AMBER_WATCH);
  });

  it("6-year-old at stage 5 gets no gap alert and the 'ойрхон' verdict", () => {
    const plan = buildPlan(prof({ years: 6, months: 0, stage: 5 }));
    expect(plan.gap).toBe(0);
    expect(plan.verdict).toContain("ойрхон");
    expect(plan.alerts).toEqual([]);
  });

  it("4-year-old at stage 4 gets amber, 5-year-old at stage 4 gets red", () => {
    expect(titles(prof({ years: 4, stage: 4 }))).toEqual([AMBER_WATCH]);
    expect(titles(prof({ years: 4, months: 11, stage: 4 }))).toEqual([AMBER_WATCH]);
    expect(titles(prof({ years: 5, stage: 4 }))).toEqual([RED_SLP]);
  });

  it("under 24 months there is never a gap alert", () => {
    expect(titles(prof({ years: 1, months: 11, stage: 0 }))).toEqual([]);
  });

  it("a child ahead of age (negative gap) gets the 'ойрхон' verdict", () => {
    const plan = buildPlan(prof({ years: 2, stage: 5 }));
    expect(plan.gap).toBe(-2);
    expect(plan.verdict).toContain("ойрхон");
  });
});

describe("other alerts", () => {
  it("comp 'some' from 24 months adds the amber comprehension alert", () => {
    const plan = buildPlan(prof({ years: 2, stage: 3, comp: "some" }));
    const a = plan.alerts.find(x => x.t === AMBER_COMP);
    expect(a).toBeDefined();
    expect(a!.lvl).toBe("amber");
    expect(a!.d).toContain("хэл засалч");
    expect(a!.d).toContain("сонсгол");
    expect(plan.needBase).toBe(false);
  });
  it("comp 'some' under 24 months, or comp yes/no, does not add it", () => {
    expect(titles(prof({ years: 1, months: 11, stage: 1, comp: "some" }))).not.toContain(AMBER_COMP);
    expect(titles(prof({ years: 3, stage: 4, comp: "yes" }))).not.toContain(AMBER_COMP);
    expect(titles(prof({ years: 3, stage: 4, comp: "no" }))).not.toContain(AMBER_COMP);
  });
  it("comp alert coexists with the gap alert", () => {
    const t = titles(prof({ years: 6, stage: 4, comp: "some" }));
    expect(t).toContain(RED_SLP);
    expect(t).toContain(AMBER_COMP);
  });

  it("regress → urgent red alert", () => {
    expect(buildPlan(prof({ flags: ["regress"] })).alerts[0]).toMatchObject({ lvl: "red", t: "Яаралтай эмчид үзүүлээрэй" });
  });
  it.each(["noName", "noPoint", "lowEye"])("social flag %s → developmental assessment + needBase", (f) => {
    const plan = buildPlan(prof({ flags: [f] }));
    expect(plan.needBase).toBe(true);
    expect(plan.alerts).toContainEqual(expect.objectContaining({ lvl: "red", t: "Хөгжлийн үнэлгээ хийлгээрэй" }));
  });
  it("hearing flag or comp 'no' from 18 months → hearing alert", () => {
    const H = "Сонсгол шалгуулаарай";
    expect(titles(prof({ flags: ["hearing"] }))).toContain(H);
    expect(titles(prof({ years: 1, months: 6, stage: 1, comp: "no" }))).toContain(H);
    expect(titles(prof({ years: 1, months: 5, stage: 1, comp: "no" }))).not.toContain(H);
    expect(titles(prof())).not.toContain(H);
  });
  it("stutter and screen → amber alerts", () => {
    const plan = buildPlan(prof({ flags: ["stutter", "screen"] }));
    expect(plan.alerts.map(a => [a.lvl, a.t])).toEqual([
      ["amber", "Гацахад нь тайван хандаарай"],
      ["amber", "Дэлгэцийн цагийг багасгаарай"],
    ]);
  });
  it("every alert has non-empty title and description", () => {
    const plan = buildPlan(prof({ years: 6, stage: 0, comp: "some",
      flags: ["regress", "noName", "hearing", "stutter", "screen", "sounds"] }));
    expect(plan.alerts.length).toBe(7);
    for (const a of plan.alerts) {
      expect(a.t.trim()).not.toBe("");
      expect(a.d.trim()).not.toBe("");
    }
  });
});

describe("sequence, ids and advance", () => {
  const START = [0, 2, 4, 6, 7, 7];
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  it.each(START.map((s, i) => [i, s] as [number, number]))("stage %i starts at unit %i and runs to 10", (stage, start) => {
    const plan = buildPlan(prof({ stage }));
    expect(plan.needBase).toBe(false);
    expect(plan.seq).toEqual(range(start, 10));
    expect(plan.ids).toEqual(plan.seq.slice(0, 4));
    expect(plan.advance).toBe(0);
    expect(plan.hasPrev).toBe(false);
    expect(plan.hasNext).toBe(plan.seq.length > 4);
  });

  it("needBase prepends unit 0 when start > 0", () => {
    const plan = buildPlan(prof({ stage: 3, comp: "no" }));
    expect(plan.needBase).toBe(true);
    expect(plan.seq).toEqual([0, 6, 7, 8, 9, 10]);
    expect(plan.ids).toEqual([0, 6, 7, 8]);
    expect(plan.hasNext).toBe(true);
  });
  it("needBase does not duplicate unit 0 when start is 0", () => {
    const plan = buildPlan(prof({ stage: 0, flags: ["lowEye"] }));
    expect(plan.seq).toEqual(range(0, 10));
    expect(plan.seq.filter(i => i === 0)).toHaveLength(1);
  });
  it("needBase at stage 5: [0, 7, 8, 9, 10]", () => {
    const plan = buildPlan(prof({ years: 5, stage: 5, flags: ["noPoint"] }));
    expect(plan.seq).toEqual([0, 7, 8, 9, 10]);
    expect(plan.ids).toEqual([0, 7, 8, 9]);
    expect(plan.hasNext).toBe(true);
    expect(buildPlan(prof({ years: 5, stage: 5, flags: ["noPoint"], advance: 1 })).hasNext).toBe(false);
  });

  it("every id in seq is a valid, unique, ascending UNITS index for every stage × needBase × advance", () => {
    for (let stage = 0; stage < STAGES.length; stage++) {
      for (const comp of ["yes", "no"] as const) {
        const base = buildPlan(prof({ stage, comp }));
        expect(base.seq.length).toBeGreaterThan(0);
        expect(base.seq[base.seq.length - 1]).toBe(UNITS.length - 1);
        expect(new Set(base.seq).size).toBe(base.seq.length);
        expect([...base.seq].sort((a, b) => a - b)).toEqual(base.seq);
        for (const id of base.seq) {
          expect(Number.isInteger(id)).toBe(true);
          expect(UNITS[id]).toBeDefined();
        }
        for (let advance = 0; advance < base.seq.length; advance++) {
          const plan = buildPlan(prof({ stage, comp, advance }));
          expect(plan.seq).toEqual(base.seq);
          expect(plan.advance).toBe(advance);
          expect(plan.ids).toEqual(base.seq.slice(advance, advance + 4));
          expect(plan.ids.length).toBeGreaterThanOrEqual(1);
          expect(plan.ids.length).toBeLessThanOrEqual(4);
          expect(plan.hasPrev).toBe(advance > 0);
          expect(plan.hasNext).toBe(advance + 4 < base.seq.length);
          for (const id of plan.ids) expect(UNITS[id]).toBeDefined();
        }
      }
    }
  });

  it("advancing week by week walks the whole sequence", () => {
    let advance = 0;
    const seen: number[] = [];
    for (;;) {
      const plan = buildPlan(prof({ stage: 0, advance }));
      seen.push(plan.ids[0]);
      if (!plan.hasNext) { seen.push(...plan.ids.slice(1)); break; }
      advance++;
    }
    expect(seen).toEqual(range(0, 10));
  });

  it("advance moves the window", () => {
    const plan = buildPlan(prof({ stage: 1, advance: 3 }));
    expect(plan.seq).toEqual(range(2, 10));
    expect(plan.ids).toEqual([5, 6, 7, 8]);
    expect(plan.hasPrev).toBe(true);
    expect(plan.hasNext).toBe(true);
    const end = buildPlan(prof({ stage: 1, advance: 5 }));
    expect(end.ids).toEqual([7, 8, 9, 10]);
    expect(end.hasNext).toBe(false);
  });

  it("clamps advance past the end to the last unit", () => {
    const plan = buildPlan(prof({ stage: 4, advance: 99 }));
    expect(plan.seq).toEqual([7, 8, 9, 10]);
    expect(plan.advance).toBe(3);
    expect(plan.ids).toEqual([10]);
    expect(plan.hasNext).toBe(false);
    expect(plan.hasPrev).toBe(true);
  });
  it("clamps negative advance to 0", () => {
    const plan = buildPlan(prof({ advance: -5 }));
    expect(plan.advance).toBe(0);
    expect(plan.hasPrev).toBe(false);
  });
  it.each([undefined, null, NaN, "abc"])("treats missing/invalid advance (%s) as 0", (bad) => {
    const plan = buildPlan(prof({ advance: bad as unknown as number }));
    expect(plan.advance).toBe(0);
    expect(plan.ids).toEqual([6, 7, 8, 9]);
  });
});

describe("extra unit (sounds)", () => {
  it("adds unit 10 when 'sounds' is flagged and it is not in this window", () => {
    expect(buildPlan(prof({ stage: 0, flags: ["sounds"] })).extra).toBe(10);
  });
  it("is null when unit 10 is already in the window", () => {
    expect(buildPlan(prof({ stage: 4, flags: ["sounds"] })).extra).toBeNull();
    expect(buildPlan(prof({ stage: 0, flags: ["sounds"], advance: 7 })).extra).toBeNull();
  });
  it("is null without the 'sounds' flag", () => {
    expect(buildPlan(prof({ stage: 0 })).extra).toBeNull();
  });
});

describe("fill", () => {
  const car = LIKES.car;
  it("replaces lowercase placeholders as-is", () => {
    expect(fill("{n} {v} {vp} {n2}", car)).toBe("машин яв явлаа дугуй");
  });
  it("capitalises when the placeholder is capitalised", () => {
    expect(fill("{N}! {Snd}! {V}", car)).toBe("Машин! Ту-ту! Яв");
    expect(fill("{N2}", car)).toBe("Дугуй");
  });
  it("keeps s3 sentence and surrounding markup", () => {
    expect(fill("<mark>{s3}.</mark>", car)).toBe("<mark>Аав машин барина.</mark>");
  });
  it("unknown placeholders become empty, plain text is untouched", () => {
    expect(fill("a{zzz}b", car)).toBe("ab");
    expect(fill("Миний ээлж.", car)).toBe("Миний ээлж.");
  });
});
