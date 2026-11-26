import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CONTENT } from "./content";
import { buildPlan, fill, unlockedIds, LIKES, UNITS, type Profile } from "./engine";

const base: Profile = { name: "", years: 2, months: 6, sex: "boy", stage: 1, comp: "yes", flags: [], likes: ["ball"], time: 20, advance: 0 };

describe("lesson content", () => {
  it("has exactly one content entry per unit", () => {
    expect(CONTENT).toHaveLength(UNITS.length);
  });
  it("every unit has 3 lessons plus daily ideas, mastery signs and a tip, none with placeholders", () => {
    for (const u of CONTENT) {
      expect(u.lessons).toHaveLength(3);
      expect(new Set(u.lessons.map(l => l.name)).size).toBe(3);
      expect(u.signs.length).toBeGreaterThanOrEqual(3);
      expect(u.daily.length).toBeGreaterThanOrEqual(3);
      expect(u.stuck.length).toBeGreaterThan(20);
      /* Эдгээр болон алхмууд дэлгэцэд fill()-гүйгээр гардаг тул орлуулагч агуулж болохгүй */
      for (const t of [...u.signs, ...u.daily, u.stuck, ...u.lessons.flatMap(l => l.steps)]) expect(t).not.toMatch(/[{}]/);
    }
  });
  it("leaves no unresolved placeholder in any lesson for any like", () => {
    for (const like of Object.values(LIKES)) {
      for (const u of CONTENT) for (const l of u.lessons) {
        for (const s of [...l.steps, ...l.talk.map(t => t[1] ?? "")]) {
          const out = fill(s, like);
          expect(out).not.toMatch(/\{\w+\}/);
          const keys = [...s.matchAll(/\{(\w+)\}/g)].map(x => x[1].charAt(0).toLowerCase() + x[1].slice(1));
          for (const k of keys) expect(like).toHaveProperty(k);
        }
      }
    }
  });
});

describe("unlockedIds", () => {
  it("without access unlocks only the first week of the programme", () => {
    const plan = buildPlan(base);
    expect(unlockedIds(plan, false)).toEqual([plan.seq[0]]);
    expect(unlockedIds(plan, false)).toEqual([plan.ids[0]]);
  });
  it("without access unlocks nothing once the child has moved past the first window", () => {
    const plan = buildPlan({ ...base, advance: 4 });
    expect(plan.ids).not.toContain(plan.seq[0]);
    expect(unlockedIds(plan, false)).toEqual([]);
  });
  it("never unlocks the extra unit without access, and unlocks everything with it", () => {
    const plan = buildPlan({ ...base, flags: ["sounds"] });
    expect(plan.extra).toBe(10);
    expect(unlockedIds(plan, false)).not.toContain(10);
    expect(unlockedIds(plan, true)).toEqual([...plan.ids, 10]);
  });
  it("free week follows needBase: the base unit is the free one", () => {
    const plan = buildPlan({ ...base, stage: 3, comp: "no" });
    expect(plan.seq[0]).toBe(0);
    expect(unlockedIds(plan, false)).toEqual([0]);
  });
});

describe("paid content stays on the server", () => {
  /* lib/content.ts-ийг зөвхөн app/api доторх маршрут импортолно: өөр газраас импортолбол клиентийн багцад орно */
  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap(f => {
      const p = join(dir, f);
      if (f === "node_modules" || f.startsWith(".")) return [];
      return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
    });
  }
  it("only API routes (and tests) import lib/content", () => {
    const root = join(__dirname, "..");
    const offenders = ["app", "components", "lib"].flatMap(d => walk(join(root, d)))
      .filter(f => /from\s+["'](@\/lib\/content|\.\/content|\.\.\/lib\/content)["']/.test(readFileSync(f, "utf8")))
      .map(f => f.slice(root.length + 1))
      .filter(f => !f.startsWith(join("app", "api") + "/") && !f.endsWith(".test.ts"));
    expect(offenders).toEqual([]);
  });
});
