import type { Handler } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabaseClient";
import { mailer } from "./mailer";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { firstName, lastName, role, email, password } = body;

    if (!firstName || !lastName || !role || !email || !password) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    // 1) Insert user
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        first_name: firstName,
        last_name: lastName,
        role,
        email: normalizedEmail,
        password_hash: passwordHash,
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
