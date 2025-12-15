import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

type RFQStatus = "draft" | "sent" | "answered" | "closed";

type DbRfq = {
  id: string;
  created_at: string | null;
  status: RFQStatus | string;

  buyer_id: string | null;
  cooperative_id: string | null;
  lot_id: string | null;

  product_name: string;
  quantity_kg: number | string;
  target_price_per_kg: number | string | null;
  region_preference: string | null;

  preferred_certifications: string[] | null;
  notes: string | null;

  created_by: string | null;
};

type RfqListRow = {
  id: string;
  created_at: string;
  status: RFQStatus;

  buyer_id: string | null;
  cooperative_id: string | null;
  lot_id: string | null;

  product_name: string;
  quantity_kg: number;
  target_price_per_kg: number | null;
  region_preference: string | null;

  preferred_certifications: string[] | null;
  notes: string | null;
};

function toStatus(v: unknown): RFQStatus {
  const s = String(v || "").toLowerCase().trim();
  if (s === "draft" || s === "sent" || s === "answered" || s === "closed") return s;
  return "draft";
}

function toNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    const params = event.queryStringParameters ?? {};
    const role = (params.role ?? "").toLowerCase();
    const userId = (params.userId ?? "").trim();
    const status = (params.status ?? "").toLowerCase();

    let q = supabaseAdmin
      .from("rfqs")
      .select(
        "id,created_at,status,buyer_id,cooperative_id,lot_id,product_name,quantity_kg,target_price_per_kg,region_preference,preferred_certifications,notes,created_by"
      )
      .order("created_at", { ascending: false });

    if (userId) {
      if (role === "buyer") q = q.eq("buyer_id", userId);
      else if (role === "cooperative") q = q.eq("cooperative_id", userId);
      else if (role === "admin") {
      } else {
        q = q.eq("created_by", userId);
      }
    }

    if (status === "draft" || status === "sent" || status === "answered" || status === "closed") {
      q = q.eq("status", status);
    }

    const { data, error } = await q;

    if (error) {
      console.error("rfqs-list supabase error:", error);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "DB_ERROR", message: error.message })
      };
    }

    const rows = (data ?? []) as DbRfq[];

    const out: RfqListRow[] = rows.map((r) => ({
      id: r.id,
      created_at: r.created_at ?? new Date().toISOString(),
      status: toStatus(r.status),

      buyer_id: r.buyer_id,
      cooperative_id: r.cooperative_id,
      lot_id: r.lot_id,

      product_name: r.product_name,
      quantity_kg: toNumber(r.quantity_kg),
      target_price_per_kg: r.target_price_per_kg === null ? null : toNumber(r.target_price_per_kg),
      region_preference: r.region_preference,

      preferred_certifications: r.preferred_certifications ?? [],
      notes: r.notes
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(out)
    };
  } catch (err) {
    console.error("rfqs-list unexpected error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unexpected error listing RFQs" })
    };
  }
};
