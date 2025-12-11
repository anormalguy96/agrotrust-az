// netlify/functions/rfqs-create.ts
import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

type RFQStatus = "draft" | "sent" | "answered" | "closed";

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
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" })
      };
    }

    const payload = JSON.parse(event.body) as {
      createdBy?: string;
      buyerId?: string;
      buyerName?: string;
      product?: string;
      quantityKg?: number;
      targetPricePerKg?: number;
      regionPreference?: string;
      lotId?: string;
      preferredCertifications?: string[];
      notes?: string;
    };

    const {
      createdBy,
      buyerId,
      buyerName,
      product,
      quantityKg,
      targetPricePerKg,
      regionPreference,
      lotId,
      preferredCertifications,
      notes
    } = payload;

    if (!product || !quantityKg || quantityKg <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid RFQ payload: product and positive quantityKg are required."
        })
      };
    }

    const { data, error } = await supabaseAdmin
      .from("rfqs")
      .insert([
        {
          created_by: createdBy ?? null,
          status: "draft",
          buyer_id: buyerId ?? null,
          buyer_name: buyerName ?? null,
          product,
          quantity_kg: quantityKg,
          target_price_per_kg: targetPricePerKg ?? null,
          region_preference: regionPreference ?? null,
          lot_id: lotId ?? null,
          preferred_certifications: preferredCertifications ?? [],
          notes: notes ?? null
        }
      ])
      .select("*")
      .single();

    if (error) {
      console.error("rfqs-create: supabase error", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to create RFQ",
          details: error.message
        })
      };
    }

    const row = data as any;

    const rfq: RFQ = {
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
    };

    return {
      statusCode: 201,
      body: JSON.stringify({ rfq })
    };
  } catch (err) {
    console.error("rfqs-create: unexpected error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error creating RFQ" })
    };
  }
};
