import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

export const handler: Handler = async (event) => {
  try {
    
    const { data, error } = await supabaseAdmin
      .from("lots")
      .select(
        "id, cooperative_id, product_name, variety, quantity_kg, region, harvest_date, certifications, passport_id, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lots: data }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: "Failed to load lots",
    };
  }
};
