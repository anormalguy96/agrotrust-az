import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/config/routes";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing authentication…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Supabase v2: exchange the code in the URL for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (cancelled) return;

        if (error) {
          console.error("Auth callback error:", error);
          setStatus("Verification failed. The link may be expired or already used.");
          return;
        }

        if (data?.session) {
          setStatus("Signed in. Redirecting…");
          navigate(ROUTES.DASHBOARD.OVERVIEW, { replace: true });
          return;
        }

        setStatus("No session was created. Please try signing in again.");
      } catch (err) {
        console.error("Unexpected error during auth callback:", err);
        if (!cancelled) setStatus("Unexpected error. Check console for details.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div style={{ padding: "2rem", maxWidth: 720, margin: "2rem auto" }}>
      <h1>Signing you in…</h1>
      <p>{status}</p>
    </div>
  );
}