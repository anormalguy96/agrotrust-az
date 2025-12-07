// agrotrust-az/src/features/escrow/api/escrowApi.ts

import { env } from "@/app/config/env";
import type {
  EscrowContract,
  EscrowMilestone,
  EscrowParty,
  EscrowStatus,
  InitEscrowPayload,
  InitEscrowResponse,
  ReleaseEscrowPayload,
  ReleaseEscrowResponse
} from "../types";

/**
 * Escrow API
 *
 * Supports two modes:
 * 1) Mock mode (env.enableMocks === true)
 *    - Uses localStorage
 *    - Perfect for hackathon demo without payments/border integrations
 *
 * 2) Function mode
 *    - Calls Netlify Functions:
 *      /.netlify/functions/escrow-init
 *      /.netlify/functions/escrow-release
 */

const FN_BASE = "/.netlify/functions";
const INIT_ENDPOINT = `${FN_BASE}/escrow-init`;
const RELEASE_ENDPOINT = `${FN_BASE}/escrow-release`;

const LS_KEY = "agrotrust_escrow_contracts_v1";

function loadMockContracts(): EscrowContract[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as EscrowContract[];
  } catch {
    return [];
  }
}

function saveMockContracts(items: EscrowContract[]) {
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

function defaultBuyer(): EscrowParty {
  return {
    role: "buyer",
    name: "Demo Buyer",
    organisation: "Gulf Fresh Imports",
    country: "UAE",
    email: "buyer@demo.example"
  };
}

function defaultSeller(): EscrowParty {
  return {
    role: "seller",
    name: "Demo Cooperative",
    organisation: "Masalli Agro Co-op",
    country: "Azerbaijan",
    email: "coop@demo.example"
  };
}

function buildMilestone(
  type: EscrowMilestone["type"],
  title: string,
  description?: string,
  actor?: EscrowMilestone["actor"]
): EscrowMilestone {
  return {
    id: makeId("M"),
    type,
    title,
    description,
    actor,
    date: nowIso()
  };
}

function calcFee(amount: number) {
  // Simple demo fee: 1.5%
  const fee = Math.round(amount * 0.015 * 100) / 100;
  return fee;
}

function withMilestones(
  contract: EscrowContract,
  additions: EscrowMilestone[]
): EscrowContract {
  const existing = contract.milestones ?? [];
  return {
    ...contract,
    milestones: [...existing, ...additions],
    updatedAt: nowIso()
  };
}

async function mockInitEscrow(
  payload: InitEscrowPayload
): Promise<InitEscrowResponse> {
  const createdAt = nowIso();
  const id = makeId("ESC");

  const currency = payload.currency ?? "USD";
  const feeAmount = calcFee(payload.amount);
  const netAmount = Math.max(payload.amount - feeAmount, 0);

  const buyer = payload.buyer ?? defaultBuyer();
  const seller = payload.seller ?? defaultSeller();

  const requireInspection = payload.requireInspection !== false;

  const status: EscrowStatus = "awaiting_deposit";

  const contract: EscrowContract = {
    id,
    lotId: payload.lotId,
    passportId: payload.passportId,
    rfqId: payload.rfqId,

    buyer,
    seller,

    productName: payload.productName,
    quantityKg: payload.quantityKg,
    incoterms: payload.incoterms,
    destinationCountry: payload.destinationCountry,

    amounts: {
      amount: payload.amount,
      currency,
      feeAmount,
      netAmount
    },

    status,

    inspection: requireInspection
      ? {
          required: true,
          providerName: "Demo Border Inspection",
          location: "AZ Border Checkpoint",
          result: "pending"
        }
      : { required: false, result: "pending" },

    milestones: [
      buildMilestone(
        "contract_created",
        "Contract created",
        "Escrow contract has been created for this export deal.",
        { role: "buyer", name: buyer.name, organisation: buyer.organisation }
      ),
      buildMilestone(
        "deposit_requested",
        "Deposit requested",
        "Buyer is requested to fund the escrow balance.",
        { role: "buyer", name: buyer.name, organisation: buyer.organisation }
      )
    ],

    createdAt,
    updatedAt: createdAt
  };

  const existing = loadMockContracts();
  saveMockContracts([contract, ...existing]);

  return {
    contract,
    depositReference: `DEMO-DEP-${id}`,
    depositUrl: `/dashboard/contracts?depositFor=${encodeURIComponent(id)}`
  };
}

async function mockReleaseEscrow(
  payload: ReleaseEscrowPayload
): Promise<ReleaseEscrowResponse> {
  const list = loadMockContracts();
  const idx = list.findIndex((c) => c.id === payload.contractId);

  if (idx === -1) {
    throw new Error("Escrow contract not found in demo store.");
  }

  let contract = list[idx];

  // Demo-friendly state progression:
  // If the contract is still awaiting deposit, we assume funding occurred.
  if (contract.status === "awaiting_deposit") {
    contract = withMilestones(contract, [
      buildMilestone(
        "deposit_received",
        "Deposit received",
        "Buyer funded the escrow for the demo.",
        {
          role: "buyer",
          name: contract.buyer?.name ?? "Buyer",
          organisation: contract.buyer?.organisation
        }
      )
    ]);
    contract.status = "funded";
  }

  const requireInspection = contract.inspection?.required !== false;

  // Simulate inspection outcome if needed
  if (requireInspection) {
    const result = payload.inspectionResult ?? "passed";

    if (result === "passed") {
      contract.inspection = {
        ...contract.inspection,
        completedAt: nowIso(),
        result: "passed",
        notes: payload.reason ?? "Inspection passed for the demo."
      };

      contract = withMilestones(contract, [
        buildMilestone(
          "inspection_passed",
          "Inspection passed",
          "Cargo passed the border quality inspection.",
          { role: "inspector", name: "Demo Inspector" }
        )
      ]);

      contract.status = "inspection_passed";
    } else {
      contract.inspection = {
        ...contract.inspection,
        completedAt: nowIso(),
        result: "failed",
        notes: payload.reason ?? "Inspection failed for the demo."
      };

      contract = withMilestones(contract, [
        buildMilestone(
          "inspection_failed",
          "Inspection failed",
          "Cargo did not meet the required standards.",
          { role: "inspector", name: "Demo Inspector" }
        )
      ]);

      contract.status = "inspection_failed";
    }
  }

  // Release or refund logic (MVP)
  if (contract.status === "inspection_failed") {
    contract = withMilestones(contract, [
      buildMilestone(
        "refunded",
        "Refunded",
        "Escrow funds refunded to buyer due to failed inspection.",
        { role: "admin", name: "Demo Admin" }
      )
    ]);
    contract.status = "refunded";
  } else {
    contract = withMilestones(contract, [
      buildMilestone(
        "release_requested",
        "Release requested",
        payload.reason ?? "Release requested after successful inspection.",
        { role: "buyer", name: contract.buyer?.name ?? "Buyer" }
      ),
      buildMilestone(
        "released",
        "Funds released",
        "Escrow funds released to the cooperative.",
        { role: "admin", name: "Demo Admin" }
      )
    ]);
    contract.status = "released";
  }

  contract.updatedAt = nowIso();

  list[idx] = contract;
  saveMockContracts(list);

  return {
    contract,
    releasedAt: nowIso()
  };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Request failed.");
  }

  return (await res.json()) as T;
}

/**
 * Public API
 */

export async function initEscrow(
  payload: InitEscrowPayload
): Promise<InitEscrowResponse> {
  if (env.enableMocks) {
    return mockInitEscrow(payload);
  }

  return postJson<InitEscrowResponse>(INIT_ENDPOINT, payload);
}

export async function releaseEscrow(
  payload: ReleaseEscrowPayload
): Promise<ReleaseEscrowResponse> {
  if (env.enableMocks) {
    return mockReleaseEscrow(payload);
  }

  return postJson<ReleaseEscrowResponse>(RELEASE_ENDPOINT, payload);
}

/**
 * Local-only helpers for dashboard pages in demo mode
 */

export function listMockEscrowContracts(): EscrowContract[] {
  return loadMockContracts();
}

export function getMockEscrowById(contractId: string): EscrowContract | null {
  const list = loadMockContracts();
  return list.find((c) => c.id === contractId) ?? null;
}

export function clearMockEscrowContracts() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}