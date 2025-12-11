// netlify/functions/rfqs-list.ts
import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

type RFQStatus = "draft" | "sent" | "answered" | "closed";

type DbRfq = {
  id: string;
  created_at: string;
  status: RFQStatus;
  created_by: string | null;
  buyer_id: string | null;
  buyer_name: string | null;
  product: string;
  quantity_kg: number;
  target_price_per_kg: number | null;
  region_preference: string | null;
  lot_id: string | null;
  preferred_certifications: string[] | null;
  notes: string | null;
};

type RFQ = {
  id: string;
  createdAt: string;
  status: RFQStatus;
  buyerId?: string;
  buyerName?: string;
  product: string;
  quantityKg: number;
  targetPricePerKg?: number;
  regionPreference?: string;
  lotId?: string;
  preferredCertifications?: string[];
  notes?: string;
};

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    const params = event.queryStringParameters ?? {};
    const role = params.role ?? null;      // "buyer" | "cooperative" | "admin"
    const userId = params.userId ?? null;  // current profile id

    let query = supabaseAdmin
      .from("rfqs")
      .select("*")
      .order("created_at", { ascending: false });

    // Simple role-based filtering
    if (role === "buyer" && userId) {
      query = query.eq("buyer_id", userId);
    } else if (role === "cooperative" && userId) {
      // for now, show RFQs created by this cooperative
      query = query.eq("created_by", userId);
    } else if (role === "admin") {
      // admin sees everything – no extra filter
    } else if (userId) {
      // fallback: show RFQs created by this user
      query = query.eq("created_by", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("rfqs-list: supabase error", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to list RFQs",
          details: error.message
        })
      };
    }

    const items: RFQ[] = (data as DbRfq[]).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      status: row.status,
      buyerId: row.buyer_id ?? undefined,
      buyerName: row.buyer_name ?? undefined,
      product: row.product,
      quantityKg: Number(row.quantity_kg),
      targetPricePerKg:
        row.target_price_per_kg !== null ? Number(row.target_price_per_kg) : undefined,
      regionPreference: row.region_preference ?? undefined,
      lotId: row.lot_id ?? undefined,
      preferredCertifications: row.preferred_certifications ?? undefined,
      notes: row.notes ?? undefined
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ items })
    };
  } catch (err) {
    console.error("rfqs-list: unexpected error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error listing RFQs" })
    };
  }
};