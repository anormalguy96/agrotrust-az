// netlify/functions/verify-email.ts
import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { email, otp } = body;

    if (!email || !otp) {
      return { statusCode: 400, body: "Email and OTP are required" };
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Find latest OTP for this user
    const { data, error } = await supabaseAdmin
      .from("email_verifications")
      .select("id, user_id, otp_code, expires_at, consumed_at, users!inner(email)")
      .eq("users.email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Verification lookup error:", error);
      return { statusCode: 500, body: "Internal Server Error" };
    }

    if (!data) {
      return { statusCode: 400, body: "Invalid or expired code" };
    }

    if (data.consumed_at) {
      return { statusCode: 400, body: "Code already used" };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { statusCode: 400, body: "Code expired" };
    }

    if (data.otp_code !== otp) {
      return { statusCode: 400, body: "Invalid code" };
    }

    // Mark verified & consume OTP
    const [{ error: userUpdateError }, { error: otpUpdateError }] = await Promise.all([
      supabaseAdmin
        .from("users")
        .update({ email_verified: true })
        .eq("id", data.user_id),
      supabaseAdmin
        .from("email_verifications")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", data.id),
    ]);

    if (userUpdateError || otpUpdateError) {
      console.error("Verification update error:", { userUpdateError, otpUpdateError });
      return { statusCode: 500, body: "Failed to complete verification" };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email verified" }),
    };
  } catch (err) {
    console.error("Verify email error:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
