import { useEffect, useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";

import { Card } from "@/components/common/Card";
import { ROUTES } from "@/app/config/routes";

import type { Passport } from "@/features/passport/types";
import { getPassportById } from "@/features/passport/api/passportApi";
import { PassportPreview } from "@/features/passport/components/PassportPreview";
import { PassportChemLabSection } from "@/features/passport/PassportChemLabSection";
import { TraceabilityTimeline } from "@/features/passport/components/TraceabilityTimeline";

export default function BuyerPassport() {
  const [params] = useSearchParams();
  const passportId = useMemo(() => (params.get("passportId") || "").trim(), [params]);

  const [loading, setLoading] = useState(false);
  const [passport, setPassport] = useState<Passport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!passportId) {
        setPassport(null);
        setError("Missing passportId in URL.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getPassportById(passportId);
        if (!alive) return;

        if (!data) {
          setPassport(null);
          setError("Passport not found (or not public yet).");
          return;
        }

        setPassport(data);
      } catch (e: any) {
        if (!alive) return;
        setPassport(null);
        setError(e?.message || "Failed to load passport.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [passportId]);

  return (
    <div className="buyer-passport">
      <div className="buyer-passport__wrap">
        <div className="buyer-passport__top">
          <div>
            <div className="buyer-passport__title">Buyer Passport View</div>
            <div className="muted">Read-only Digital Product Passport preview for buyers.</div>
          </div>

          <div className="buyer-passport__actions">
            <NavLink className="btn btn--soft btn--sm" to={ROUTES.HOME}>
              Home
            </NavLink>
          </div>
        </div>

        <Card variant="soft" className="buyer-passport__panel">
          <div className="buyer-passport__kv">
            <span className="buyer-passport__label">Passport ID</span>
            <code className="buyer-passport__value">{passportId || "—"}</code>
          </div>

          {loading ? <div className="muted">Loading…</div> : null}
          {error ? <div className="buyer-passport__error">{error}</div> : null}

          {passport ? (
            <div className="buyer-passport__content">
              <PassportPreview passport={passport} variant="default" />

              <div className="buyer-passport__section">
                <div className="buyer-passport__section-title">Chemicals & Lab Evidence</div>
                <PassportChemLabSection passportId={passport.id} />
              </div>

              <div className="buyer-passport__section">
                <div className="buyer-passport__section-title">Traceability</div>
                <TraceabilityTimeline trace-items={passport.traceability ?? []} />
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <style>
        {`
          .buyer-passport{ padding: var(--space-5); }
          .buyer-passport__wrap{ max-width: 1100px; margin: 0 auto; display:grid; gap: var(--space-4); }
          .buyer-passport__top{ display:flex; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; align-items: flex-start; }
          .buyer-passport__title{ font-size: var(--fs-5); font-weight: var(--fw-semibold); }
          .buyer-passport__actions{ display:flex; gap: var(--space-2); }
          .buyer-passport__panel{ padding: var(--space-4); display:grid; gap: var(--space-4); }
          .buyer-passport__kv{ display:flex; justify-content: space-between; gap: var(--space-3); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-3); }
          .buyer-passport__label{ font-size: var(--fs-1); text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-soft); }
          .buyer-passport__value{ font-family: var(--font-mono); font-size: var(--fs-1); overflow-wrap: anywhere; text-align:right; }
          .buyer-passport__error{ padding: 10px 12px; border-radius: 10px; border: var(--border-1); background: var(--color-elevated); }
          .buyer-passport__content{ display:grid; gap: var(--space-4); }
          .buyer-passport__section{ display:grid; gap: var(--space-2); }
          .buyer-passport__section-title{ font-size: var(--fs-1); text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-soft); }
        `}
      </style>
    </div>
  );
}
