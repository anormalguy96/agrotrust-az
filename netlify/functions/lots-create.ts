import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Body = {
  // cooperativeId removed on purpose (server derives it)
  productName: string;
  variety?: string;
  quantityKg: number;
  region: string;
  harvestDate: string;
  certifications?: string[];
};

function json(statusCode: number, obj: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

function getBearerToken(h?: string | null) {
  if (!h) return null;
  const s = h.trim();
  if (!s.toLowerCase().startsWith("bearer ")) return null;
  return s.slice(7).trim();
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    // 1) Require auth token
    const authHeader = (event.headers.authorization || event.headers.Authorization) as string | undefined;
    const token = getBearerToken(authHeader ?? null);
    if (!token) return json(401, { error: "Missing Authorization: Bearer <token>" });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return json(401, { error: "Invalid or expired session" });

    const userId = userData.user.id; // ✅ UUID

    // 2) Optional: ensure role is coop
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (profErr || !profile) return json(403, { error: "Profile not found" });
    if (profile.role !== "coop") return json(403, { error: "Only cooperatives can create lots" });

    // 3) Validate body
    const body = JSON.parse(event.body || "{}") as Partial<Body>;

    if (!body.productName?.trim()) return json(400, { error: "productName is required" });

    const quantityKg = Number(body.quantityKg);
    if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
      return json(400, { error: "quantityKg must be a positive number" });
    }

    if (!body.region?.trim()) return json(400, { error: "region is required" });
    if (!body.harvestDate?.trim()) return json(400, { error: "harvestDate is required" });

    // 4) Insert
    const id = `lot-${crypto.randomUUID().slice(0, 8)}`;

    const { data, error } = await supabase
      .from("lots")
      .insert({
        id,
        cooperative_id: userId, // ✅ derived from auth user
        product_name: body.productName.trim(),
        variety: body.variety?.trim() || null,
        quantity_kg: quantityKg,
        region: body.region.trim(),
        harvest_date: body.harvestDate,
        certifications: body.certifications ?? [],
      })
      .select("*")
      .single();

    if (error) return json(400, { error: error.message });

    return json(201, { lot: data });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : "Server error" });
  }
};
