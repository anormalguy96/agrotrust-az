// agrotrust-az/tests/unit/validators.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Using relative import to avoid any remaining TS alias resolution issues in your editor
import {
  asArray,
  composeValidators,
  validate,
  isEmpty,
  required,
  requiredString,
  minLength,
  maxLength,
  pattern,
  email,
  url,
  number,
  integer,
  minNumber,
  maxNumber,
  positiveNumber,
  isIsoDateString,
  isoDate,
  futureDate,
  pastDate,
  oneOf,
  fileRequired,
  fileSizeMax,
  fileTypesAllowed,
  lotQuantityValidators,
  priceValidators,
  emailValidators
} from "../../src/utils/validators";

describe("validators utilities", () => {
  describe("asArray / composeValidators / validate", () => {
    it("asArray normalises single and array validators", () => {
      const v1 = required();
      expect(asArray(v1)).toHaveLength(1);
      expect(asArray([v1, minLength(2)])).toHaveLength(2);
      expect(asArray(undefined)).toHaveLength(0);
    });

    it("composeValidators returns first error", () => {
      const v = composeValidators<string>(
        required("REQ"),
        minLength(3, "MIN3")
      );

      expect(v("")).toBe("REQ");
      expect(v("ab")).toBe("MIN3");
      expect(v("abcd")).toBeNull();
    });

    it("validate works with single or multiple validators", () => {
      expect(validate("", required("X"))).toBe("X");
      expect(validate("ok", required("X"))).toBeNull();

      expect(
        validate("ab", [required("X"), minLength(3, "Y")])
      ).toBe("Y");
    });
  });

  describe("isEmpty", () => {
    it("detects empty values", () => {
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty("")).toBe(true);
      expect(isEmpty("   ")).toBe(true);
      expect(isEmpty([])).toBe(true);
    });

    it("does not treat 0 as empty", () => {
      expect(isEmpty(0)).toBe(false);
    });

    it("does not treat non-empty arrays/strings as empty", () => {
      expect(isEmpty("x")).toBe(false);
      expect(isEmpty([1])).toBe(false);
    });
  });

  describe("required / requiredString", () => {
    it("required flags empty values", () => {
      const v = required("REQ");
      expect(v("")).toBe("REQ");
      expect(v("  ")).toBe("REQ");
      expect(v(null)).toBe("REQ");
      expect(v(undefined)).toBe("REQ");
      expect(v("ok")).toBeNull();
    });

    it("requiredString is string-focused", () => {
      const v = requiredString("RS");
      expect(v("")).toBe("RS");
      expect(v("ok")).toBeNull();
    });
  });

  describe("minLength / maxLength", () => {
    it("minLength validates length", () => {
      const v = minLength(3, "MIN");
      expect(v("ab")).toBe("MIN");
      expect(v("abc")).toBeNull();
    });

    it("maxLength validates length", () => {
      const v = maxLength(3, "MAX");
      expect(v("abcd")).toBe("MAX");
      expect(v("abc")).toBeNull();
    });
  });

  describe("pattern", () => {
    it("passes empty values (optional fields)", () => {
      const v = pattern(/^\d+$/);
      expect(v("")).toBeNull();
    });

    it("validates regex match", () => {
      const v = pattern(/^\d+$/, "NUM");
      expect(v("123")).toBeNull();
      expect(v("12a")).toBe("NUM");
    });
  });

  describe("email", () => {
    it("validates common email formats", () => {
      const v = email("E");
      expect(v("")).toBeNull();
      expect(v("test@example.com")).toBeNull();
      expect(v("bad-email")).toBe("E");
    });

    it("emailValidators preset works", () => {
      expect(validate("", emailValidators)).toBeTruthy();
      expect(validate("user@example.com", emailValidators)).toBeNull();
    });
  });

  describe("url", () => {
    it("accepts valid URLs", () => {
      const v = url("U");
      expect(v("")).toBeNull();
      expect(v("https://example.com")).toBeNull();
    });

    it("rejects invalid URLs", () => {
      const v = url("U");
      expect(v("not a url")).toBe("U");
    });
  });

  describe("number / integer", () => {
    it("number validator accepts numeric input", () => {
      const v = number("N");
      expect(v("")).toBeNull();
      expect(v("12.5")).toBeNull();
      expect(v(10)).toBeNull();
      expect(v("abc")).toBe("N");
    });

    it("integer validator enforces whole values", () => {
      const v = integer("I");
      expect(v("")).toBeNull();
      expect(v("10")).toBeNull();
      expect(v(10)).toBeNull();
      expect(v("10.2")).toBe("I");
    });
  });

  describe("minNumber / maxNumber / positiveNumber", () => {
    it("minNumber enforces lower bound", () => {
      const v = minNumber(5, "MIN5");
      expect(v("")).toBeNull();
      expect(v("4")).toBe("MIN5");
      expect(v("5")).toBeNull();
    });

    it("maxNumber enforces upper bound", () => {
      const v = maxNumber(5, "MAX5");
      expect(v("")).toBeNull();
      expect(v("6")).toBe("MAX5");
      expect(v("5")).toBeNull();
    });

    it("positiveNumber requires > 0", () => {
      const v = positiveNumber("POS");
      expect(v("")).toBeNull();
      expect(v("0")).toBe("POS");
      expect(v("0.1")).toBeNull();
    });

    it("priceValidators preset behaves", () => {
      expect(validate("-1", priceValidators)).toBeTruthy();
      expect(validate("0", priceValidators)).toBeNull();
      expect(validate("10.5", priceValidators)).toBeNull();
    });
  });

  describe("ISO date validators", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-12-01T00:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("isIsoDateString detects valid strings", () => {
      expect(isIsoDateString("2025-11-21")).toBe(true);
      expect(isIsoDateString("not-a-date")).toBe(false);
    });

    it("isoDate validates ISO-like dates", () => {
      const v = isoDate("D");
      expect(v("")).toBeNull();
      expect(v("2025-11-21")).toBeNull();
      expect(v("bad")).toBe("D");
    });

    it("futureDate enforces future", () => {
      const v = futureDate("F");
      expect(v("")).toBeNull();
      expect(v("2025-12-02T00:00:00.000Z")).toBeNull();
      expect(v("2025-11-30T00:00:00.000Z")).toBe("F");
    });

    it("pastDate enforces past", () => {
      const v = pastDate("P");
      expect(v("")).toBeNull();
      expect(v("2025-11-30T00:00:00.000Z")).toBeNull();
      expect(v("2025-12-02T00:00:00.000Z")).toBe("P");
    });
  });

  describe("oneOf", () => {
    it("accepts allowed values", () => {
      const v = oneOf(["a", "b", "c"] as const, "O");
      expect(v("a")).toBeNull();
      expect(v("d" as any)).toBe("O");
    });
  });

  describe("file validators", () => {
    it("fileRequired flags absence", () => {
      const v = fileRequired("FR");
      expect(v(null)).toBe("FR");
      expect(v(undefined)).toBe("FR");
    });

    it("fileRequired accepts File", () => {
      const v = fileRequired("FR");
      const f = new File(["abc"], "a.txt", { type: "text/plain" });
      expect(v(f)).toBeNull();
    });

    it("fileSizeMax rejects large files", () => {
      const v = fileSizeMax(1024, "BIG"); // 1KB
      const big = new File([new ArrayBuffer(2048)], "big.bin", {
        type: "application/octet-stream"
      });
      expect(v(big)).toBe("BIG");
    });

    it("fileTypesAllowed enforces mime types", () => {
      const v = fileTypesAllowed(["image/png"], "TYPE");
      const txt = new File(["abc"], "a.txt", { type: "text/plain" });
      const png = new File([new ArrayBuffer(10)], "a.png", { type: "image/png" });

      expect(v(txt)).toBe("TYPE");
      expect(v(png)).toBeNull();
    });
  });

  describe("domain-friendly presets", () => {
    it("lotQuantityValidators requires a positive number", () => {
      expect(validate("", lotQuantityValidators)).toBeTruthy();
      expect(validate("0", lotQuantityValidators)).toBeTruthy();
      expect(validate("10", lotQuantityValidators)).toBeNull();
    });
  });
});
