import { describe, expect, it } from "vitest";
import { daysByUnit, runningTotal, weeklyCounts } from "./report";

const now = new Date("2026-11-26T12:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

describe("report helpers", () => {
  it("buckets dates into 7-day windows, oldest first", () => {
    expect(weeklyCounts([ago(0), ago(1), ago(6.9), ago(7.1), ago(20)], now, 4)).toEqual([0, 1, 1, 3]);
  });
  it("ignores dates outside the window, in the future, or invalid", () => {
    expect(weeklyCounts([ago(60), ago(-2), "nope"], now, 4)).toEqual([0, 0, 0, 0]);
  });
  it("running total starts from what was recorded before the window", () => {
    expect(runningTotal([ago(100), ago(90), ago(8), ago(1)], now, 4)).toEqual([2, 2, 3, 4]);
    expect(runningTotal([], now, 3)).toEqual([0, 0, 0]);
  });
  it("counts distinct days per unit", () => {
    expect(daysByUnit([{ unit: 2, day: 1 }, { unit: 2, day: 1 }, { unit: 2, day: 3 }, { unit: 5, day: 7 }])).toEqual({ 2: 2, 5: 1 });
  });
});
