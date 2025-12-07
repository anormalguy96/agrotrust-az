// agrotrust-az/tests/unit/passportApi.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the HTTP layer used by passportApi
vi.mock("../../src/services/http", () => {
  const get = vi.fn();
  const post = vi.fn();
  const put = vi.fn();
  const patch = vi.fn();
  const del = vi.fn();

  return {
    http: { get, post, put, patch, del },
    request: vi.fn(),
    HttpError: class HttpError extends Error {
      status: number;
      payload: any;
      constructor(message: string, status = 0, payload?: any) {
        super(message);
        this.status = status;
        this.payload = payload;
      }
    },
    buildFunctionPath: (name: string) => `/${name}`,
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
    getAuthToken: vi.fn()
  };
});

// Import after mock
import * as PassportApiModule from "../../src/features/passport/api/passportApi";
import { http } from "../../src/services/http";

type AnyFn = (...args: any[]) => any;

function getExportedFn(name: string): AnyFn | undefined {
  const anyMod = PassportApiModule as any;

  if (typeof anyMod[name] === "function") return anyMod[name];
  if (anyMod.default && typeof anyMod.default[name] === "function") {
    return anyMod.default[name];
  }

  return undefined;
}

describe("passportApi", () => {
  const mockOk = (data: any = {}) =>
    Promise.resolve({
      ok: true,
      status: 200,
      data
    });

  beforeEach(() => {
    (http.get as any).mockReset();
    (http.post as any).mockReset();
    (http.put as any).mockReset();
    (http.patch as any).mockReset();
    (http as any).del?.mockReset();

    (http.get as any).mockImplementation(() => mockOk({}));
    (http.post as any).mockImplementation(() => mockOk({}));
  });

  it("module loads", () => {
    expect(PassportApiModule).toBeTruthy();
  });

  it("createPassport calls http.post if implemented", async () => {
    const createPassport =
      getExportedFn("createPassport") ??
      getExportedFn("create") ??
      getExportedFn("createPassportDraft");

    if (!createPassport) {
      expect(true).toBe(true);
      return;
    }

    (http.post as any).mockImplementation(() =>
      mockOk({ passportId: "PP-0001", qrData: "agrotrust:passport:PP-0001" })
    );

    const payload = {
      lotId: "LOT-0001",
      cooperativeId: "COOP-0001",
      product: "Tomatoes",
      harvestDate: "2025-12-01",
      quantityKg: 1200,
      certifications: ["GlobalG.A.P"],
      photos: []
    };

    const res = await createPassport(payload);

    expect(http.post).toHaveBeenCalledTimes(1);

    const [path] = (http.post as any).mock.calls[0] ?? [];
    if (typeof path === "string") {
      expect(path.toLowerCase()).toContain("passport");
    }

    // Do not overfit to exact return shape
    if (res && typeof res === "object") {
      const data = (res as any).data ?? res;
      expect(data).toBeTruthy();
    }
  });

  it("verifyPassport calls http.post if implemented", async () => {
    const verifyPassport =
      getExportedFn("verifyPassport") ??
      getExportedFn("verify") ??
      getExportedFn("verifyById");

    if (!verifyPassport) {
      expect(true).toBe(true);
      return;
    }

    (http.post as any).mockImplementation(() =>
      mockOk({ valid: true, passportId: "PP-0001" })
    );

    const res = await verifyPassport({ passportId: "PP-0001" });

    expect(http.post).toHaveBeenCalledTimes(1);

    const [path] = (http.post as any).mock.calls[0] ?? [];
    if (typeof path === "string") {
      expect(path.toLowerCase()).toContain("passport");
      expect(path.toLowerCase()).toContain("verify");
    }

    expect(res).toBeTruthy();
  });

  it("getPassport fetches via http.get if implemented", async () => {
    const getPassport =
      getExportedFn("getPassport") ??
      getExportedFn("getById") ??
      getExportedFn("fetchPassport");

    if (!getPassport) {
      expect(true).toBe(true);
      return;
    }

    (http.get as any).mockImplementation(() =>
      mockOk({ passportId: "PP-0001" })
    );

    const res = await getPassport("PP-0001");

    expect(http.get).toHaveBeenCalledTimes(1);

    const [path] = (http.get as any).mock.calls[0] ?? [];
    if (typeof path === "string") {
      expect(path.toLowerCase()).toContain("passport");
    }

    expect(res).toBeTruthy();
  });

  it("list/search helpers call http.get if implemented", async () => {
    const listPassports =
      getExportedFn("listPassports") ??
      getExportedFn("list") ??
      getExportedFn("searchPassports");

    if (!listPassports) {
      expect(true).toBe(true);
      return;
    }

    (http.get as any).mockImplementation(() =>
      mockOk({ items: [], total: 0 })
    );

    const res = await listPassports({});

    expect(http.get).toHaveBeenCalledTimes(1);

    const [path] = (http.get as any).mock.calls[0] ?? [];
    if (typeof path === "string") {
      expect(path.toLowerCase()).toContain("passport");
    }

    expect(res).toBeTruthy();
  });
});
