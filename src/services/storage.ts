// agrotrust-az/src/services/storage.ts

/**
 * Storage utilities for AgroTrust AZ (MVP)
 *
 * Goals:
 * - Safe wrappers around localStorage/sessionStorage
 * - Typed JSON helpers
 * - Small in-memory fallback if storage is blocked
 *
 * This keeps feature APIs (lots/passport/certification/rfq)
 * simple and consistent.
 * 
**/

export type StorageArea = "local" | "session" | "memory";

type MemoryStore = Record<string, string>;

const memory: MemoryStore = {};

function getArea(area: StorageArea): Storage | null {
  if (area === "memory") return null;
  try {
    return area === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function memGet(key: string) {
  return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
}

function memSet(key: string, value: string) {
  memory[key] = value;
}

function memRemove(key: string) {
  delete memory[key];
}

function memClear(prefix?: string) {
  if (!prefix) {
    Object.keys(memory).forEach((k) => delete memory[k]);
    return;
  }
  Object.keys(memory).forEach((k) => {
    if (k.startsWith(prefix)) delete memory[k];
  });
}

// Low-level string operations

export function getItem(key: string, area: StorageArea = "local"): string | null {
  const store = getArea(area);
  if (!store) return memGet(key);

  try {
    return store.getItem(key);
  } catch {
    return memGet(key);
  }
}

export function setItem(key: string, value: string, area: StorageArea = "local"): void {
  const store = getArea(area);
  if (!store) {
    memSet(key, value);
    return;
  }

  try {
    store.setItem(key, value);
  } catch {
    memSet(key, value);
  }
}

export function removeItem(key: string, area: StorageArea = "local"): void {
  const store = getArea(area);
  if (!store) {
    memRemove(key);
    return;
  }

  try {
    store.removeItem(key);
  } catch {
    memRemove(key);
  }
}

export function clear(area: StorageArea = "local", prefix?: string): void {
  const store = getArea(area);

  if (!store) {
    memClear(prefix);
    return;
  }

  try {
    if (!prefix) {
      store.clear();
      memClear();
      return;
    }

    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k) keys.push(k);
    }

    keys.forEach((k) => {
      if (k.startsWith(prefix)) store.removeItem(k);
    });

    memClear(prefix);
  } catch {
    memClear(prefix);
  }
}

//JSON helpers

export function getJSON<T>(
  key: string,
  fallback: T,
  area: StorageArea = "local"
): T {
  const raw = getItem(key, area);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function setJSON<T>(
  key: string,
  value: T,
  area: StorageArea = "local"
): void {
  try {
    setItem(key, JSON.stringify(value), area);
  } catch {
    // Even JSON.stringify can fail for circular references.
    // We keep silent for MVP.
  }
}

// Convenience: auto area resolution
// Useful when you want to prefer local and fall back to memory.

export function safeGetJSON<T>(key: string, fallback: T): T {
  return getJSON<T>(key, fallback, "local");
}

export function safeSetJSON<T>(key: string, value: T): void {
  setJSON<T>(key, value, "local");
}

export function withPrefix(prefix: string, key: string) {
  const p = prefix.endsWith(":") ? prefix : `${prefix}:`;
  return `${p}${key}`;
}


export const STORAGE_PREFIXES = {
  AUTH: "agrotrust:auth",
  PASSPORT: "agrotrust:passport",
  LOTS: "agrotrust:lots",
  CERT: "agrotrust:cert",
  RFQ: "agrotrust:rfq",
  ESCROW: "agrotrust:escrow",
  UI: "agrotrust:ui"
} as const;


export function getBool(
  key: string,
  fallback = false,
  area: StorageArea = "local"
): boolean {
  const raw = getItem(key, area);
  if (raw === null) return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
}

export function setBool(
  key: string,
  value: boolean,
  area: StorageArea = "local"
) {
  setItem(key, value ? "true" : "false", area);
}

export function getNumber(
  key: string,
  fallback: number,
  area: StorageArea = "local"
): number {
  const raw = getItem(key, area);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function setNumber(
  key: string,
  value: number,
  area: StorageArea = "local"
) {
  if (!Number.isFinite(value)) return;
  setItem(key, String(value), area);
}