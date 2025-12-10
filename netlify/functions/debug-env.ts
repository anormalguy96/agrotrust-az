import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        has_SUPABASE_URL: !!process.env.SUPABASE_URL,
        has_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        has_SMTP_HOST: !!process.env.SMTP_HOST,
        has_SMTP_PORT: !!process.env.SMTP_PORT,
        has_SMTP_USER: !!process.env.SMTP_USER,
        has_SMTP_PASS: !!process.env.SMTP_PASS,
        
        supabase_related_keys: Object.keys(process.env).filter((k) =>
          k.toUpperCase().includes("SUPABASE")
        ),
      },
      null,
      2
    ),
    headers: {
      "Content-Type": "application/json",
    },
  };
};
