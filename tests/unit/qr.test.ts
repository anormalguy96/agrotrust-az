// agrotrust-az/tests/unit/qr.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Using relative import to avoid TS alias issues in the editor
import {
  normaliseQrData,
  buildQrImageUrl,
  getQrSrc,
  openQrInNewTab,
  downloadQr,
  buildQrAltText
} from "../../src/utils/qr";

describe("qr utilities", () => {
  describe("normaliseQrData", () => {
    it("returns empty string for nullish values", () => {
      expect(normaliseQrData(null)).toBe("");
      expect(normaliseQrData(undefined)).toBe("");
    });

    it("trims string values", () => {
      expect(normaliseQrData("  abc  ")).toBe("abc");
    });

    it("stringifies non-string values", () => {
      expect(normaliseQrData(123)).toBe("123");
      expect(normaliseQrData(true)).toBe("true");
    });
  });

  describe("buildQrImageUrl / getQrSrc", () => {
    it("builds a provider URL with encoded data", () => {
      const url = buildQrImageUrl("agrotrust:passport:PP-0001");
      expect(url).toContain("create-qr-code");
      expect(url).toContain("size=");
      expect(url).toContain("data=");
      expect(url).toContain(encodeURIComponent("agrotrust:passport:PP-0001"));
    });

    it("respects custom size (clamped)", () => {
      const small = buildQrImageUrl("x", { size: 10 });
      expect(small).toContain("size=64x64");

      const large = buildQrImageUrl("x", { size: 5000 });
      expect(large).toContain("size=1024x1024");
    });

    it("uses custom provider if supplied", () => {
      const url = buildQrImageUrl("x", { providerBaseUrl: "https://example.com/qr" });
      expect(url.startsWith("https://example.com/qr?")).toBe(true);
    });

    it("getQrSrc mirrors buildQrImageUrl", () => {
      const a = buildQrImageUrl("test");
      const b = getQrSrc("test");
      expect(a).toBe(b);
    });
  });

  describe("openQrInNewTab", () => {
    const openSpy = vi.fn();

    beforeEach(() => {
      vi.stubGlobal("open", openSpy);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      openSpy.mockReset();
    });

    it("calls window.open with a QR URL", () => {
      openQrInNewTab("hello");
      expect(openSpy).toHaveBeenCalledTimes(1);
      const arg = openSpy.mock.calls[0]?.[0] as string;
      expect(arg).toContain("create-qr-code");
      expect(arg).toContain("data=hello");
    });
  });

  describe("downloadQr", () => {
    beforeEach(() => {
      // Ensure body exists
      document.body.innerHTML = "";
    });

    it("creates an anchor and triggers click", () => {
      const clickSpy = vi.fn();

      const originalCreate = document.createElement.bind(document);

      vi.spyOn(document, "createElement").mockImplementation((tagName: any) => {
        const el = originalCreate(tagName);
        if (tagName === "a") {
          // Patch click for assertion
          (el as HTMLAnchorElement).click = clickSpy as any;
        }
        return el;
      });

      downloadQr("payload-123", "my-qr.png");

      expect(clickSpy).toHaveBeenCalledTimes(1);

      // Restore
      (document.createElement as any).mockRestore?.();
    });

    it("does not throw on DOM edge cases", () => {
      // Force a failure path by stubbing appendChild to throw
      const appendSpy = vi
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => {
          throw new Error("blocked");
        });

      expect(() => downloadQr("x")).not.toThrow();

      appendSpy.mockRestore();
    });
  });

  describe("buildQrAltText", () => {
    it("builds readable alt text combinations", () => {
      expect(buildQrAltText("Passport", "PP-1")).toBe("Passport QR • PP-1");
      expect(buildQrAltText("Passport")).toBe("Passport QR");
      expect(buildQrAltText("", "PP-1")).toBe("QR • PP-1");
      expect(buildQrAltText("")).toBe("QR code");
    });
  });
});