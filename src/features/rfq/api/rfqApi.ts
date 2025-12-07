// agrotrust-az/src/features/rfq/api/rfqApi.ts

import { env } from "@/app/config/env";

import type {
  RFQ,
  RFQBuyer,
  RFQCooperative,
  RFQResponse,
  RFQStatus,
  RFQResponseStatus,
  CreateRFQPayload,
  CreateRFQResponse,
  UpdateRFQPayload,
  UpdateRFQResponse,
  CreateRFQResponsePayload,
  CreateRFQResponseResponse,
  UpdateRFQResponsePayload,
  UpdateRFQResponseResponse
} from "../types";

/**
 * RFQ API (Hackathon MVP)
 *
 * Modes:
 * 1) Mock mode (env.enableMocks === true)
 *    - Uses localStorage for RFQs and RFQ responses
 *    - Seeds a small demo set for immediate UI usefulness
 *
 * 2) Non-mock mode
 *    - Read-only fallback to seeded demo set kept in memory
 *    - Mutations throw to avoid misleading behaviour
 *
 * This mirrors patterns used in:
 * - lotsApi.ts
 * - certificationApi.ts
 * - escrowApi.ts
 */

const LS_RFQ_KEY = "agrotrust_rfqs_v1";
const LS_RESP_KEY = "agrotrust_rfq_responses_v1";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${n}`;
}

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore for MVP
  }
}

/**
 * Minimal demo parties
 */

const DEMO_BUYER: RFQBuyer = {
  id: "BUY-1001",
  name: "Demo Procurement Lead",
  organisation: "Gulf Fresh Imports",
  country: "UAE",
  city: "Dubai",
  email: "buyer@demo.example",
  verified: true,
  tags: ["supermarket", "fresh-produce"]
};

const DEMO_COOP: RFQCooperative = {
  id: "COOP-2001",
  name: "Masalli Agro Co-op",
  region: "Masalli",
  contactName: "Demo Manager",
  contactEmail: "coop@demo.example",
  verified: true
};

/**
 * Seed RFQs for immediate UI demos
 */

const SEED_RFQS: RFQ[] = [
  {
    id: "RFQ-3001",
    title: "GlobalG.A.P tomatoes for Q1 supply",
    description:
      "Seeking traceable, export-ready fresh tomatoes with GlobalG.A.P documentation. Preference for stable weekly volumes.",
    buyer: DEMO_BUYER,
    products: [
      {
        category: "tomato",
        name: "Fresh Tomato",
        variety: "Pink",
        quantity: 20_000,
        unit: "kg",
        quantityKgApprox: 20_000,
        quality: {
          grade: "A",
          maxDefectRatePct: 3,
          packagingNotes: "Cartons suitable for chilled transport"
        },
        certifications: [
          { code: "GlobalG.A.P", required: true },
          { code: "Halal", required: false }
        ]
      }
    ],
    terms: {
      currency: "USD",
      targetUnitPrice: 0.9,
      minUnitPrice: 0.8,
      maxUnitPrice: 1.05,
      incoterms: "FOB",
      deliveryMode: "third_party_logistics",
      destinationCountry: "UAE",
      destinationCity: "Dubai",
      paymentPreference: "escrow",
      preferredShipWindowStart: nowIso(),
      preferredShipWindowEnd: nowIso()
    },
    priority: "high",
    status: "open",
    openUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: nowIso()
  },
  {
    id: "RFQ-3002",
    title: "Organic hazelnut kernels - annual contract",
    description:
      "Long-term supply interest for organically certified hazelnut kernels. Please provide lab reports and origin details.",
    buyer: {
      ...DEMO_BUYER,
      id: "BUY-1002",
      organisation: "EU Nut Trading Group",
      country: "Germany",
      city: "Hamburg",
      email: "eu-buyer@demo.example",
      tags: ["nuts", "wholesale"]
    },
    products: [
      {
        category: "hazelnut",
        name: "Hazelnut Kernel",
        quantity: 30,
        unit: "ton",
        quantityKgApprox: 30_000,
        quality: {
          grade: "Premium",
          packagingNotes: "Vacuum bags in export cartons"
        },
        certifications: [{ code: "Organic", required: true }]
      }
    ],
    terms: {
      currency: "EUR",
      targetUnitPrice: 6.2,
      minUnitPrice: 5.9,
      maxUnitPrice: 6.8,
      incoterms: "CIF",
      deliveryMode: "seller_delivery",
      destinationCountry: "Germany",
      destinationCity: "Hamburg",
      paymentPreference: "escrow"
    },
    priority: "medium",
    status: "open",
    openUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: nowIso()
  }
];

const SEED_RESPONSES: RFQResponse[] = [
  {
    id: "RSP-4001",
    rfqId: "RFQ-3001",
    cooperative: DEMO_COOP,
    message:
      "We can supply weekly volumes with passport-linked lots. GlobalG.A.P claim available; documents can be shared upon request.",
    proposedLotId: "LOT-1001",
    proposedPassportId: "PP-3001",
    proposedUnitPrice: 0.88,
    proposedCurrency: "USD",
    proposedQuantity: 18_000,
    proposedUnit: "kg",
    status: "submitted",
    createdAt: nowIso()
  }
];

async function ensureRfqsSeeded(): Promise<RFQ[]> {
  const existing = load<RFQ>(LS_RFQ_KEY);
  if (existing.length > 0) return existing;
  save<RFQ>(LS_RFQ_KEY, SEED_RFQS);
  return SEED_RFQS;
}

async function ensureResponsesSeeded(): Promise<RFQResponse[]> {
  const existing = load<RFQResponse>(LS_RESP_KEY);
  if (existing.length > 0) return existing;
  save<RFQResponse>(LS_RESP_KEY, SEED_RESPONSES);
  return SEED_RESPONSES;
}

/**
 * Public read API
 */

export async function listRFQs(): Promise<RFQ[]> {
  if (env.enableMocks) {
    return ensureRfqsSeeded();
  }
  // safe read-only fallback
  return SEED_RFQS;
}

export async function getRFQById(rfqId: string): Promise<RFQ | null> {
  const list = await listRFQs();
  return list.find((r) => r.id === rfqId) ?? null;
}

export async function listRFQResponses(rfqId?: string): Promise<RFQResponse[]> {
  const all = env.enableMocks
    ? await ensureResponsesSeeded()
    : SEED_RESPONSES;

  if (!rfqId) return all;
  return all.filter((r) => r.rfqId === rfqId);
}

export async function getRFQResponseById(responseId: string): Promise<RFQResponse | null> {
  const list = await listRFQResponses();
  return list.find((r) => r.id === responseId) ?? null;
}

/**
 * Mutations - RFQ
 */

export async function createRFQ(
  payload: CreateRFQPayload
): Promise<CreateRFQResponse> {
  if (!env.enableMocks) {
    throw new Error("RFQ creation is only available in mock mode for this MVP.");
  }

  const createdAt = nowIso();

  const status: RFQStatus = payload.status ?? "draft";

  const rfq: RFQ = {
    id: makeId("RFQ"),
    title: payload.title,
    description: payload.description,
    buyer: payload.buyer,
    products: payload.products,
    terms: payload.terms,
    priority: payload.priority,
    status,
    openUntil: payload.openUntil,
    createdAt,
    updatedAt: createdAt
  };

  const list = await ensureRfqsSeeded();
  save<RFQ>(LS_RFQ_KEY, [rfq, ...list]);

  return { rfq };
}

export async function updateRFQ(
  payload: UpdateRFQPayload
): Promise<UpdateRFQResponse> {
  if (!env.enableMocks) {
    throw new Error("RFQ updates are only available in mock mode for this MVP.");
  }

  const list = await ensureRfqsSeeded();
  const idx = list.findIndex((r) => r.id === payload.id);

  if (idx === -1) {
    throw new Error("RFQ not found in demo store.");
  }

  const current = list[idx];
  const updatedAt = nowIso();

  const next: RFQ = {
    ...current,
    ...payload,
    buyer: payload.buyer ?? current.buyer,
    products: payload.products ?? current.products,
    terms: payload.terms ?? current.terms,
    status: payload.status ?? current.status,
    openUntil: payload.openUntil ?? current.openUntil,
    priority: payload.priority ?? current.priority,
    updatedAt
  };

  const updated = [...list];
  updated[idx] = next;
  save<RFQ>(LS_RFQ_KEY, updated);

  return { rfq: next };
}

/**
 * Mutations - RFQ Responses (offers)
 */

export async function createRFQResponse(
  payload: CreateRFQResponsePayload
): Promise<CreateRFQResponseResponse> {
  if (!env.enableMocks) {
    throw new Error("RFQ responses are only available in mock mode for this MVP.");
  }

  const createdAt = nowIso();

  const response: RFQResponse = {
    id: makeId("RSP"),
    rfqId: payload.rfqId,
    cooperative: payload.cooperative,
    message: payload.message,
    proposedLotId: payload.proposedLotId,
    proposedPassportId: payload.proposedPassportId,
    proposedUnitPrice: payload.proposedUnitPrice,
    proposedCurrency: payload.proposedCurrency,
    proposedQuantity: payload.proposedQuantity,
    proposedUnit: payload.proposedUnit,
    status: "submitted",
    createdAt,
    updatedAt: createdAt
  };

  const list = await ensureResponsesSeeded();
  save<RFQResponse>(LS_RESP_KEY, [response, ...list]);

  return { response };
}

export async function updateRFQResponse(
  payload: UpdateRFQResponsePayload
): Promise<UpdateRFQResponseResponse> {
  if (!env.enableMocks) {
    throw new Error("RFQ response updates are only available in mock mode for this MVP.");
  }

  const list = await ensureResponsesSeeded();
  const idx = list.findIndex((r) => r.id === payload.id);

  if (idx === -1) {
    throw new Error("RFQ response not found in demo store.");
  }

  const current = list[idx];
  const updatedAt = nowIso();

  const status: RFQResponseStatus = payload.status ?? current.status;

  const next: RFQResponse = {
    ...current,
    ...payload,
    rfqId: payload.rfqId ?? current.rfqId,
    cooperative: payload.cooperative ?? current.cooperative,
    status,
    updatedAt
  };

  const updated = [...list];
  updated[idx] = next;
  save<RFQResponse>(LS_RESP_KEY, updated);

  return { response: next };
}

/**
 * Local-only helpers
 */

export function listMockRFQsSync(): RFQ[] {
  return load<RFQ>(LS_RFQ_KEY);
}

export function listMockRFQResponsesSync(): RFQResponse[] {
  return load<RFQResponse>(LS_RESP_KEY);
}

export function clearMockRFQs() {
  try {
    localStorage.removeItem(LS_RFQ_KEY);
  } catch {
    // ignore
  }
}

export function clearMockRFQResponses() {
  try {
    localStorage.removeItem(LS_RESP_KEY);
  } catch {
    // ignore
  }
}