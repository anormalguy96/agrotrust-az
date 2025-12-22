import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

type ReqBody = {
  passportId: string;
  question: string;
  mode?: "buyer" | "seller";
  language?: "en" | "az" | "ru";
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function handler(event: any) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body: ReqBody = JSON.parse(event.body ?? "{}");
    const passportId = (body.passportId ?? "").trim();
    const question = (body.question ?? "").trim();
    const mode = body.mode ?? "buyer";
    const language = body.language ?? "en";

    if (!passportId) return { statusCode: 400, body: "passportId is required" };
    if (!question) return { statusCode: 400, body: "question is required" };

    // Pull passport core + agrochemicals + lab reports/results
    const { data: passport, error: pErr } = await supabase
      .from("product_passports")
      .select("*")
      .eq("id", passportId)
      .single();

    if (pErr) throw pErr;

    const { data: agros, error: aErr } = await supabase
      .from("passport_agrochemicals")
      .select("*")
      .eq("passport_id", passportId);

    if (aErr) throw aErr;

    const { data: reports, error: rErr } = await supabase
      .from("passport_lab_reports")
      .select("*, passport_lab_results(*)")
      .eq("passport_id", passportId);

    if (rErr) throw rErr;

    // Keep context tight to reduce hallucinations
    const context = {
      passport: {
        id: passport.id,
        product_name: passport.product_name ?? passport.product ?? null,
        origin: passport.origin ?? null,
        batch: passport.batch ?? passport.lot ?? null,
        harvest_date: passport.harvest_date ?? null,
        is_published: passport.is_published ?? null,
      },
      agrochemicals: agros ?? [],
      lab_reports: reports ?? [],
    };

    const system = [
      "You are AgroTrust AZ Assistant.",
      mode === "buyer"
        ? "Audience: international buyer. Be precise, neutral, and risk-aware."
        : "Audience: seller. Help fill missing data and improve traceability clarity.",
      "RULES:",
      "- Use ONLY the provided context. If a fact is missing, say you don't know.",
      "- Do NOT invent lab values, pesticide names, or compliance limits.",
      "- If user asks for legal/compliance guarantees, answer with a disclaimer.",
      `- Reply in ${language.toUpperCase()} language.`,
    ].join("\n");

    const resp = await openai.responses.create({
      model: "gpt-5.2",
      input: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            "CONTEXT (JSON):\n" +
            JSON.stringify(context) +
            "\n\nQUESTION:\n" +
            question,
        },
      ],
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: resp.output_text }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: e?.message ?? "Unknown error",
      }),
    };
  }
}
