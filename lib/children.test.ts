import { describe, it, expect } from "vitest";
import { ageFromBirth, birthFromAge, rowToProfile, profileToRow, ageText, type ChildRow } from "./children";
import type { Profile } from "./engine";

const d = (y: number, m: number, day = 15) => new Date(y, m - 1, day);

describe("ageFromBirth", () => {
  it("counts whole months between birth month and current month", () => {
    expect(ageFromBirth("2024-05-01", d(2026, 11))).toEqual({ years: 2, months: 6 });
    expect(ageFromBirth("2026-11-01", d(2026, 11))).toEqual({ years: 0, months: 0 });
    expect(ageFromBirth("2025-11-01", d(2026, 11))).toEqual({ years: 1, months: 0 });
    expect(ageFromBirth("2025-12-01", d(2026, 11))).toEqual({ years: 0, months: 11 });
  });
  it("handles year boundaries", () => {
    expect(ageFromBirth("2025-12-01", d(2026, 1))).toEqual({ years: 0, months: 1 });
    expect(ageFromBirth("2024-01-01", d(2026, 12))).toEqual({ years: 2, months: 11 });
    expect(ageFromBirth("2023-12-01", d(2026, 1))).toEqual({ years: 2, months: 1 });
  });
  it("ignores the day of month of `now`", () => {
    expect(ageFromBirth("2024-05-01", d(2026, 5, 1))).toEqual({ years: 2, months: 0 });
    expect(ageFromBirth("2024-05-01", d(2026, 5, 31))).toEqual({ years: 2, months: 0 });
    expect(ageFromBirth("2024-05-01", new Date(2026, 4, 1, 0, 0, 0))).toEqual({ years: 2, months: 0 });
    expect(ageFromBirth("2024-05-01", new Date(2026, 3, 30, 23, 59, 59))).toEqual({ years: 1, months: 11 });
  });
  it("is never negative", () => {
    expect(ageFromBirth("2027-03-01", d(2026, 11))).toEqual({ years: 0, months: 0 });
  });
  it("accepts a timestamp-like string and tolerates garbage", () => {
    expect(ageFromBirth("2024-05-01T00:00:00+00:00", d(2026, 11))).toEqual({ years: 2, months: 6 });
    expect(ageFromBirth("", d(2026, 11))).toEqual({ years: 0, months: 0 });
    expect(ageFromBirth(undefined as unknown as string, d(2026, 11))).toEqual({ years: 0, months: 0 });
  });
});

describe("birthFromAge", () => {
  it("returns YYYY-MM-01", () => {
    expect(birthFromAge(2, 6, d(2026, 11))).toBe("2024-05-01");
    expect(birthFromAge(0, 0, d(2026, 11))).toBe("2026-11-01");
    expect(birthFromAge(1, 0, d(2026, 11, 30))).toBe("2025-11-01");
  });
  it("crosses year boundaries", () => {
    expect(birthFromAge(0, 1, d(2026, 1))).toBe("2025-12-01");
    expect(birthFromAge(0, 11, d(2026, 11))).toBe("2025-12-01");
    expect(birthFromAge(2, 11, d(2026, 12))).toBe("2024-01-01");
    expect(birthFromAge(3, 0, d(2026, 1))).toBe("2023-01-01");
  });
  it("normalises months >= 12", () => {
    expect(birthFromAge(1, 14, d(2026, 11))).toBe("2024-09-01");
  });

  it("round trips for every age 0..8 years and every current month", () => {
    for (let nm = 1; nm <= 12; nm++) {
      for (const day of [1, 15, 28]) {
        const now = d(2026, nm, day);
        for (let y = 0; y <= 8; y++) for (let m = 0; m < 12; m++) {
          const b = birthFromAge(y, m, now);
          expect(b).toMatch(/^\d{4}-(0[1-9]|1[0-2])-01$/);
          expect(ageFromBirth(b, now)).toEqual({ years: y, months: m });
        }
      }
    }
  });
  it("round trips at the last and first instants of a year", () => {
    for (const now of [new Date(2026, 11, 31, 23, 59, 59), new Date(2027, 0, 1, 0, 0, 0)]) {
      expect(ageFromBirth(birthFromAge(4, 7, now), now)).toEqual({ years: 4, months: 7 });
    }
  });
  it("age grows as time passes", () => {
    const b = birthFromAge(2, 10, d(2026, 11));
    expect(ageFromBirth(b, d(2026, 12))).toEqual({ years: 2, months: 11 });
    expect(ageFromBirth(b, d(2027, 1))).toEqual({ years: 3, months: 0 });
    expect(ageFromBirth(b, d(2028, 1))).toEqual({ years: 4, months: 0 });
  });
});

describe("rowToProfile / profileToRow", () => {
  const now = d(2026, 11);
  const row: ChildRow = { id: "x", name: "Номин", birth_month: "2023-08-01", sex: "girl", stage: 2,
    comp: "some", flags: ["screen"], likes: ["doll"], minutes: 20, advance: 2 };

  it("derives the current age from birth_month and passes advance", () => {
    expect(rowToProfile(row, now)).toEqual({ name: "Номин", years: 3, months: 3, sex: "girl", stage: 2,
      comp: "some", flags: ["screen"], likes: ["doll"], time: 20, advance: 2 });
  });
  it("applies defaults for missing name, flags, likes and advance", () => {
    const p = rowToProfile({ ...row, name: null, flags: null, likes: [], advance: undefined } as unknown as ChildRow, now);
    expect(p.name).toBe("");
    expect(p.flags).toEqual([]);
    expect(p.likes).toEqual(["ball", "food"]);
    expect(p.advance).toBe(0);
  });
  it("profileToRow returns exactly the stored columns", () => {
    const p: Profile = { name: "Номин", years: 3, months: 3, sex: "girl", stage: 2, comp: "some",
      flags: ["screen"], likes: ["doll"], time: 20, advance: 2 };
    expect(profileToRow(p, now)).toEqual({ name: "Номин", birth_month: "2023-08-01", sex: "girl", stage: 2,
      comp: "some", flags: ["screen"], likes: ["doll"], minutes: 20, advance: 2 });
  });
  it("row → profile → row is stable", () => {
    const { id, ...rest } = row;
    expect(id).toBe("x");
    expect(profileToRow(rowToProfile(row, now), now)).toEqual(rest);
  });
});

describe("ageText", () => {
  it("formats years and optional months", () => {
    expect(ageText(3, 0)).toBe("3 нас");
    expect(ageText(2, 6)).toBe("2 нас 6 сартай");
  });
});
