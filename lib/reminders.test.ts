import { describe, expect, it } from "vitest";
import { UNITS } from "./engine";
import { reminderFor, reminderKind, ubWeekday } from "./reminders";

describe("reminders", () => {
  it("uses the Ulaanbaatar weekday (UTC+8)", () => {
    /* 2026-11-23 бол даваа гараг */
    expect(ubWeekday(new Date("2026-11-23T11:00:00Z"))).toBe(1);
    expect(ubWeekday(new Date("2026-11-22T16:30:00Z"))).toBe(1);   /* УБ-д аль хэдийн даваа */
    expect(ubWeekday(new Date("2026-11-23T15:59:00Z"))).toBe(1);
    expect(ubWeekday(new Date("2026-11-23T16:00:00Z"))).toBe(2);
  });
  it("sends three kinds a week and nothing on other days", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(reminderKind)).toEqual([null, "why", null, "do", null, null, "recap"]);
  });
  it("builds short messages from public unit data only", () => {
    for (let i = 0; i < UNITS.length; i++) {
      const r = reminderFor("why", i);
      expect(r.title).toContain(UNITS[i].title);
      expect(r.body).toContain(UNITS[i].goal);
    }
    for (const k of ["why", "do", "recap"] as const) {
      const r = reminderFor(k, null);
      expect(r.title.length).toBeGreaterThan(5);
      expect(r.title.length).toBeLessThanOrEqual(60);
      expect(r.body.length).toBeGreaterThan(20);
      expect(r.title + r.body).not.toMatch(/[{}<>]/);
    }
    expect(reminderFor("why", 99).title).toBe("Шинэ долоо хоног эхэллээ");
  });
});
