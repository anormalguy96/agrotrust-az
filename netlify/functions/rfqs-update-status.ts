// netlify/functions/rfqs-update-status.ts
import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

type RFQStatus = "draft" | "sent" | "answered" | "closed";

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
      id?: string;
      status?: RFQStatus;
    };

    const { id, status } = payload;

    if (!id || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing id or status" })
      };
    }

    if (!["draft", "sent", "answered", "closed"].includes(status)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid RFQ status" })
      };
    }

    const { data, error } = await supabaseAdmin
      .from("rfqs")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("rfqs-update-status: supabase error", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to update RFQ status",
          details: error.message
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ rfq: data })
    };
  } catch (err) {
    console.error("rfqs-update-status: unexpected error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error updating RFQ status" })
    };
  }
};