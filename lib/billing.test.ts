import { describe, expect, it } from "vitest";
import { activeUntil, dateText, money } from "./billing";

describe("money", () => {
  it("groups thousands and adds the tugrik sign", () => {
    expect(money(19900)).toBe("19,900₮");
    expect(money(1000000)).toBe("1,000,000₮");
    expect(money(500)).toBe("500₮");
  });
});

describe("dateText", () => {
  it("formats in Ulaanbaatar time (UTC+8)", () => {
    expect(dateText("2026-11-26T03:00:00Z")).toBe("2026.11.26");
    expect(dateText("2026-11-26T17:00:00Z")).toBe("2026.11.27");
  });
  it("returns empty text for missing or bad input", () => {
    expect(dateText(null)).toBe("");
    expect(dateText("nope")).toBe("");
  });
});

describe("activeUntil", () => {
  const now = new Date("2026-11-26T00:00:00Z");
  it("picks the latest unexpired paid order", () => {
    expect(activeUntil([
      { status: "paid", access_until: "2026-12-26T00:00:00Z" },
      { status: "paid", access_until: "2027-02-26T00:00:00Z" },
    ], now)).toBe("2027-02-26T00:00:00Z");
  });
  it("ignores pending, cancelled and expired orders", () => {
    expect(activeUntil([
      { status: "pending", access_until: null },
      { status: "cancelled", access_until: "2027-01-01T00:00:00Z" },
      { status: "paid", access_until: "2026-11-01T00:00:00Z" },
    ], now)).toBeNull();
  });
});
