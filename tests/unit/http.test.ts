// agrotrust-az/tests/unit/http.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Relative import to avoid any remaining TS alias issues
import {
  request,
  http,
  HttpError,
  buildFunctionPath,
  setAuthToken,
  clearAuthToken,
  getAuthToken
} from "../../src/services/http";

describe("http service", () => {
  beforeEach(() => {
    // Clean localStorage between tests
    try {
      window.localStorage.clear();
    } catch {
      // ignore in non-browser edge cases
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const makeJsonResponse = (body: any, ok = true, status = 200, contentType = "application/json") => {
    const headers = {
      get: vi.fn().mockReturnValue(contentType)
    } as any;

    return {
      ok,
      status,
      headers,
      url: "/test",
      json: vi.fn().mockResolvedValue(body),
      text: vi.fn().mockResolvedValue(JSON.stringify(body))
    } as any;
  };

  it("performs a basic GET request and returns parsed JSON", async () => {
    const payload = { hello: "world" };
    const mockRes = makeJsonResponse(payload, true, 200);

    const fetchMock = vi.fn().mockResolvedValue(mockRes);
    vi.stubGlobal("fetch", fetchMock);

    const res = await request<typeof payload>("/demo", { baseUrl: "" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/demo");
    expect(init.method).toBe("GET");

    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.data).toEqual(payload);
  });

  it("sends JSON body and headers for POST requests", async () => {
    const payload = { ok: true };
    const mockRes = makeJsonResponse(payload, true, 201);

    const fetchMock = vi.fn().mockImplementation(async (_url, init: any) => {
      // Body should be JSON string
      expect(init.method).toBe("POST");
      expect(init.headers["Content-Type"]).toBe("application/json");
      expect(init.headers["Accept"]).toBe("application/json");
      expect(init.body).toBe(JSON.stringify({ foo: "bar" }));
      return mockRes;
    });

    vi.stubGlobal("fetch", fetchMock);

    const res = await request("/post", {
      baseUrl: "",
      method: "POST",
      body: { foo: "bar" }
    });

    expect(res.status).toBe(201);
    expect(res.data).toEqual(payload);
  });

  it("wraps non-2xx responses in HttpError with payload", async () => {
    const errorBody = { message: "Bad input", code: "VALIDATION_ERROR" };
    const mockRes = makeJsonResponse(errorBody, false, 400);

    const fetchMock = vi.fn().mockResolvedValue(mockRes);
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      request("/bad", { baseUrl: "" })
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as HttpError<any>;
      expect(e).toBeInstanceOf(HttpError);
      expect(e.status).toBe(400);
      expect(e.message).toBe("Bad input");
      expect(e.payload?.code).toBe("VALIDATION_ERROR");
      return true;
    });
  });

  it("wraps generic network errors in HttpError with status 0", async () => {
    const networkError = new Error("Network down");
    const fetchMock = vi.fn().mockRejectedValue(networkError);
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      request("/network", { baseUrl: "" })
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as HttpError;
      expect(e).toBeInstanceOf(HttpError);
      expect(e.status).toBe(0);
      expect(e.message).toBe("Network down");
      return true;
    });
  });

  it("maps AbortError to a 408 Request timeout HttpError", async () => {
    const abortError = Object.assign(new Error("Aborted"), { name: "AbortError" });
    const fetchMock = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      request("/timeout", { baseUrl: "", timeoutMs: 10 })
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as HttpError;
      expect(e).toBeInstanceOf(HttpError);
      expect(e.status).toBe(408);
      expect(e.message).toBe("Request timeout");
      return true;
    });
  });

  it("adds Authorization header when auth token is stored", async () => {
    setAuthToken("demo-token");

    const payload = { ok: true };
    const mockRes = makeJsonResponse(payload, true, 200);

    const fetchMock = vi.fn().mockImplementation(async (_url, init: any) => {
      expect(init.headers.Authorization).toBe("Bearer demo-token");
      return mockRes;
    });

    vi.stubGlobal("fetch", fetchMock);

    const res = await request("/auth-test", { baseUrl: "" });
    expect(res.ok).toBe(true);
  });

  it("skips auth header when skipAuth is true", async () => {
    setAuthToken("demo-token");

    const mockRes = makeJsonResponse({ ok: true }, true, 200);

    const fetchMock = vi.fn().mockImplementation(async (_url, init: any) => {
      expect(init.headers.Authorization).toBeUndefined();
      return mockRes;
    });

    vi.stubGlobal("fetch", fetchMock);

    const res = await request("/no-auth", { baseUrl: "", skipAuth: true });
    expect(res.ok).toBe(true);
  });

  it("http.get and http.post delegate to request", async () => {
    const mockRes = makeJsonResponse({ ok: true }, true, 200);

    const fetchMock = vi.fn().mockResolvedValue(mockRes);
    vi.stubGlobal("fetch", fetchMock);

    const g = await http.get("/demo-get", { baseUrl: "" });
    const p = await http.post("/demo-post", { foo: "bar" }, { baseUrl: "" });

    expect(g.ok).toBe(true);
    expect(p.ok).toBe(true);

    const methods = fetchMock.mock.calls.map((c) => c[1].method);
    expect(methods).toContain("GET");
    expect(methods).toContain("POST");
  });

  it("buildFunctionPath prefixes with a slash", () => {
    expect(buildFunctionPath("health")).toBe("/health");
    expect(buildFunctionPath("passport-create")).toBe("/passport-create");
  });

  it("auth token helpers round-trip via localStorage", () => {
    clearAuthToken();
    expect(getAuthToken()).toBeNull();

    setAuthToken("xyz");
    expect(getAuthToken()).toBe("xyz");

    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });
});
