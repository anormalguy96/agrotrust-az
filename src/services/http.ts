// agrotrust-az/src/services/http.ts

/**
 * Lightweight HTTP client for AgroTrust AZ (Vite + Netlify)
 *
 * Goals:
 * - Small, reliable wrapper around fetch
 * - Sensible defaults for JSON APIs
 * - Helpful error shape for UI
 * - Works with Netlify Functions when base URL is not provided
 *
 * This is intentionally MVP-friendly.
 */

import { env } from "@/app/config/env";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpRequestOptions<TBody = unknown> = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: TBody;
  query?: Record<string, string | number | boolean | null | undefined>;

  /**
   * If true, we will not set JSON headers automatically.
   * Useful for FormData uploads.
   */
  rawBody?: boolean;

  /**
   * Request timeout in ms.
   */
  timeoutMs?: number;

  /**
   * Override base URL per request.
   */
  baseUrl?: string;

  /**
   * If true, do not include auth token even if present.
   */
  skipAuth?: boolean;

  /**
   * Override token resolution.
   */
  token?: string | null;
};

export type HttpResponse<T> = {
  ok: boolean;
  status: number;
  data: T;
  headers: Headers;
  url: string;
};

export class HttpError<TError = any> extends Error {
  status: number;
  url: string;
  payload?: TError;

  constructor(message: string, status: number, url: string, payload?: TError) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.url = url;
    this.payload = payload;
  }
}

const DEFAULT_TIMEOUT = 12_000;

/**
 * We keep token handling local to avoid cross-service coupling in the MVP.
 */
const AUTH_TOKEN_KEY = "agrotrust_auth_token_v1";

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Determine a safe default base URL.
 *
 * Preference order:
 * 1) env.apiBaseUrl
 * 2) env.functionsBaseUrl
 * 3) "/.netlify/functions" (works in prod + local netlify dev)
 * 4) "" (relative)
 */
function getDefaultBaseUrl(): string {
  const e = env as any;

  return (
    e.apiBaseUrl ||
    e.functionsBaseUrl ||
    "/.netlify/functions" ||
    ""
  );
}

function buildQuery(query?: HttpRequestOptions["query"]) {
  if (!query) return "";
  const params = new URLSearchParams();

  Object.entries(query).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    params.set(k, String(v));
  });

  const s = params.toString();
  return s ? `?${s}` : "";
}

function joinUrl(base: string, path: string) {
  if (!base) return path;
  if (!path) return base;

  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  // Fallback to text for non-JSON (or empty responses)
  const text = await res.text();
  return text as unknown as T;
}

/**
 * Core request
 */
export async function request<TResponse = any, TBody = any>(
  path: string,
  options: HttpRequestOptions<TBody> = {}
): Promise<HttpResponse<TResponse>> {
  const {
    method = "GET",
    headers = {},
    body,
    query,
    rawBody = false,
    timeoutMs = DEFAULT_TIMEOUT,
    baseUrl,
    skipAuth = false,
    token
  } = options;

  const base = baseUrl ?? getDefaultBaseUrl();
  const url = joinUrl(base, path) + buildQuery(query);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const finalHeaders: Record<string, string> = { ...headers };

    const resolvedToken =
      skipAuth ? null : token ?? getStoredToken();

    if (resolvedToken) {
      finalHeaders.Authorization = `Bearer ${resolvedToken}`;
    }

    let finalBody: BodyInit | undefined;

    if (body !== undefined && body !== null) {
      if (rawBody) {
        finalBody = body as unknown as BodyInit;
      } else {
        // Assume JSON
        if (!finalHeaders["Content-Type"]) {
          finalHeaders["Content-Type"] = "application/json";
        }
        if (!finalHeaders["Accept"]) {
          finalHeaders["Accept"] = "application/json";
        }
        finalBody = JSON.stringify(body);
      }
    } else {
      if (!finalHeaders["Accept"] && !rawBody) {
        finalHeaders["Accept"] = "application/json";
      }
    }

    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal
    });

    const data = await parseResponse<TResponse>(res);

    if (!res.ok) {
      throw new HttpError(
        (data as any)?.message ||
          `Request failed with status ${res.status}`,
        res.status,
        url,
        data
      );
    }

    return {
      ok: true,
      status: res.status,
      data,
      headers: res.headers,
      url
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new HttpError("Request timeout", 408, url);
    }
    if (err instanceof HttpError) {
      throw err;
    }
    throw new HttpError(err?.message || "Network error", 0, url);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Convenience helpers
 */
export const http = {
  get: <T = any>(path: string, options?: HttpRequestOptions) =>
    request<T>(path, { ...(options ?? {}), method: "GET" }),

  post: <T = any, B = any>(path: string, body?: B, options?: HttpRequestOptions<B>) =>
    request<T, B>(path, { ...(options ?? {}), method: "POST", body }),

  put: <T = any, B = any>(path: string, body?: B, options?: HttpRequestOptions<B>) =>
    request<T, B>(path, { ...(options ?? {}), method: "PUT", body }),

  patch: <T = any, B = any>(path: string, body?: B, options?: HttpRequestOptions<B>) =>
    request<T, B>(path, { ...(options ?? {}), method: "PATCH", body }),

  del: <T = any>(path: string, options?: HttpRequestOptions) =>
    request<T>(path, { ...(options ?? {}), method: "DELETE" })
};

/**
 * Small helper for building function paths consistently.
 * Example:
 *   await http.get(buildFunctionPath("health"))
 */
export function buildFunctionPath(name: string) {
  // With default base "/.netlify/functions", this becomes "/health"
  // With another baseUrl configured, joinUrl will handle it.
  return `/${name}`;
}

/**
 * Token utilities for AuthProvider / useAuth
 */
export function setAuthToken(tokenValue: string) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, tokenValue);
  } catch {
    // ignore in MVP
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function getAuthToken() {
  return getStoredToken();
}