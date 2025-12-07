// agrotrust-az/src/features/lots/api/lotsApi.ts

import { env } from "@/app/config/env";

import type {
  Lot,
  CreateLotPayload,
  CreateLotResponse,
  UpdateLotPayload,
  UpdateLotResponse
} from "../types";

import {
  getDemoLots,
  normaliseLot
} from "../mock";

/**
 * Lots API (Hackathon MVP)
 *
 * Modes:
 * 1) Mock mode (env.enableMocks === true)
 *    - Uses localStorage as a lightweight store
 *    - Seeds from /public/mock/sample-lots.json (via getDemoLots)
 *
 * 2) Non-mock mode
 *    - Read-only fallback to getDemoLots()
 *    - Create/update throw to avoid misleading behaviour
 */

const LS_KEY = "agrotrust_lots_v1";

function loadMockLots(): Lot[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as Lot[];
  } catch {
    return [];
  }
}

function saveMockLots(items: Lot[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // ignore for MVP
  }
}

function makeId(prefix: string) {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${n}`;
}

function nowIso() {
  return new Date().toISOString();
}

async function ensureSeeded() {
  const existing = loadMockLots();
  if (existing.length > 0) return existing;

  const seed = await getDemoLots();
  saveMockLots(seed);
  return seed;
}

/**
 * Public API
 */

export async function listLots(): Promise<Lot[]> {
  if (env.enableMocks) {
    return ensureSeeded();
  }

  // Read-only fallback for safety
  return getDemoLots();
}

export async function getLotById(lotId: string): Promise<Lot | null> {
  const lots = await listLots();
  return lots.find((l) => l.id === lotId) ?? null;
}

export async function createLot(
  payload: CreateLotPayload
): Promise<CreateLotResponse> {
  if (!env.enableMocks) {
    throw new Error("Lot creation is only available in mock mode for this MVP.");
  }

  const list = await ensureSeeded();
  const createdAt = nowIso();

  const lot: Lot = {
    id: makeId("LOT"),
    owner: payload.owner,
    product: payload.product,
    inventory: payload.inventory,

    location: payload.location,
    packaging: payload.packaging,
    pricing: payload.pricing,

    certifications: payload.certifications ?? [],
    media: payload.media ?? [],

    passportId: payload.passportId,

    status: payload.status ?? "draft",

    createdAt,
    updatedAt: createdAt,
    listedAt: payload.status === "listed" ? createdAt : undefined
  };

  const next = [lot, ...list];
  saveMockLots(next);

  return { lot };
}

export async function updateLot(
  payload: UpdateLotPayload
): Promise<UpdateLotResponse> {
  if (!env.enableMocks) {
    throw new Error("Lot updates are only available in mock mode for this MVP.");
  }

  const list = await ensureSeeded();
  const idx = list.findIndex((l) => l.id === payload.id);

  if (idx === -1) {
    throw new Error("Lot not found in demo store.");
  }

  const current = list[idx];
  const updatedAt = nowIso();

  const merged: Lot = normaliseLot({
    ...current,
    ...payload,
    owner: payload.owner ?? current.owner,
    product: payload.product ?? current.product,
    inventory: payload.inventory ?? current.inventory,
    updatedAt,
    listedAt:
      payload.status === "listed" && !current.listedAt
        ? updatedAt
        : current.listedAt
  });

  const next = [...list];
  next[idx] = merged;

  saveMockLots(next);

  return { lot: merged };
}

/**
 * Local-only helpers
 */

export function listMockLotsSync(): Lot[] {
  return loadMockLots();
}

export function clearMockLots() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}