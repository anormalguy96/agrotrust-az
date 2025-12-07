// agrotrust-az/src/features/rfq/components/RFQCard.tsx

import type { ReactNode } from "react";

import type { RFQ, RFQStatus, RFQPriority } from "../types";

import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";

type RFQCardVariant = "default" | "compact";

export type RFQCardProps = {
  rfq: RFQ;

  variant?: RFQCardVariant;
  className?: string;

  /**
   * Optional right-side action slot for page-specific buttons.
   * If not provided, we show only a lightweight "View" placeholder.
   */
  actions?: ReactNode;

  showBuyer?: boolean;
  showProducts?: boolean;
  showPricing?: boolean;
  showPriority?: boolean;
  showDeadline?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function statusTone(status: RFQStatus) {
  switch (status) {
    case "open":
      return "success";
    case "shortlisting":
    case "negotiation":
      return "warning";
    case "awarded":
      return "info";
    case "closed":
    case "cancelled":
      return "danger";
    case "draft":
    default:
      return "muted";
  }
}

function statusLabel(status: RFQStatus) {
  return status.replace(/_/g, " ");
}

function priorityTone(priority?: RFQPriority) {
  switch (priority) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "muted";
    default:
      return "muted";
  }
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
  const d = Math.round((t - Date.now()) / (1000 * 60 * 60 * 24));
  return d;
}

function formatMoney(value?: number, currency?: string) {
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

function primaryCategory(rfq: RFQ) {
  return rfq.products?.[0]?.category ? String(rfq.products[0].category) : "—";
}

function quantityText(rfq: RFQ) {
  const p = rfq.products?.[0];
  if (!p) return "—";
  const q = typeof p.quantity === "number" ? p.quantity : 0;
  const unit = p.unit ?? "kg";
  return `${q.toLocaleString()} ${unit}`;
}

function productsCompactText(rfq: RFQ) {
  const products = rfq.products ?? [];
  if (products.length === 0) return "No products";
  if (products.length === 1) {
    const p = products[0];
    return `${p.name} • ${quantityText(rfq)}`;
  }
  return `${products.length} product lines`;
}

/**
 * RFQCard
 *
 * A buyer-demand summary card for dashboard and overview screens.
 * This component is intentionally UI-focused and backend-agnostic.
 */
export function RFQCard({
  rfq,
  variant = "default",
  className,
  actions,
  showBuyer = true,
  showProducts = true,
  showPricing = true,
  showPriority = true,
  showDeadline = true
}: RFQCardProps) {
  const compact = variant === "compact";

  const statusVar = statusTone(rfq.status);
  const priorityVar = priorityTone(rfq.priority);

  const deadlineDays = daysTo(rfq.openUntil);
  const deadlineTone =
    typeof deadlineDays === "number"
      ? deadlineDays < 0
        ? "danger"
        : deadlineDays <= 5
        ? "warning"
        : "muted"
      : "muted";

  return (
    <Card
      variant="soft"
      className={cx("rfq-card", `rfq-card--${variant}`, className)}
    >
      <header className="rfq-card__head">
        <div className="rfq-card__head-left">
          <div className="rfq-card__kicker">Buyer demand</div>

          <div className="rfq-card__title">
            {rfq.title}
          </div>

          {!compact && (
            <div className="rfq-card__meta muted">
              <span className="rfq-card__meta-item mono">
                {rfq.id}
              </span>
              <span className="rfq-card__dot" aria-hidden="true">•</span>
              <span className="rfq-card__meta-item">
                Category: {primaryCategory(rfq)}
              </span>
              {rfq.createdAt ? (
                <>
                  <span className="rfq-card__dot" aria-hidden="true">•</span>
                  <span className="rfq-card__meta-item">
                    Created {formatDate(rfq.createdAt)}
                  </span>
                </>
              ) : null}
            </div>
          )}
        </div>

        <div className="rfq-card__head-right">
          <Badge variant={statusVar as any}>
            {statusLabel(rfq.status)}
          </Badge>

          {showPriority && rfq.priority ? (
            <Badge variant={priorityVar as any} size="sm">
              {rfq.priority}
            </Badge>
          ) : null}

          {actions ? (
            <div className="rfq-card__actions">
              {actions}
            </div>
          ) : null}
        </div>
      </header>

      <div className="rfq-card__body">
        <div className="rfq-card__grid">
          {showBuyer && (
            <section className="rfq-card__section">
              <div className="rfq-card__section-title">Buyer</div>

              <div className="rc-kv">
                <div className="rc-kv__row">
                  <span className="rc-kv__label">Organisation</span>
                  <span className="rc-kv__value">
                    {rfq.buyer.organisation ?? rfq.buyer.name}
                  </span>
                </div>

                {!compact && (
                  <div className="rc-kv__row">
                    <span className="rc-kv__label">Contact</span>
                    <span className="rc-kv__value">
                      {rfq.buyer.name}
                    </span>
                  </div>
                )}

                <div className="rc-kv__row">
                  <span className="rc-kv__label">Location</span>
                  <span className="rc-kv__value">
                    {[rfq.buyer.city, rfq.buyer.country].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>

                {!compact && rfq.buyer.verified ? (
                  <div className="rc-kv__row">
                    <span className="rc-kv__label">Trust</span>
                    <span className="rc-kv__value">
                      <Badge variant="success" size="sm">verified buyer</Badge>
                    </span>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          {showProducts && (
            <section className="rfq-card__section">
              <div className="rfq-card__section-title">Requested</div>

              {compact ? (
                <div className="rfq-card__compact-products">
                  {productsCompactText(rfq)}
                </div>
              ) : (
                <div className="rc-kv">
                  {(rfq.products ?? []).slice(0, 3).map((p, idx) => (
                    <div key={`${p.name}-${idx}`} className="rfq-card__product-line">
                      <div className="rfq-card__product-name">
                        {p.name}
                        {p.variety ? (
                          <span className="muted"> • {p.variety}</span>
                        ) : null}
                      </div>
                      <div className="rfq-card__product-qty">
                        {typeof p.quantity === "number"
                          ? `${p.quantity.toLocaleString()} ${p.unit ?? "kg"}`
                          : "—"}
                      </div>

                      {(p.certifications?.length ?? 0) > 0 ? (
                        <div className="rfq-card__product-certs">
                          {(p.certifications ?? []).slice(0, 4).map((c) => (
                            <Badge key={`${idx}-${c.code}`} variant="outline" size="sm">
                              {c.code}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="muted rfq-card__product-certs">
                          No certification requirements listed
                        </div>
                      )}
                    </div>
                  ))}

                  {(rfq.products?.length ?? 0) > 3 ? (
                    <div className="muted">
                      +{(rfq.products?.length ?? 0) - 3} more lines
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          )}

          {(showPricing || showDeadline) && (
            <section className="rfq-card__section">
              <div className="rfq-card__section-title">Commercial</div>

              <div className="rc-kv">
                {showPricing && (
                  <>
                    <div className="rc-kv__row">
                      <span className="rc-kv__label">Currency</span>
                      <span className="rc-kv__value">
                        {rfq.terms.currency}
                      </span>
                    </div>

                    <div className="rc-kv__row">
                      <span className="rc-kv__label">Target unit price</span>
                      <span className="rc-kv__value">
                        {formatMoney(rfq.terms.targetUnitPrice, rfq.terms.currency)}
                      </span>
                    </div>

                    {!compact && (
                      <div className="rc-kv__row">
                        <span className="rc-kv__label">Price band</span>
                        <span className="rc-kv__value">
                          {formatMoney(rfq.terms.minUnitPrice, rfq.terms.currency)}
                          {" "}
                          –{" "}
                          {formatMoney(rfq.terms.maxUnitPrice, rfq.terms.currency)}
                        </span>
                      </div>
                    )}

                    {!compact && (
                      <div className="rc-kv__row">
                        <span className="rc-kv__label">Incoterms</span>
                        <span className="rc-kv__value">
                          {rfq.terms.incoterms ?? "—"}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {showDeadline && (
                  <div className="rc-kv__row">
                    <span className="rc-kv__label">Open until</span>
                    <span className="rc-kv__value">
                      <span>{formatDate(rfq.openUntil)}</span>
                      {typeof deadlineDays === "number" ? (
                        <span className={cx("rfq-card__deadline-pill", `rfq-card__deadline-pill--${deadlineTone}`)}>
                          {deadlineDays < 0
                            ? "expired"
                            : `${deadlineDays} day${deadlineDays === 1 ? "" : "s"} left`}
                        </span>
                      ) : null}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <footer className="rfq-card__footer">
          <div className="rfq-card__footer-left muted">
            {rfq.products?.length ? (
              <>
                Primary request: <strong>{primaryCategory(rfq)}</strong> • {quantityText(rfq)}
              </>
            ) : (
              "No product lines attached"
            )}
          </div>

          <div className="rfq-card__footer-right">
            {/* Placeholder until you create RFQ detail routes/pages */}
            <Button variant="ghost" size="sm" type="button" disabled>
              View RFQ
            </Button>
          </div>
        </footer>
      </div>

      <style>
        {`
          .rfq-card{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .rfq-card__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .rfq-card__kicker{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .rfq-card__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            max-width: 48ch;
          }

          .rfq-card__meta{
            display:flex;
            align-items:center;
            gap: 8px;
            flex-wrap: wrap;
            font-size: var(--fs-1);
            margin-top: 4px;
          }

          .rfq-card__dot{
            opacity: 0.5;
          }

          .rfq-card__head-right{
            display:flex;
            align-items: center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .rfq-card__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .rfq-card__body{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .rfq-card__grid{
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-4);
            align-items: start;
          }

          .rfq-card__section{
            border: var(--border-1);
            background: var(--color-surface);
            border-radius: var(--radius-1);
            padding: var(--space-4);
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .rfq-card__section-title{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .rc-kv{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .rc-kv__row{
            display:flex;
            justify-content: space-between;
            align-items: center;
            gap: var(--space-3);
            padding: 6px 0;
            border-bottom: 1px solid var(--color-border);
          }

          .rc-kv__row:last-child{
            border-bottom: none;
          }

          .rc-kv__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .rc-kv__value{
            font-size: var(--fs-2);
            text-align: right;
            display:flex;
            align-items:center;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }

          .rfq-card__product-line{
            padding: 10px 0;
            border-bottom: 1px dashed var(--color-border);
            display:grid;
            gap: 6px;
          }

          .rfq-card__product-line:last-child{
            border-bottom: none;
            padding-bottom: 0;
          }

          .rfq-card__product-name{
            font-size: var(--fs-3);
            font-weight: var(--fw-medium);
          }

          .rfq-card__product-qty{
            font-size: var(--fs-2);
            color: var(--color-text-muted);
          }

          .rfq-card__product-certs{
            display:flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .rfq-card__compact-products{
            font-size: var(--fs-2);
            color: var(--color-text-muted);
          }

          .rfq-card__deadline-pill{
            display:inline-flex;
            align-items:center;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: var(--fs-1);
            border: 1px solid var(--color-border);
            background: var(--color-elevated);
          }

          .rfq-card__deadline-pill--warning{
            border-color: color-mix(in oklab, var(--color-warning) 60%, var(--color-border));
          }

          .rfq-card__deadline-pill--danger{
            border-color: color-mix(in oklab, var(--color-danger) 60%, var(--color-border));
          }

          .rfq-card__deadline-pill--muted{
            opacity: 0.8;
          }

          .rfq-card__footer{
            display:flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
            padding-top: var(--space-3);
            border-top: 1px solid var(--color-border);
          }

          .rfq-card__footer-left{
            font-size: var(--fs-1);
          }

          .rfq-card__footer-right{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .mono{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .rfq-card--compact .rfq-card__grid{
            grid-template-columns: 1fr;
          }

          @media (max-width: 980px){
            .rfq-card__grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </Card>
  );
}