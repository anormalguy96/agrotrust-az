import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

type RFQStatus = "draft" | "sent" | "answered" | "closed";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: unknown): v is string {
  return typeof v === "string" && uuidRe.test(v.trim());
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    const payload = JSON.parse(event.body) as {
      id?: string;
      status?: RFQStatus;
    };

    const id = payload.id?.trim();
    const status = payload.status;

    if (!id || !status) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing id or status" }),
      };
    }

    if (!isUuid(id)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid RFQ id (must be UUID)" }),
      };
    }

    if (!["draft", "sent", "answered", "closed"].includes(status)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid RFQ status" }),
      };
    }

    const { data, error } = await supabaseAdmin
      .from("rfqs")
      .update({ status })
      .eq("id", id)
      .select(
        "id,created_at,status,buyer_id,buyer_name,cooperative_id,lot_id,product,product_name,quantity_kg,target_price_per_kg,region_preference,preferred_certifications,notes,created_by"
      )
      .single();

    if (error) {
      console.error("rfq-update-status supabase error:", error);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "DB_ERROR", message: error.message }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("rfq-update-status unexpected error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unexpected error updating RFQ status" }),
    };
  }
};
