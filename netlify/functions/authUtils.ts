import type { HandlerEvent } from "@netlify/functions";

export type AppRole = "admin" | "buyer" | "cooperative";

export type CurrentUser = {
  id: string;
  email: string;
  role: AppRole;
};

export function getCurrentUser(event: HandlerEvent): CurrentUser {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    // Misconfiguration on the server side
    throw Object.assign(new Error("ADMIN_SECRET is not configured"), {
      statusCode: 500
    });
  }

  // Header names can be lower-cased by Netlify, so check both forms.
  const headerSecret =
    event.headers["x-admin-secret"] ??
    // some environments keep case
    (event.headers["X-Admin-Secret"] as string | undefined);

  if (headerSecret === adminSecret) {
    // Single hard-coded admin user
    return {
      id: "admin",
      email: "agrotrust.az@gmail.com",
      role: "admin"
    };
  }

  // Not admin → unauthorized
  throw Object.assign(new Error("Unauthorized"), {
    statusCode: 401
  });
}