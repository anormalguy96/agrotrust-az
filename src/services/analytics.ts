// agrotrust-az/src/services/analytics.ts

/**
 * Minimal analytics layer for AgroTrust AZ (MVP)
 *
 * Purpose:
 * - Provide a single, safe interface for tracking events
 * - Avoid vendor lock-in during hackathon
 * - Allow easy swap to GA4, PostHog, Umami, etc.
 *
 * Behaviour:
 * - By default, this is a no-op unless explicitly enabled.
 * - If enabled but no vendor is present, it will log to console
 *   and optionally store a tiny local buffer for demo inspection.
 */

import { env } from "@/app/config/env";
import {
  safeGetJSON,
  safeSetJSON,
  withPrefix,
  STORAGE_PREFIXES
} from "./storage";

export type AnalyticsEventName =
  | "page_view"
  | "auth_sign_in"
  | "auth_sign_up"
  | "passport_created"
  | "passport_verified"
  | "cert_requested"
  | "cert_verified"
  | "rfq_created"
  | "rfq_response_submitted"
  | "escrow_initiated"
  | "escrow_released"
  | "error";

export type AnalyticsEventPayload = Record<string, unknown>;

export type AnalyticsIdentify = {
  id: string;
  email?: string;
  role?: "farmer" | "buyer" | "admin" | "guest" | string;
  organisation?: string;
  country?: string;
};

type StoredEvent = {
  name: string;
  payload?: AnalyticsEventPayload;
  ts: string;
  page?: string;
};

const BUFFER_KEY = withPrefix(STORAGE_PREFIXES.UI, "analytics_buffer_v1");
const BUFFER_LIMIT = 80;

/**
 * Resolve analytics enablement.
 * We avoid assuming exact env shape to keep compile stable.
 */
function isEnabled(): boolean {
  const e = env as any;
  return Boolean(e?.enableAnalytics);
}

/**
 * Try to call known global providers if present.
 * This is optional and safe to ignore.
 */
function sendToProvider(name: string, payload?: AnalyticsEventPayload) {
  const w = window as any;

  // Example: Umami
  if (typeof w?.umami?.track === "function") {
    try {
      w.umami.track(name, payload ?? {});
      return true;
    } catch {
      // ignore
    }
  }

  // Example: PostHog
  if (typeof w?.posthog?.capture === "function") {
    try {
      w.posthog.capture(name, payload ?? {});
      return true;
    } catch {
      // ignore
    }
  }

  // Example: GA4 gtag
  if (typeof w?.gtag === "function") {
    try {
      w.gtag("event", name, payload ?? {});
      return true;
    } catch {
      // ignore
    }
  }

  return false;
}

function pushToBuffer(evt: StoredEvent) {
  const list = safeGetJSON<StoredEvent[]>(BUFFER_KEY, []);
  const next = [evt, ...list].slice(0, BUFFER_LIMIT);
  safeSetJSON(BUFFER_KEY, next);
}

function currentPage() {
  try {
    return window.location.pathname + window.location.search;
  } catch {
    return undefined;
  }
}

/**
 * Public API
 */

export function track(name: AnalyticsEventName | string, payload?: AnalyticsEventPayload) {
  if (!isEnabled()) return;

  const sent = sendToProvider(name, payload);

  const evt: StoredEvent = {
    name,
    payload,
    ts: new Date().toISOString(),
    page: currentPage()
  };

  pushToBuffer(evt);

  // Developer-friendly fallback
  if (!sent) {
    // eslint-disable-next-line no-console
    console.info("[Analytics]", name, payload ?? {});
  }
}

export function page(path?: string) {
  if (!isEnabled()) return;

  track("page_view", {
    path: path ?? currentPage(),
    title: safeDocumentTitle()
  });
}

export function identify(user: AnalyticsIdentify) {
  if (!isEnabled()) return;

  const w = window as any;

  // PostHog identify if present
  if (typeof w?.posthog?.identify === "function") {
    try {
      w.posthog.identify(user.id, {
        email: user.email,
        role: user.role,
        organisation: user.organisation,
        country: user.country
      });
    } catch {
      // ignore
    }
  }

  // Umami identify pattern (not standardised, so best-effort)
  if (typeof w?.umami?.identify === "function") {
    try {
      w.umami.identify(user);
    } catch {
      // ignore
    }
  }

  // Also store last identify for demo convenience
  const key = withPrefix(STORAGE_PREFIXES.AUTH, "last_identify_v1");
  safeSetJSON(key, user);
}

export function timing(name: string, ms: number, payload?: AnalyticsEventPayload) {
  if (!isEnabled()) return;

  track(name, {
    ms,
    ...payload
  });
}

export function getBufferedEvents(): StoredEvent[] {
  return safeGetJSON<StoredEvent[]>(BUFFER_KEY, []);
}

export function clearBufferedEvents() {
  safeSetJSON(BUFFER_KEY, []);
}

/**
 * Helpers
 */

function safeDocumentTitle() {
  try {
    return document.title;
  } catch {
    return undefined;
  }
}

/**
 * Default export for convenient import style:
 *   import analytics from "@/services/analytics";
 */
const analytics = {
  track,
  page,
  identify,
  timing,
  getBufferedEvents,
  clearBufferedEvents
};

export default analytics;