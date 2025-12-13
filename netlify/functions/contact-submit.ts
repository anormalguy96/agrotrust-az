import type { Handler } from "@netlify/functions";
import { mailer } from "./mailer";

type Audience = "cooperative" | "buyer" | "other";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { name, company, email, audience, message } = body as {
      name?: string;
      company?: string;
      email?: string;
      audience?: Audience;
      message?: string;
    };

    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: "Missing required fields",
      };
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const safeName = String(name).trim();
    const safeCompany = company ? String(company).trim() : "";
    const safeAudience = (audience || "other") as Audience;
    const audienceLabel =
      safeAudience === "buyer"
        ? "Buyer / Importer"
        : safeAudience === "cooperative"
        ? "Farmer / Cooperative"
        : "Other stakeholder";

    // Send email to the AgroTrust inbox
    await mailer.sendMail({
      from: `"AgroTrust AZ contact" <${process.env.SMTP_USER}>`,
      to: "agrotrust.az@gmail.com",
      replyTo: normalizedEmail,
      subject: `New contact from ${safeName} (${audienceLabel})`,
      text: [
        `New contact request from AgroTrust marketing site`,
        "",
        `Name: ${safeName}`,
        safeCompany ? `Company / Cooperative: ${safeCompany}` : "",
        `Email: ${normalizedEmail}`,
        `Audience: ${audienceLabel}`,
        "",
        "Message:",
        message,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("Contact submit error:", err);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
