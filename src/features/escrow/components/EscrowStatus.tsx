// agrotrust-az/src/features/escrow/components/EscrowStatus.tsx

import type { ReactNode } from "react";

import type { EscrowContract, EscrowStatus as EscrowStatusType } from "../types";

import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";

type EscrowStatusVariant = "default" | "compact";

export type EscrowStatusProps = {
  contract?: EscrowContract | null;

  /**
   * If you do not have a full contract object,
   * you can pass a status directly.
   */
  status?: EscrowStatusType;

  title?: ReactNode;
  subtitle?: ReactNode;

  variant?: EscrowStatusVariant;
  className?: string;

  /**
   * Optional slot for page-level actions
   * (e.g., "Release", "Simulate inspection", etc.)
   */
  actions?: ReactNode;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function statusLabel(status: EscrowStatusType) {
  return status.replace(/_/g, " ");
}

function statusTone(status: EscrowStatusType) {
  switch (status) {
    case "released":
      return "success";
    case "funded":
    case "inspection_passed":
      return "info";
    case "awaiting_deposit":
    case "inspection_pending":
    case "in_transit":
      return "warning";
    case "inspection_failed":
    case "refunded":
    case "cancelled":
      return "danger";
    default:
      return "muted";
  }
}

function fmtMoney(amount?: number, currency?: string) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  const c = currency ?? "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${c}`;
  }
}

function fmtKg(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString()} kg`;
}

/**
 * EscrowStatus
 *
 * A judge-friendly, compact summary of the escrow contract state.
 * Designed for the hackathon MVP where the backend is simulated
 * via Netlify Functions or localStorage mocks.
 */
export function EscrowStatus({
  contract,
  status,
  title = "Escrow status",
  subtitle = "Deposit, inspection and release progress for this export deal",
  variant = "default",
  className,
  actions
}: EscrowStatusProps) {
  const derivedStatus =
    status ?? contract?.status ?? "draft";

  const tone = statusTone(derivedStatus);

  const isCompact = variant === "compact";

  const buyerName =
    contract?.buyer?.organisation ||
    contract?.buyer?.name;

  const sellerName =
    contract?.seller?.organisation ||
    contract?.seller?.name;

  const inspection = contract?.inspection;
  const inspectionResult = inspection?.result;

  const milestonesCount = contract?.milestones?.length ?? 0;

  return (
    <Card
      variant="soft"
      className={cx("escrow-status", `escrow-status--${variant}`, className)}
    >
      <header className="escrow-status__head">
        <div className="escrow-status__head-left">
          <div className="escrow-status__label">Trust & payments</div>
          <div className="escrow-status__title">{title}</div>
          {subtitle ? (
            <div className="muted escrow-status__subtitle">{subtitle}</div>
          ) : null}
        </div>

        <div className="escrow-status__head-right">
          <Badge variant={tone as any}>
            {statusLabel(derivedStatus)}
          </Badge>
          {actions ? (
            <div className="escrow-status__actions">{actions}</div>
          ) : null}
        </div>
      </header>

      {!contract ? (
        <div className="escrow-status__empty">
          <div className="escrow-status__empty-title">No contract selected</div>
          <div className="muted">
            Create an escrow contract from a lot or RFQ to display its
            payment and inspection state here.
          </div>
        </div>
      ) : (
        <div className="escrow-status__grid">
          <section className="escrow-status__section">
            <div className="escrow-status__section-title">Contract</div>

            <div className="es-kv">
              <div className="es-kv__row">
                <span className="es-kv__label">Contract ID</span>
                <span className="es-kv__value mono">{contract.id}</span>
              </div>

              <div className="es-kv__row">
                <span className="es-kv__label">Lot</span>
                <span className="es-kv__value mono">
                  {contract.lotId ?? "—"}
                </span>
              </div>

              <div className="es-kv__row">
                <span className="es-kv__label">Passport</span>
                <span className="es-kv__value mono">
                  {contract.passportId ?? "—"}
                </span>
              </div>

              {!isCompact && (
                <div className="es-kv__row">
                  <span className="es-kv__label">Milestones</span>
                  <span className="es-kv__value">
                    {milestonesCount}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="escrow-status__section">
            <div className="escrow-status__section-title">Parties</div>

            <div className="es-kv">
              <div className="es-kv__row">
                <span className="es-kv__label">Buyer</span>
                <span className="es-kv__value">
                  {buyerName ?? <span className="muted">—</span>}
                </span>
              </div>

              <div className="es-kv__row">
                <span className="es-kv__label">Seller</span>
                <span className="es-kv__value">
                  {sellerName ?? <span className="muted">—</span>}
                </span>
              </div>

              {!isCompact && (
                <div className="es-kv__row">
                  <span className="es-kv__label">Destination</span>
                  <span className="es-kv__value">
                    {contract.destinationCountry ?? <span className="muted">—</span>}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="escrow-status__section">
            <div className="escrow-status__section-title">Commercial</div>

            <div className="es-kv">
              <div className="es-kv__row">
                <span className="es-kv__label">Product</span>
                <span className="es-kv__value">
                  {contract.productName ?? <span className="muted">—</span>}
                </span>
              </div>

              <div className="es-kv__row">
                <span className="es-kv__label">Quantity</span>
                <span className="es-kv__value">
                  {fmtKg(contract.quantityKg)}
                </span>
              </div>

              {!isCompact && (
                <div className="es-kv__row">
                  <span className="es-kv__label">Incoterms</span>
                  <span className="es-kv__value">
                    {contract.incoterms ?? <span className="muted">—</span>}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="escrow-status__section">
            <div className="escrow-status__section-title">Amount</div>

            <div className="es-kv">
              <div className="es-kv__row">
                <span className="es-kv__label">Gross</span>
                <span className="es-kv__value">
                  {fmtMoney(contract.amounts?.amount, contract.amounts?.currency)}
                </span>
              </div>

              {!isCompact && (
                <>
                  <div className="es-kv__row">
                    <span className="es-kv__label">Fee</span>
                    <span className="es-kv__value">
                      {fmtMoney(contract.amounts?.feeAmount, contract.amounts?.currency)}
                    </span>
                  </div>

                  <div className="es-kv__row">
                    <span className="es-kv__label">Net</span>
                    <span className="es-kv__value">
                      {fmtMoney(contract.amounts?.netAmount, contract.amounts?.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="escrow-status__section escrow-status__section--wide">
            <div className="escrow-status__section-title">Inspection</div>

            {!inspection ? (
              <div className="muted">
                Inspection details are not available for this contract.
              </div>
            ) : (
              <div className="escrow-status__inspection">
                <div className="escrow-status__inspection-row">
                  <span className="escrow-status__inspection-label">Required</span>
                  <span className="escrow-status__inspection-value">
                    {inspection.required === false ? "No" : "Yes"}
                  </span>
                </div>

                <div className="escrow-status__inspection-row">
                  <span className="escrow-status__inspection-label">Provider</span>
                  <span className="escrow-status__inspection-value">
                    {inspection.providerName ?? "—"}
                  </span>
                </div>

                <div className="escrow-status__inspection-row">
                  <span className="escrow-status__inspection-label">Location</span>
                  <span className="escrow-status__inspection-value">
                    {inspection.location ?? "—"}
                  </span>
                </div>

                <div className="escrow-status__inspection-row">
                  <span className="escrow-status__inspection-label">Result</span>
                  <span className="escrow-status__inspection-value">
                    {inspectionResult ? (
                      <Badge
                        variant={
                          inspectionResult === "passed"
                            ? "success"
                            : inspectionResult === "failed"
                            ? "danger"
                            : "warning"
                        }
                        size="sm"
                      >
                        {inspectionResult}
                      </Badge>
                    ) : (
                      <Badge variant="muted" size="sm">
                        pending
                      </Badge>
                    )}
                  </span>
                </div>

                {!isCompact && inspection.notes ? (
                  <div className="escrow-status__inspection-notes">
                    {inspection.notes}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      )}

      <style>
        {`
          .escrow-status{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .escrow-status__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .escrow-status__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .escrow-status__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .escrow-status__subtitle{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .escrow-status__head-right{
            display:flex;
            align-items: center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .escrow-status__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .escrow-status__empty{
            padding: var(--space-4);
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
            display:grid;
            gap: var(--space-2);
          }

          .escrow-status__empty-title{
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
          }

          .escrow-status__grid{
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-4);
            align-items: start;
          }

          .escrow-status__section{
            border: var(--border-1);
            background: var(--color-surface);
            border-radius: var(--radius-1);
            padding: var(--space-4);
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .escrow-status__section--wide{
            grid-column: 1 / -1;
          }

          .escrow-status__section-title{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .es-kv{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .es-kv__row{
            display:flex;
            justify-content: space-between;
            gap: var(--space-3);
            padding: 6px 0;
            border-bottom: 1px solid var(--color-border);
          }

          .es-kv__row:last-child{
            border-bottom: none;
          }

          .es-kv__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .es-kv__value{
            font-size: var(--fs-2);
            text-align: right;
          }

          .mono{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .escrow-status__inspection{
            display:grid;
            gap: 8px;
          }

          .escrow-status__inspection-row{
            display:flex;
            justify-content: space-between;
            gap: var(--space-3);
            padding: 6px 0;
            border-bottom: 1px solid var(--color-border);
          }

          .escrow-status__inspection-row:last-of-type{
            border-bottom: none;
          }

          .escrow-status__inspection-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .escrow-status__inspection-value{
            font-size: var(--fs-2);
            text-align: right;
          }

          .escrow-status__inspection-notes{
            border-top: 1px dashed var(--color-border);
            padding-top: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text-muted);
            line-height: 1.5;
          }

          .escrow-status--compact .escrow-status__grid{
            grid-template-columns: 1fr;
          }

          @media (max-width: 980px){
            .escrow-status__grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </Card>
  );
}