// agrotrust-az/src/features/lots/mock.ts

import { env } from "@/app/config/env";
import type {
  Lot,
  LotSummary,
  LotStatus,
  LotUnit,
  ProduceCategory,
  LotQualityGrade
} from "./types";

/**
 * Lots mock helpers
 *
 * Purpose:
 * - Provide stable demo data for hackathon MVP
 * - Load from /public/mock/sample-lots.json when available
 * - Fallback to an inline seed dataset if the file is missing
 *
 * This module is intentionally tolerant of partial/unknown JSON shapes.
 */

const PUBLIC_MOCK_PATH = "/mock/sample-lots.json";

const now = () => new Date().toISOString();

function makeId(prefix: string) {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${n}`;
}

function safeString(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function safeNumber(v: unknown, fallback?: number) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function safeArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normaliseUnit(v: unknown): LotUnit {
  const s = safeString(v).toLowerCase();
  if (s === "ton" || s === "tons" || s === "t") return "ton";
  if (s === "box" || s === "boxes") return "box";
  if (s === "crate" || s === "crates") return "crate";
  return "kg";
}

function normaliseCategory(v: unknown): ProduceCategory {
  const s = safeString(v).toLowerCase();
  if (s.includes("hazel")) return "hazelnut";
  if (s.includes("persim")) return "persimmon";
  if (s.includes("pomeg")) return "pomegranate";
  if (s.includes("grape")) return "grape";
  if (s.includes("apple")) return "apple";
  if (s.includes("tomato")) return "tomato";
  return s ? (s as ProduceCategory) : "other";
}

function normaliseStatus(v: unknown): LotStatus {
  const s = safeString(v).toLowerCase();
  const allowed: LotStatus[] = [
    "draft",
    "listed",
    "reserved",
    "in_negotiation",
    "sold",
    "archived"
  ];
  return (allowed as string[]).includes(s) ? (s as LotStatus) : "listed";
}

function normaliseGrade(v: unknown): LotQualityGrade | undefined {
  const s = safeString(v);
  const allowed: LotQualityGrade[] = ["A", "B", "C", "Premium", "Standard"];
  return allowed.includes(s as LotQualityGrade) ? (s as LotQualityGrade) : undefined;
}

/**
 * Inline fallback dataset
 */
const FALLBACK_LOTS: Lot[] = [
  {
    id: "LOT-1001",
    owner: {
      coopId: "COOP-2001",
      coopName: "Masalli Agro Co-op",
      contactName: "Demo Manager",
      contactEmail: "coop@demo.example"
    },
    product: {
      category: "tomato",
      name: "Fresh Tomato",
      variety: "Pink",
      grade: "A",
      shelfLifeDays: 10,
      harvestDate: now()
    },
    inventory: {
      quantity: 18_000,
      unit: "kg",
      quantityKgApprox: 18_000
    },
    location: {
      region: "Masalli"
    },
    pricing: {
      currency: "USD",
      unitPrice: 0.85,
      minUnitPrice: 0.8,
      maxUnitPrice: 0.95,
      incoterms: "FOB"
    },
    certifications: [
      { code: "GlobalG.A.P", status: "claimed" },
      { code: "Halal", status: "claimed" }
    ],
    media: [],
    passportId: "PP-3001",
    status: "listed",
    createdAt: now()
  },
  {
    id: "LOT-1002",
    owner: {
      coopId: "COOP-2002",
      coopName: "Ganja Hazelnut Union",
      contactName: "Demo Manager",
      contactEmail: "hazel@demo.example"
    },
    product: {
      category: "hazelnut",
      name: "Hazelnut Kernel",
      grade: "Premium",
      shelfLifeDays: 180,
      harvestDate: now()
    },
    inventory: {
      quantity: 12,
      unit: "ton",
      quantityKgApprox: 12_000
    },
    location: {
      region: "Ganja-Gazakh"
    },
    pricing: {
      currency: "USD",
      unitPrice: 6.4,
      minUnitPrice: 6.0,
      maxUnitPrice: 6.9,
      incoterms: "CIF"
    },
    certifications: [{ code: "Organic", status: "claimed" }],
    media: [],
    passportId: "PP-3002",
    status: "listed",
    createdAt: now()
  },
  {
    id: "LOT-1003",
    owner: {
      coopId: "COOP-2003",
      coopName: "Lankaran Persimmon Collective",
      contactName: "Demo Manager",
      contactEmail: "persimmon@demo.example"
    },
    product: {
      category: "persimmon",
      name: "Persimmon",
      variety: "Hachiya",
      grade: "A",
      shelfLifeDays: 20,
      harvestDate: now()
    },
    inventory: {
      quantity: 9_500,
      unit: "kg",
      quantityKgApprox: 9_500
    },
    location: {
      region: "Lankaran"
    },
    pricing: {
      currency: "USD",
      unitPrice: 1.25,
      minUnitPrice: 1.15,
      maxUnitPrice: 1.4,
      incoterms: "FOB"
    },
    certifications: [{ code: "HACCP", status: "claimed" }],
    media: [],
    passportId: "PP-3003",
    status: "listed",
    createdAt: now()
  }
];

/**
 * Convert unknown raw JSON item into a Lot.
 * This lets your sample-lots.json stay simple without breaking the UI.
 */
export function normaliseLot(raw: any): Lot {
  const id = safeString(raw?.id) || makeId("LOT");

  const coopId = safeString(raw?.owner?.coopId) || safeString(raw?.coopId) || makeId("COOP");
  const coopName =
    safeString(raw?.owner?.coopName) ||
    safeString(raw?.coopName) ||
    "Demo Cooperative";

  const productName =
    safeString(raw?.product?.name) ||
    safeString(raw?.productName) ||
    safeString(raw?.product) ||
    "Produce";

  const category = normaliseCategory(raw?.product?.category ?? raw?.category ?? productName);

  const quantity =
    safeNumber(raw?.inventory?.quantity) ??
    safeNumber(raw?.quantity) ??
    1_000;

  const unit = normaliseUnit(raw?.inventory?.unit ?? raw?.unit);

  const currency =
    safeString(raw?.pricing?.currency) ||
    safeString(raw?.currency) ||
    "USD";

  const unitPrice =
    safeNumber(raw?.pricing?.unitPrice) ??
    safeNumber(raw?.unitPrice) ??
    1;

  const createdAt =
    safeString(raw?.createdAt) ||
    safeString(raw?.created_at) ||
    now();

  const status = normaliseStatus(raw?.status);

  return {
    id,
    owner: {
      coopId,
      coopName,
      contactName: safeString(raw?.owner?.contactName ?? raw?.contactName),
      contactEmail: safeString(raw?.owner?.contactEmail ?? raw?.contactEmail),
      contactPhone: safeString(raw?.owner?.contactPhone ?? raw?.contactPhone)
    },
    product: {
      category,
      name: productName,
      variety: safeString(raw?.product?.variety ?? raw?.variety) || undefined,
      grade: normaliseGrade(raw?.product?.grade ?? raw?.grade),
      shelfLifeDays: safeNumber(raw?.product?.shelfLifeDays ?? raw?.shelfLifeDays),
      harvestDate:
        safeString(raw?.product?.harvestDate ?? raw?.harvestDate) || undefined
    },
    inventory: {
      quantity,
      unit,
      quantityKgApprox:
        safeNumber(raw?.inventory?.quantityKgApprox ?? raw?.quantityKgApprox)
    },
    location: raw?.location
      ? {
          region: safeString(raw?.location?.region),
          district: safeString(raw?.location?.district),
          addressLine: safeString(raw?.location?.addressLine),
          lat: safeNumber(raw?.location?.lat),
          lng: safeNumber(raw?.location?.lng)
        }
      : {
          region: safeString(raw?.region) || undefined
        },
    packaging: raw?.packaging,
    pricing: {
      currency: currency as any,
      unitPrice,
      minUnitPrice: safeNumber(raw?.pricing?.minUnitPrice ?? raw?.minUnitPrice),
      maxUnitPrice: safeNumber(raw?.pricing?.maxUnitPrice ?? raw?.maxUnitPrice),
      incoterms: safeString(raw?.pricing?.incoterms ?? raw?.incoterms) || undefined
    },
    certifications: safeArray(raw?.certifications),
    media: safeArray(raw?.media),
    passportId: safeString(raw?.passportId) || undefined,
    status,
    createdAt,
    updatedAt: safeString(raw?.updatedAt) || undefined,
    listedAt: safeString(raw?.listedAt) || undefined
  };
}

/**
 * Loads lots from the public mock JSON.
 * Returns [] on failure.
 */
export async function loadLotsFromPublic(): Promise<Lot[]> {
  try {
    const res = await fetch(PUBLIC_MOCK_PATH, {
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) return [];

    const data = (await res.json()) as unknown;
    const arr = safeArray<any>(data);

    return arr.map(normaliseLot);
  } catch {
    return [];
  }
}

/**
 * Main entry used by UI.
 * - In mock mode, prefer public JSON then fallback inline seed.
 * - Outside mock mode, still returns fallback for safe rendering.
 */
export async function getDemoLots(): Promise<Lot[]> {
  const fromPublic = await loadLotsFromPublic();

  if (fromPublic.length > 0) return fromPublic;

  return FALLBACK_LOTS;
}

/**
 * Build a compact summary view used by tables/cards.
 */
export function toLotSummary(lot: Lot): LotSummary {
  return {
    id: lot.id,
    productName: lot.product.name,
    category: lot.product.category,
    variety: lot.product.variety,
    grade: lot.product.grade,
    coopName: lot.owner.coopName,
    region: lot.location?.region,
    quantity: lot.inventory.quantity,
    unit: lot.inventory.unit,
    currency: lot.pricing?.currency,
    unitPrice: lot.pricing?.unitPrice,
    status: lot.status,
    passportId: lot.passportId,
    createdAt: lot.createdAt
  };
}

export function filterDemoLotsByText(lots: Lot[], text?: string) {
  const q = (text ?? "").trim().toLowerCase();
  if (!q) return lots;

  return lots.filter((l) => {
    const hay = [
      l.id,
      l.owner.coopName,
      l.product.name,
      l.product.variety,
      l.location?.region,
      l.location?.district,
      l.passportId
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });
}

/**
 * Convenience sync getter for components that want
 * a quick safe fallback before async load resolves.
 */
export function getLotsSeedSync(): Lot[] {
  return FALLBACK_LOTS;
}

/**
 * Tiny feature flag helper.
 * Some pages may choose to show demo lots even when mocks are disabled.
 */
export function shouldUseLotsMocks() {
  return Boolean(env.enableMocks);
}