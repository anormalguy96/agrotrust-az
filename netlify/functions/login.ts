import type { Handler } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabaseClient";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { email, password } = JSON.parse(event.body || "{}") as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and password are required." }),
      };
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, email, first_name, last_name, role, password_hash, email_verified")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid email or password." }),
      };
    }

    if (!user.email_verified) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Please verify your email first." }),
      };
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid email or password." }),
      };
    }

    const publicUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ user: publicUser }),
    };
  } catch (err) {
    console.error("Login error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error." }),
    };
  }
};
