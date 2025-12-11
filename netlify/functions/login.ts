import type { Handler } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabaseClient";

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, {
      error: "METHOD_NOT_ALLOWED",
      message: "Only POST is allowed",
    });
  }

  try {
    const { email, password } = JSON.parse(event.body || "{}");

    if (!email || !password) {
      return json(400, {
        error: "VALIDATION_ERROR",
        message: "Email and password are required.",
      });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, email, role, email_verified, password_hash")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) {
      console.error("login: user not found or DB error", error);
      return json(401, {
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }

    if (!user.email_verified) {
      return json(401, {
        error: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before logging in.",
      });
    }

    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) {
      return json(401, {
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.email_verified,
    };

    return json(200, {
      user: sessionUser,
    });
  } catch (err) {
    console.error("login: unexpected error", err);
    return json(500, {
      error: "SERVER_ERROR",
      message: "Unexpected error while logging in.",
    });
  }
};

export default handler;
