// agrotrust-az/tests/unit/storage.test.ts

import { describe, it, expect, beforeEach } from "vitest";

// Relative import to avoid any remaining TS alias resolution issues
import {
  getItem,
  setItem,
  removeItem,
  clear,
  getJSON,
  setJSON,
  safeGetJSON,
  safeSetJSON,
  withPrefix,
  STORAGE_PREFIXES,
  getBool,
  setBool,
  getNumber,
  setNumber
} from "../../src/services/storage";

describe("storage utilities", () => {
  beforeEach(() => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // ignore
    }

    // Clear in-memory store used by our wrapper
    clear("memory");
  });

  describe("getItem / setItem / removeItem", () => {
    it("stores and retrieves values in local storage by default", () => {
      setItem("k1", "v1");
      expect(getItem("k1")).toBe("v1");
    });

    it("stores and retrieves values in session storage", () => {
      setItem("k2", "v2", "session");
      expect(getItem("k2", "session")).toBe("v2");
      expect(getItem("k2", "local")).toBeNull();
    });

    it("removes values", () => {
      setItem("k3", "v3");
      expect(getItem("k3")).toBe("v3");
      removeItem("k3");
      expect(getItem("k3")).toBeNull();
    });

    it("works with memory area", () => {
      setItem("mk1", "mv1", "memory");
      expect(getItem("mk1", "memory")).toBe("mv1");
      removeItem("mk1", "memory");
      expect(getItem("mk1", "memory")).toBeNull();
    });
  });

  describe("clear", () => {
    it("clears all keys for a storage area", () => {
      setItem("a", "1");
      setItem("b", "2");
      expect(getItem("a")).toBe("1");
      expect(getItem("b")).toBe("2");

      clear("local");

      expect(getItem("a")).toBeNull();
      expect(getItem("b")).toBeNull();
    });

    it("clears by prefix", () => {
      setItem("p:one", "1");
      setItem("p:two", "2");
      setItem("q:one", "3");

      clear("local", "p:");

      expect(getItem("p:one")).toBeNull();
      expect(getItem("p:two")).toBeNull();
      expect(getItem("q:one")).toBe("3");
    });

    it("clears memory by prefix", () => {
      setItem("m:p:one", "1", "memory");
      setItem("m:p:two", "2", "memory");
      setItem("m:q:one", "3", "memory");

      clear("memory", "m:p:");

      expect(getItem("m:p:one", "memory")).toBeNull();
      expect(getItem("m:p:two", "memory")).toBeNull();
      expect(getItem("m:q:one", "memory")).toBe("3");
    });
  });

  describe("getJSON / setJSON", () => {
    it("stores and retrieves JSON objects", () => {
      const obj = { a: 1, b: "x" };

      setJSON("json1", obj);
      const out = getJSON("json1", { a: 0, b: "" });

      expect(out).toEqual(obj);
    });

    it("returns fallback for missing key", () => {
      const fallback = { ok: false };
      const out = getJSON("missing", fallback);
      expect(out).toEqual(fallback);
    });

    it("returns fallback for invalid JSON", () => {
      setItem("badjson", "{not valid");
      const fallback = { safe: true };
      const out = getJSON("badjson", fallback);
      expect(out).toEqual(fallback);
    });

    it("safeGetJSON / safeSetJSON work", () => {
      safeSetJSON("s1", { x: 10 });
      expect(safeGetJSON("s1", { x: 0 })).toEqual({ x: 10 });
    });
  });

  describe("withPrefix / STORAGE_PREFIXES", () => {
    it("builds consistent namespaced keys", () => {
      const key = withPrefix(STORAGE_PREFIXES.AUTH, "token");
      expect(key).toBe("agrotrust:auth:token");
    });
  });

  describe("getBool / setBool", () => {
    it("handles boolean storage", () => {
      const k = "flag1";

      expect(getBool(k, false)).toBe(false);

      setBool(k, true);
      expect(getBool(k, false)).toBe(true);

      setBool(k, false);
      expect(getBool(k, true)).toBe(false);
    });
  });

  describe("getNumber / setNumber", () => {
    it("handles numeric storage", () => {
      const k = "num1";

      expect(getNumber(k, 7)).toBe(7);

      setNumber(k, 42);
      expect(getNumber(k, 0)).toBe(42);
    });

    it("ignores non-finite numbers in setNumber", () => {
      const k = "num2";

      setNumber(k, Number.NaN);
      expect(getNumber(k, 5)).toBe(5);

      setNumber(k, Number.POSITIVE_INFINITY);
      expect(getNumber(k, 5)).toBe(5);
    });
  });
});
