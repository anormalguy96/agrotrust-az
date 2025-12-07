// agrotrust-az/src/features/lots/components/LotCard.tsx

import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import type { Lot, LotStatus } from "../types";

import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { ROUTES } from "@/app/config/routes";

type LotCardVariant = "default" | "compact";

export type LotCardProps = {
  lot: Lot;

  variant?: LotCardVariant;
  className?: string;

  /**
   * Optional slot for extra right-side actions.
   * Example: "Create passport", "Init escrow", etc.
   */
  actions?: ReactNode;

  showCertifications?: boolean;
  showPricing?: boolean;
  showOwner?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function statusTone(status: LotStatus) {
  switch (status) {
    case "listed":
      return "success";
    case "reserved":
    case "in_negotiation":
      return "warning";
    case "sold":
      return "info";
    case "archived":
      return "muted";
    case "draft":
    default:
      return "muted";
  }
}

function statusLabel(status: LotStatus) {
  return status.replace(/_/g, " ");
}

function formatKgApprox(lot: Lot) {
  const kg = lot.inventory.quantityKgApprox;
  if (typeof kg === "number" && Number.isFinite(kg)) {
    return `${kg.toLocaleString()} kg`;
  }

  // Rough fallback if unit is kg or ton
  if (lot.inventory.unit === "kg") {
    return `${lot.inventory.quantity.toLocaleString()} kg`;
  }
  if (lot.inventory.unit === "ton") {
    const approx = lot.inventory.quantity * 1000;
    return `${approx.toLocaleString()} kg`;
  }

  return "—";
}

function formatUnitQuantity(lot: Lot) {
  return `${lot.inventory.quantity.toLocaleString()} ${lot.inventory.unit}`;
}

function formatMoney(
  value?: number,
  currency?: string
) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const c = currency ?? "USD";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${c}`;
  }
}

function buildLotDetailsPath(lotId: string) {
  // Use the ROUTES template safely without needing extra helpers.
  const template = ROUTES.DASHBOARD.LOT_DETAILS;
  return template.includes(":lotId")
    ? template.replace(":lotId", encodeURIComponent(lotId))
    : `${ROUTES.DASHBOARD.LOTS}/${encodeURIComponent(lotId)}`;
}

/**
 * LotCard
 *
 * A reusable, dashboard-friendly card for a cooperative lot listing.
 * Designed to work with mock or future real API data.
 */
export function LotCard({
  lot,
  variant = "default",
  className,
  actions,
  showCertifications = true,
  showPricing = true,
  showOwner = true
}: LotCardProps) {
  const compact = variant === "compact";

  const tone = statusTone(lot.status);
  const detailsPath = buildLotDetailsPath(lot.id);

  const certs = (lot.certifications ?? [])
    .map((c) => (typeof c === "string" ? c : c.code))
    .filter(Boolean)
    .slice(0, compact ? 2 : 5);

  const hasPricing = Boolean(lot.pricing?.unitPrice);

  return (
    <Card
      variant="soft"
      className={cx("lot-card", `lot-card--${variant}`, className)}
    >
      <header className="lot-card__head">
        <div className="lot-card__head-left">
          <div className="lot-card__kicker">
            Export-ready lot
          </div>

          <div className="lot-card__title">
            {lot.product.name}
            {lot.product.variety ? (
              <span className="lot-card__subtitle">
                {" "}
                • {lot.product.variety}
              </span>
            ) : null}
          </div>

          <div className="lot-card__meta muted">
            <span className="lot-card__meta-item">
              {lot.location?.region ?? "Region not specified"}
            </span>
            <span className="lot-card__dot" aria-hidden="true">•</span>
            <span className="lot-card__meta-item mono">
              {lot.id}
            </span>
          </div>
        </div>

        <div className="lot-card__head-right">
          <Badge variant={tone as any}>
            {statusLabel(lot.status)}
          </Badge>

          {actions ? (
            <div className="lot-card__actions">
              {actions}
            </div>
          ) : null}
        </div>
      </header>

      <div className="lot-card__body">
        <div className="lot-card__grid">
          <section className="lot-card__section">
            <div className="lot-card__section-title">Inventory</div>

            <div className="lc-kv">
              <div className="lc-kv__row">
                <span className="lc-kv__label">Quantity</span>
                <span className="lc-kv__value">
                  {formatUnitQuantity(lot)}
                </span>
              </div>
              <div className="lc-kv__row">
                <span className="lc-kv__label">Approx. weight</span>
                <span className="lc-kv__value">
                  {formatKgApprox(lot)}
                </span>
              </div>
              {!compact && lot.product.grade ? (
                <div className="lc-kv__row">
                  <span className="lc-kv__label">Grade</span>
                  <span className="lc-kv__value">
                    {lot.product.grade}
                  </span>
                </div>
              ) : null}
            </div>
          </section>

          {showPricing && (
            <section className="lot-card__section">
              <div className="lot-card__section-title">Pricing</div>

              {!hasPricing ? (
                <div className="muted">
                  Pricing not provided for this lot.
                </div>
              ) : (
                <div className="lc-kv">
                  <div className="lc-kv__row">
                    <span className="lc-kv__label">Unit price</span>
                    <span className="lc-kv__value">
                      {formatMoney(lot.pricing?.unitPrice, lot.pricing?.currency)}
                    </span>
                  </div>

                  {!compact && (
                    <>
                      <div className="lc-kv__row">
                        <span className="lc-kv__label">Band</span>
                        <span className="lc-kv__value">
                          {formatMoney(lot.pricing?.minUnitPrice, lot.pricing?.currency)}
                          {" "}
                          –{" "}
                          {formatMoney(lot.pricing?.maxUnitPrice, lot.pricing?.currency)}
                        </span>
                      </div>

                      <div className="lc-kv__row">
                        <span className="lc-kv__label">Incoterms</span>
                        <span className="lc-kv__value">
                          {lot.pricing?.incoterms ?? "—"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {showOwner && (
            <section className="lot-card__section">
              <div className="lot-card__section-title">Owner</div>

              <div className="lc-kv">
                <div className="lc-kv__row">
                  <span className="lc-kv__label">Cooperative</span>
                  <span className="lc-kv__value">
                    {lot.owner.coopName}
                  </span>
                </div>

                {!compact && lot.owner.contactName ? (
                  <div className="lc-kv__row">
                    <span className="lc-kv__label">Contact</span>
                    <span className="lc-kv__value">
                      {lot.owner.contactName}
                    </span>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          {showCertifications && (
            <section className="lot-card__section lot-card__section--wide">
              <div className="lot-card__section-title">Certifications (claimed)</div>

              {certs.length === 0 ? (
                <div className="muted">
                  No certifications listed yet.
                </div>
              ) : (
                <div className="lot-card__chips">
                  {certs.map((c) => (
                    <Badge key={c} variant="outline" size="sm">
                      {String(c)}
                    </Badge>
                  ))}
                  {(lot.certifications?.length ?? 0) > certs.length && (
                    <Badge variant="muted" size="sm">
                      +{(lot.certifications?.length ?? 0) - certs.length} more
                    </Badge>
                  )}
                </div>
              )}

              {!compact && (
                <div className="lot-card__hint muted">
                  In production, these claims would be confirmed against accredited auditor records.
                </div>
              )}
            </section>
          )}
        </div>

        <div className="lot-card__footer">
          <div className="lot-card__footer-left muted">
            {lot.passportId ? (
              <>
                Passport linked: <span className="mono">{lot.passportId}</span>
              </>
            ) : (
              "No passport linked yet"
            )}
          </div>

          <div className="lot-card__footer-right">
            <Button
              variant="ghost"
              size="sm"
              to={ROUTES.DASHBOARD.LOTS}
            >
              All lots
            </Button>

            <Button
              variant="soft"
              size="sm"
              to={detailsPath}
            >
              View details
            </Button>
          </div>
        </div>
      </div>

      <style>
        {`
          .lot-card{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .lot-card__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .lot-card__kicker{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .lot-card__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .lot-card__subtitle{
            font-weight: var(--fw-regular);
            color: var(--color-text-muted);
            font-size: 0.95em;
          }

          .lot-card__meta{
            display:flex;
            align-items:center;
            gap: 8px;
            flex-wrap: wrap;
            font-size: var(--fs-1);
            margin-top: 4px;
          }

          .lot-card__dot{
            opacity: 0.5;
          }

          .lot-card__head-right{
            display:flex;
            align-items: center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .lot-card__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .lot-card__body{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .lot-card__grid{
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-4);
            align-items: start;
          }

          .lot-card__section{
            border: var(--border-1);
            background: var(--color-surface);
            border-radius: var(--radius-1);
            padding: var(--space-4);
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .lot-card__section--wide{
            grid-column: 1 / -1;
          }

          .lot-card__section-title{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .lc-kv{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .lc-kv__row{
            display:flex;
            justify-content: space-between;
            gap: var(--space-3);
            padding: 6px 0;
            border-bottom: 1px solid var(--color-border);
          }

          .lc-kv__row:last-child{
            border-bottom: none;
          }

          .lc-kv__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .lc-kv__value{
            font-size: var(--fs-2);
            text-align: right;
          }

          .mono{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .lot-card__chips{
            display:flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .lot-card__hint{
            font-size: var(--fs-1);
          }

          .lot-card__footer{
            display:flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
            padding-top: var(--space-3);
            border-top: 1px solid var(--color-border);
          }

          .lot-card__footer-left{
            font-size: var(--fs-1);
          }

          .lot-card__footer-right{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .lot-card--compact .lot-card__grid{
            grid-template-columns: 1fr;
          }

          @media (max-width: 980px){
            .lot-card__grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </Card>
  );
}