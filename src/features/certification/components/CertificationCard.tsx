// agrotrust-az/src/features/certification/components/CertificationCard.tsx

import type { ReactNode } from "react";

import type {
  CertificationRecord,
  CertificationSummary,
  CertificationStatus
} from "../types";

import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";

type CertificationCardVariant = "default" | "compact";

export type CertificationCardProps = {
  certification: CertificationRecord | CertificationSummary;

  variant?: CertificationCardVariant;
  className?: string;

  /**
   * Optional slot for extra actions
   * (e.g., "Verify", "Reject", "View details").
   */
  actions?: ReactNode;
};

type NormalisedCert = {
  id: string;
  code: string;
  label?: string;
  status: CertificationStatus;

  coopName?: string;
  lotId?: string;
  passportId?: string;

  issuerName?: string;

  requestedAt?: string;
  issuedAt?: string;
  expiresAt?: string;
  createdAt: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function statusTone(status: CertificationStatus) {
  switch (status) {
    case "verified":
      return "success";
    case "claimed":
    case "requested":
    case "pending_review":
      return "warning";
    case "rejected":
    case "revoked":
      return "danger";
    case "expired":
      return "muted";
    case "draft":
    default:
      return "muted";
  }
}

function statusLabel(status: CertificationStatus) {
  return status.replace(/_/g, " ");
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit"
    }).format(new Date(t));
  } catch {
    return "—";
  }
}

function daysTo(iso?: string) {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return undefined;
  const today = new Date();
  const target = new Date(t);
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

function normalise(cert: CertificationRecord | CertificationSummary): NormalisedCert {
  const isRecord = (cert as CertificationRecord).standard !== undefined;

  if (isRecord) {
    const c = cert as CertificationRecord;

    return {
      id: c.id,
      code: String(c.standard.code),
      label: c.standard.label,
      status: c.status,
      coopName: c.applicant?.coopName ?? c.scope?.coopId,
      lotId: c.scope?.lotId,
      passportId: c.scope?.passportId,
      issuerName: c.issuer?.name,
      requestedAt: c.requestedAt,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      createdAt: c.createdAt
    };
  }

  const s = cert as CertificationSummary;

  return {
    id: s.id,
    code: s.code,
    label: s.label,
    status: s.status,
    coopName: s.coopName,
    lotId: s.lotId,
    passportId: s.passportId,
    issuerName: s.issuerName,
    issuedAt: s.issuedAt,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt
  };
}

/**
 * CertificationCard
 *
 * A compact certification summary suitable for:
 * - Dashboard overview
 * - Lot / passport side panels
 * - Certification admin list
 */
export function CertificationCard({
  certification,
  variant = "default",
  className,
  actions
}: CertificationCardProps) {
  const compact = variant === "compact";

  const c = normalise(certification);
  const tone = statusTone(c.status);

  const mainLabel = c.label || c.code;
  const codeSuffix = c.label ? c.code : undefined;

  const days = daysTo(c.expiresAt);
  const expiresTone =
    typeof days === "number"
      ? days < 0
        ? "danger"
        : days <= 30
        ? "warning"
        : "muted"
      : "muted";

  return (
    <Card
      variant="soft"
      className={cx("cert-card", `cert-card--${variant}`, className)}
    >
      <header className="cert-card__head">
        <div className="cert-card__head-left">
          <div className="cert-card__label">
            Certification
          </div>
          <div className="cert-card__title">
            {mainLabel}
            {codeSuffix ? (
              <span className="cert-card__code">
                {" "}
                • {codeSuffix}
              </span>
            ) : null}
          </div>

          {!compact && (
            <div className="muted cert-card__meta">
              <span className="cert-card__meta-item">
                ID: <span className="mono">{c.id}</span>
              </span>
              {c.coopName && (
                <>
                  <span className="cert-card__dot" aria-hidden="true">
                    •
                  </span>
                  <span className="cert-card__meta-item">
                    {c.coopName}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="cert-card__head-right">
          <Badge variant={tone as any}>
            {statusLabel(c.status)}
          </Badge>

          {actions ? (
            <div className="cert-card__actions">
              {actions}
            </div>
          ) : null}
        </div>
      </header>

      <div className="cert-card__body">
        <div className="cert-card__grid">
          <section className="cert-card__section">
            <div className="cert-card__section-title">Scope</div>

            <div className="cc-kv">
              <div className="cc-kv__row">
                <span className="cc-kv__label">Cooperative</span>
                <span className="cc-kv__value">
                  {c.coopName ?? <span className="muted">—</span>}
                </span>
              </div>

              <div className="cc-kv__row">
                <span className="cc-kv__label">Lot</span>
                <span className="cc-kv__value mono">
                  {c.lotId ?? "—"}
                </span>
              </div>

              {!compact && (
                <div className="cc-kv__row">
                  <span className="cc-kv__label">Passport</span>
                  <span className="cc-kv__value mono">
                    {c.passportId ?? "—"}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="cert-card__section">
            <div className="cert-card__section-title">Issuer</div>

            <div className="cc-kv">
              <div className="cc-kv__row">
                <span className="cc-kv__label">Issuer</span>
                <span className="cc-kv__value">
                  {c.issuerName ?? <span className="muted">Not assigned</span>}
                </span>
              </div>

              <div className="cc-kv__row">
                <span className="cc-kv__label">Issued</span>
                <span className="cc-kv__value">
                  {formatDate(c.issuedAt)}
                </span>
              </div>

              <div className="cc-kv__row">
                <span className="cc-kv__label">Created</span>
                <span className="cc-kv__value">
                  {formatDate(c.createdAt)}
                </span>
              </div>
            </div>
          </section>

          <section className="cert-card__section cert-card__section--wide">
            <div className="cert-card__section-title">Validity</div>

            <div className="cert-card__validity">
              <div className="cert-card__validity-row">
                <span className="cert-card__validity-label">
                  Expires
                </span>
                <span className="cert-card__validity-value">
                  {formatDate(c.expiresAt)}
                </span>
              </div>

              {typeof days === "number" && (
                <div className="cert-card__validity-row">
                  <span className="cert-card__validity-label">
                    Time to expiry
                  </span>
                  <span className={cx("cert-card__validity-pill", `cert-card__validity-pill--${expiresTone}`)}>
                    {days < 0
                      ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`
                      : `${days} day${days === 1 ? "" : "s"} left`}
                  </span>
                </div>
              )}
            </div>

            {!compact && (
              <div className="cert-card__hint muted">
                For the hackathon MVP, verification logic is simulated. In production,
                this would be backed by accredited auditor registries.
              </div>
            )}
          </section>
        </div>

        {!compact && (
          <footer className="cert-card__footer">
            <div className="cert-card__footer-left muted">
              This certification can be linked into the Digital Product Passport to
              strengthen export trust.
            </div>

            <div className="cert-card__footer-right">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                disabled
                title="Placeholder: hook this to a page later"
              >
                View record
              </Button>
            </div>
          </footer>
        )}
      </div>

      <style>
        {`
          .cert-card{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .cert-card__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .cert-card__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .cert-card__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .cert-card__code{
            font-weight: var(--fw-regular);
            color: var(--color-text-muted);
            font-size: 0.95em;
          }

          .cert-card__meta{
            display:flex;
            align-items:center;
            gap: 8px;
            flex-wrap: wrap;
            font-size: var(--fs-1);
            margin-top: 4px;
          }

          .cert-card__meta-item{
            display:inline-flex;
            align-items:center;
            gap: 4px;
          }

          .cert-card__dot{
            opacity: 0.5;
          }

          .cert-card__head-right{
            display:flex;
            align-items: center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .cert-card__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .cert-card__body{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .cert-card__grid{
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-4);
            align-items: start;
          }

          .cert-card__section{
            border: var(--border-1);
            background: var(--color-surface);
            border-radius: var(--radius-1);
            padding: var(--space-4);
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .cert-card__section--wide{
            grid-column: 1 / -1;
          }

          .cert-card__section-title{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .cc-kv{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .cc-kv__row{
            display:flex;
            justify-content: space-between;
            gap: var(--space-3);
            padding: 6px 0;
            border-bottom: 1px solid var(--color-border);
          }

          .cc-kv__row:last-child{
            border-bottom: none;
          }

          .cc-kv__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .cc-kv__value{
            font-size: var(--fs-2);
            text-align: right;
          }

          .mono{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .cert-card__validity{
            display:flex;
            flex-direction: column;
            gap: 8px;
          }

          .cert-card__validity-row{
            display:flex;
            justify-content: space-between;
            gap: var(--space-3);
            align-items:center;
          }

          .cert-card__validity-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .cert-card__validity-value{
            font-size: var(--fs-2);
          }

          .cert-card__validity-pill{
            display:inline-flex;
            align-items:center;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: var(--fs-1);
            border: 1px solid var(--color-border);
            background: var(--color-elevated);
          }

          .cert-card__validity-pill--success{
            border-color: color-mix(in oklab, var(--color-success) 60%, var(--color-border));
          }

          .cert-card__validity-pill--warning{
            border-color: color-mix(in oklab, var(--color-warning) 60%, var(--color-border));
          }

          .cert-card__validity-pill--danger{
            border-color: color-mix(in oklab, var(--color-danger) 60%, var(--color-border));
          }

          .cert-card__validity-pill--muted{
            opacity: 0.8;
          }

          .cert-card__hint{
            font-size: var(--fs-1);
          }

          .cert-card__footer{
            display:flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
            padding-top: var(--space-3);
            border-top: 1px solid var(--color-border);
          }

          .cert-card__footer-left{
            font-size: var(--fs-1);
          }

          .cert-card__footer-right{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .cert-card--compact .cert-card__grid{
            grid-template-columns: 1fr;
          }

          .cert-card--compact .cert-card__footer{
            display:none;
          }

          @media (max-width: 980px){
            .cert-card__grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </Card>
  );
}