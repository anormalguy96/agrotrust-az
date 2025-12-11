import type { Handler } from "@netlify/functions";
import { mailer } from "./mailer";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { name, email, role, message } = body;

    if (!name || !email || !message) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    const safeRole = role || "Not specified";

    await mailer.sendMail({
      from: `"AgroTrust AZ Contact" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      replyTo: email,
      subject: `New contact form submission from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Role: ${safeRole}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("Contact form error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Failed to send message" }),
    };
  }
};
