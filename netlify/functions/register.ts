import type { Handler } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabaseClient";
import { mailer } from "./mailer";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

// only these roles are allowed via public sign-up
const SAFE_ROLES = ["coop", "buyer"] as const;
type SafeRole = (typeof SAFE_ROLES)[number];

function normalizeRole(input: unknown): SafeRole {
  let r = String(input || "").toLowerCase().trim();

  // map a few possible labels to internal values
  if (r === "cooperative" || r === "farmer" || r === "cooperative / farmer") {
    r = "coop";
  }
  if (r === "buyer" || r === "importer" || r === "buyer / importer") {
    r = "buyer";
  }

  if ((SAFE_ROLES as readonly string[]).includes(r)) {
    return r as SafeRole;
  }

  // fallback – never "admin"
  return "coop";
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}") as {
      firstName?: string;
      lastName?: string;
      role?: string;
      email?: string;
      password?: string;
      phoneCountry?: string;
      phoneNumber?: string;
    };

    const {
      firstName,
      lastName,
      role,
      email,
      password,
      phoneCountry,
      phoneNumber,
    } = body;

    if (!firstName || !lastName || !role || !email || !password) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);
    const effectiveRole = normalizeRole(role);

    // ---- phone normalisation (optional) ----
    const rawPhoneCountry = (phoneCountry || "").trim();
    const rawPhoneNumber = (phoneNumber || "").trim();

    let phone: string | null = null;
    if (rawPhoneCountry && rawPhoneNumber) {
      const cc = rawPhoneCountry.startsWith("+")
        ? rawPhoneCountry
        : `+${rawPhoneCountry}`;
      const num = rawPhoneNumber.replace(/[^\d]/g, ""); // digits only
      if (num.length > 3) {
        phone = `${cc}${num}`;
      }
    }
    // ---------------------------------------

    // 1) Insert user
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        first_name: firstName,
        last_name: lastName,
        role: effectiveRole, // safe role
        email: normalizedEmail,
        password_hash: passwordHash,
        phone, // may be null
      })
      .select("*")
      .single();

    if (userError) {
      if ((userError as any).code === "23505") {
        return { statusCode: 409, body: "Email is already registered" };
      }
      console.error("User insert error:", userError);
      return { statusCode: 500, body: "Failed to create user" };
    }

    // 2) Create OTP row
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: otpError } = await supabaseAdmin
      .from("email_verifications")
      .insert({
        user_id: user.id,
        otp_code: otp,
        expires_at: expiresAt,
      });

    if (otpError) {
      console.error("OTP insert error:", otpError);
      return { statusCode: 500, body: "Failed to create verification code" };
    }

    // 3) Try to send email, but don't crash on failure
    let emailSent = false;
    try {
      await mailer.sendMail({
        from: `"AgroTrust AZ" <${process.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: "Your AgroTrust AZ verification code",
        text: `Your verification code is: ${otp}\n\nIt is valid for 10 minutes.`,
      });
      emailSent = true;
    } catch (mailError) {
      console.error("Error sending verification email:", mailError);
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User created; verification code generated",
        emailSent,
        // For local debugging you *can* expose the OTP:
        ...(process.env.NODE_ENV !== "production" ? { otp } : {}),
      }),
    };
  } catch (err) {
    console.error("Register error:", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};