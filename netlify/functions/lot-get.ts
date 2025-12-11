import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

export const handler: Handler = async (event) => {
  const id = event.queryStringParameters?.id;
  if (!id) {
    return { statusCode: 400, body: "Missing id query parameter" };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("lots")
      .select(
        "id, cooperative_id, product_name, variety, quantity_kg, region, harvest_date, certifications, passport_id, created_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    if (!data) return { statusCode: 404, body: "Lot not found" };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lot: data }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Failed to load lot" };
  }
};