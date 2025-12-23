import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

type RFQStatus = "draft" | "sent" | "answered" | "closed";

function toStatus(v: unknown): RFQStatus {
  const s = String(v ?? "").toLowerCase().trim();
  return s === "draft" || s === "sent" || s === "answered" || s === "closed"
    ? (s as RFQStatus)
    : "draft";
}

function toNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

const jsonHeaders = (extra?: Record<string, string>) => ({
  "Content-Type": "application/json",
  ...(extra ?? {}),
});

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: jsonHeaders(),
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const params = event.queryStringParameters ?? {};
    const role = String(params.role ?? "").toLowerCase();
    const userId = String(params.userId ?? "").trim();
    const status = String(params.status ?? "").toLowerCase();

    let q = supabaseAdmin
      .from("rfqs")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      if (role === "buyer") q = q.eq("buyer_id", userId);
      else if (role === "cooperative") q = q.eq("cooperative_id", userId);
      else if (role === "admin") {
        // no filter = admin sees all
      } else {
        q = q.eq("created_by", userId);
      }
    }

    if (
      status === "draft" ||
      status === "sent" ||
      status === "answered" ||
      status === "closed"
    ) {
      q = q.eq("status", status);
    }

    const { data, error } = await q;

    if (error) {
      console.error("rfq-list supabase error:", error);
      return {
        statusCode: 500,
        headers: jsonHeaders(),
        body: JSON.stringify({ error: "DB_ERROR", message: error.message }),
      };
    }

    const rows = (data ?? []) as any[];

    const out = rows.map((r) => ({
      id: String(r.id ?? ""),
      created_at: r.created_at ?? new Date().toISOString(),
      status: toStatus(r.status),

      buyer_id: r.buyer_id ?? null,
      buyer_name: r.buyer_name ?? null,

      cooperative_id: r.cooperative_id ?? null,
      lot_id: r.lot_id ?? null,

      product: String(r.product ?? r.product_name ?? "").trim(),
      product_name: String(r.product_name ?? r.product ?? "").trim(),

      quantity_kg: toNumber(r.quantity_kg),
      target_price_per_kg:
        r.target_price_per_kg === null ? null : toNumber(r.target_price_per_kg),
      region_preference: r.region_preference ?? null,

      preferred_certifications: Array.isArray(r.preferred_certifications)
        ? r.preferred_certifications
        : [],
      notes: r.notes ?? null,
    }));

    return {
      statusCode: 200,
      headers: jsonHeaders({ "Cache-Control": "no-store" }),
      body: JSON.stringify(out),
    };
  } catch (err) {
    console.error("rfq-list unexpected error:", err);
    return {
      statusCode: 500,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: "Unexpected error listing RFQs" }),
    };
  }
};
