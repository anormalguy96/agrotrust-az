// agrotrust-az/tests/unit/format.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  isValidIsoDate,
  formatDate,
  daysTo,
  formatRelativeDays,
  formatMoney,
  formatNumber,
  formatQuantity,
  formatId,
  titleCase,
  sentenceCase,
  statusLabel,
  standardLabel,
  formatLocation,
  truncate,
  formatPercent
} from "@/utils/format";

describe("format utilities", () => {
  const LOCALE = "en-GB";

  describe("isValidIsoDate", () => {
    it("returns false for empty or invalid values", () => {
      expect(isValidIsoDate()).toBe(false);
      expect(isValidIsoDate("")).toBe(false);
      expect(isValidIsoDate("not-a-date")).toBe(false);
    });

    it("returns true for valid ISO values", () => {
      expect(isValidIsoDate("2025-11-21")).toBe(true);
      expect(isValidIsoDate("2025-11-21T08:15:00.000Z")).toBe(true);
    });
  });

  describe("formatDate", () => {
    it("returns em dash for invalid dates", () => {
      expect(formatDate(undefined, "medium", LOCALE)).toBe("—");
      expect(formatDate("invalid", "medium", LOCALE)).toBe("—");
    });

    it("formats valid dates without throwing", () => {
      const out = formatDate("2025-11-21T08:15:00.000Z", "medium", LOCALE);
      expect(out).not.toBe("—");
      expect(String(out)).toContain("2025");
    });

    it("supports withTime preset", () => {
      const out = formatDate("2025-11-21T08:15:00.000Z", "withTime", LOCALE);
      expect(out).not.toBe("—");
      expect(String(out)).toContain("2025");
    });
  });

  describe("daysTo / formatRelativeDays", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-12-01T00:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("computes positive days for future date", () => {
      const d = daysTo("2025-12-11T00:00:00.000Z");
      expect(d).toBe(10);
    });

    it("computes negative days for past date", () => {
      const d = daysTo("2025-11-21T00:00:00.000Z");
      expect(d).toBe(-10);
    });

    it("formats relative day strings deterministically", () => {
      expect(formatRelativeDays("2025-12-01T00:00:00.000Z")).toBe("today");
      expect(formatRelativeDays("2025-12-06T00:00:00.000Z")).toBe("5 days left");
      expect(formatRelativeDays("2025-11-30T00:00:00.000Z")).toBe("1 day ago");
    });
  });

  describe("formatMoney / formatNumber / formatQuantity", () => {
    it("handles invalid input gracefully", () => {
      expect(formatMoney(undefined, "USD", LOCALE)).toBe("—");
      expect(formatNumber(undefined, LOCALE)).toBe("—");
      expect(formatQuantity(undefined, "kg", LOCALE)).toBe("—");
    });

    it("formats money", () => {
      const out = formatMoney(24000, "USD", LOCALE);
      expect(out).toContain("24");
    });

    it("formats numbers and quantities", () => {
      const n = formatNumber(12345.678, LOCALE);
      expect(n).toContain("12");

      const q = formatQuantity(1200, "kg", LOCALE);
      expect(q).toContain("kg");
    });
  });

  describe("string helpers", () => {
    it("formatId returns em dash for empty", () => {
      expect(formatId()).toBe("—");
      expect(formatId("")).toBe("—");
    });

    it("titleCase converts basic tokens", () => {
      expect(titleCase("pending_review")).toBe("Pending Review");
      expect(titleCase("GLOBALG.A.P")).toBe("Globalg.a.p");
    });

    it("sentenceCase capitalises first character", () => {
      expect(sentenceCase("verified")).toBe("Verified");
      expect(sentenceCase("pending_review")).toBe("Pending review");
    });

    it("statusLabel presents a readable label", () => {
      expect(statusLabel("pending_review")).toBe("Pending review");
    });

    it("standardLabel maps known codes", () => {
      expect(standardLabel("ISO_22000")).toBe("ISO 22000");
      expect(standardLabel("GlobalG.A.P")).toBe("GlobalG.A.P");
      expect(standardLabel("SomethingElse")).toBe("SomethingElse");
    });
  });

  describe("formatLocation", () => {
    it("joins non-empty parts", () => {
      expect(formatLocation(["Azerbaijan", "Lankaran", ""])).toBe("Azerbaijan, Lankaran");
    });

    it("returns em dash when empty", () => {
      expect(formatLocation([undefined, "", null])).toBe("—");
    });
  });

  describe("truncate", () => {
    it("returns empty string for empty input", () => {
      expect(truncate()).toBe("");
    });

    it("truncates long text", () => {
      const s = "a".repeat(200);
      const out = truncate(s, 50);
      expect(out.length).toBe(50);
      expect(out.endsWith("…")).toBe(true);
    });
  });

  describe("formatPercent", () => {
    it("returns em dash for invalid input", () => {
      expect(formatPercent(undefined, LOCALE)).toBe("—");
    });

    it("formats as a percentage string", () => {
      const out = formatPercent(0.125, LOCALE, 1);
      expect(out).toContain("%");
    });
  });
});