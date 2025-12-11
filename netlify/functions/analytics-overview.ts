// netlify/functions/analytics-overview.ts
import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

export const handler: Handler = async (event) => {
  const userId = event.queryStringParameters?.userId;
  const role = event.queryStringParameters?.role; // 'cooperative' | 'buyer'

  if (!userId || !role) {
    return { statusCode: 400, body: "Missing userId or role" };
  }

  try {
    if (role === "cooperative") {
      const { data: lots, error: lotsError } = await supabaseAdmin
        .from("lots")
        .select("quantity_kg, passport_id")
        .eq("cooperative_id", userId);

      if (lotsError) throw lotsError;

      const totalLots = lots.length;
      const totalKg = lots.reduce(
        (sum, l) => sum + (Number(l.quantity_kg) || 0),
        0
      );
      const withPassport = lots.filter((l) => !!l.passport_id).length;

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          totalLots,
          totalKg,
          withPassport,
        }),
      };
    }

    if (role === "buyer") {
      const { data: rfqs, error: rfqError } = await supabaseAdmin
        .from("rfqs")
        .select("status")
        .eq("buyer_id", userId);

      if (rfqError) throw rfqError;

      const byStatus: Record<string, number> = {};
      for (const r of rfqs) {
        byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, rfqByStatus: byStatus }),
      };
    }

    return { statusCode: 400, body: "Unknown role" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Failed to load analytics" };
  }
};