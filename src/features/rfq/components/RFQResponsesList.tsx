// agrotrust-az/src/features/rfq/components/RFQResponsesList.tsx

import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import type { RFQResponse, RFQResponseStatus } from "../types";

import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { ROUTES } from "@/app/config/routes";

type RFQResponsesListVariant = "default" | "compact";

export type RFQResponsesListProps = {
  responses?: RFQResponse[];

  loading?: boolean;
  error?: string | null;

  variant?: RFQResponsesListVariant;
  className?: string;

  headerTitle?: string;
  headerSubtitle?: string;

  /**
   * Optional header action slot
   * e.g., "Invite co-ops", "Export CSV (demo)".
   */
  headerActions?: ReactNode;

  /**
   * Row action slot factory
   * Allows page-specific controls per response.
   */
  renderActions?: (response: RFQResponse) => ReactNode;

  /**
   * If provided, clicking the item body triggers this callback.
   */
  onSelect?: (response: RFQResponse) => void;

  showLinks?: boolean;
  showMessage?: boolean;
  showAttachmentsHint?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function statusTone(status: RFQResponseStatus) {
  switch (status) {
    case "submitted":
    case "updated":
      return "info";
    case "shortlisted":
      return "warning";
    case "accepted":
      return "success";
    case "rejected":
    case "withdrawn":
      return "danger";
    default:
      return "muted";
  }
}

function statusLabel(status: RFQResponseStatus) {
  return status.replace(/_/g, " ");
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

function formatQty(value?: number, unit?: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString()} ${unit ?? "kg"}`;
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

function buildLotDetailsPath(lotId: string) {
  const template = ROUTES.DASHBOARD.LOT_DETAILS;
  return template.includes(":lotId")
    ? template.replace(":lotId", encodeURIComponent(lotId))
    : `${ROUTES.DASHBOARD.LOTS}/${encodeURIComponent(lotId)}`;
}

/**
 * RFQResponsesList
 *
 * Displays cooperative offers for an RFQ.
 * Designed for:
 * - RFQ detail view (later)
 * - Contracts page side panel
 * - Dashboard overview widgets
 *
 * Uses a simple list layout for hackathon stability.
 */
export function RFQResponsesList({
  responses = [],
  loading = false,
  error = null,
  variant = "default",
  className,
  headerTitle = "Offers",
  headerSubtitle = "Responses submitted by cooperatives",
  headerActions,
  renderActions,
  onSelect,
  showLinks = true,
  showMessage = true,
  showAttachmentsHint = true
}: RFQResponsesListProps) {
  const compact = variant === "compact";

  return (
    <Card
      variant="soft"
      className={cx("rfq-responses", `rfq-responses--${variant}`, className)}
    >
      <header className="rfq-responses__head">
        <div className="rfq-responses__head-left">
          <div className="rfq-responses__label">RFQ module</div>
          <div className="rfq-responses__title">{headerTitle}</div>
          <div className="muted rfq-responses__subtitle">
            {headerSubtitle}
          </div>
        </div>

        <div className="rfq-responses__head-right">
          <Badge variant="outline" size="sm">
            {responses.length} response{responses.length === 1 ? "" : "s"}
          </Badge>
          {headerActions ? (
            <div className="rfq-responses__head-actions">
              {headerActions}
            </div>
          ) : null}
        </div>
      </header>

      {loading ? (
        <div className="rfq-responses__state">
          <Loading />
        </div>
      ) : error ? (
        <div className="rfq-responses__state">
          <div className="rfq-responses__state-title">
            Could not load responses
          </div>
          <div className="muted">{error}</div>
        </div>
      ) : responses.length === 0 ? (
        <div className="rfq-responses__state">
          <div className="rfq-responses__state-title">
            No offers yet
          </div>
          <div className="muted">
            In a live system, cooperatives would receive notifications and submit
            offers linked to lots and passports.
          </div>
        </div>
      ) : (
        <ul className="rfq-responses__list">
          {responses.map((r) => {
            const tone = statusTone(r.status);
            const clickable = typeof onSelect === "function";

            const hasLot = Boolean(r.proposedLotId);
            const hasPassport = Boolean(r.proposedPassportId);
            const hasMsg = Boolean(r.message && r.message.trim());

            return (
              <li
                key={r.id}
                className={cx(
                  "rfq-responses__item",
                  clickable && "rfq-responses__item--clickable"
                )}
                onClick={
                  clickable
                    ? (e) => {
                        const target = e.target as HTMLElement | null;
                        if (
                          target?.closest("a") ||
                          target?.closest("button")
                        ) {
                          return;
                        }
                        onSelect(r);
                      }
                    : undefined
                }
              >
                <div className="rfq-responses__item-head">
                  <div className="rfq-responses__coop">
                    <div className="rfq-responses__coop-name">
                      {r.cooperative.name}
                    </div>
                    {!compact && r.cooperative.region ? (
                      <div className="muted rfq-responses__coop-region">
                        {r.cooperative.region}
                      </div>
                    ) : null}
                  </div>

                  <div className="rfq-responses__badges">
                    <Badge variant={tone as any} size="sm">
                      {statusLabel(r.status)}
                    </Badge>
                    {!compact && r.cooperative.verified ? (
                      <Badge variant="success" size="sm">
                        verified
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="rfq-responses__item-body">
                  <div className="rfq-responses__kv">
                    <div className="rfq-responses__kv-row">
                      <span className="rfq-responses__kv-label">Price</span>
                      <span className="rfq-responses__kv-value">
                        {formatMoney(r.proposedUnitPrice, r.proposedCurrency)}
                      </span>
                    </div>

                    <div className="rfq-responses__kv-row">
                      <span className="rfq-responses__kv-label">Quantity</span>
                      <span className="rfq-responses__kv-value">
                        {formatQty(r.proposedQuantity, r.proposedUnit)}
                      </span>
                    </div>

                    {!compact && (
                      <div className="rfq-responses__kv-row">
                        <span className="rfq-responses__kv-label">Submitted</span>
                        <span className="rfq-responses__kv-value">
                          {formatDate(r.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {showMessage && (hasMsg || !compact) ? (
                    <div className="rfq-responses__message">
                      <div className="rfq-responses__message-label">
                        Offer note
                      </div>
                      <div className={cx("rfq-responses__message-text", !hasMsg && "muted")}>
                        {hasMsg
                          ? r.message
                          : "No message provided for this offer."}
                      </div>
                    </div>
                  ) : null}
                </div>

                {(showLinks || renderActions) && (
                  <div className="rfq-responses__item-foot">
                    <div className="rfq-responses__links">
                      {showLinks && (
                        <>
                          <span className="rfq-responses__link-group">
                            <span className="rfq-responses__link-label">
                              Lot
                            </span>
                            {hasLot ? (
                              <NavLink
                                to={buildLotDetailsPath(String(r.proposedLotId))}
                                className="rfq-responses__link mono"
                              >
                                {r.proposedLotId}
                              </NavLink>
                            ) : (
                              <span className="muted mono">—</span>
                            )}
                          </span>

                          <span className="rfq-responses__link-group">
                            <span className="rfq-responses__link-label">
                              Passport
                            </span>
                            {hasPassport ? (
                              <span className="mono">
                                {r.proposedPassportId}
                              </span>
                            ) : (
                              <span className="muted mono">—</span>
                            )}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="rfq-responses__actions">
                      {renderActions ? (
                        renderActions(r)
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" type="button" disabled>
                            Shortlist
                          </Button>
                          <Button variant="soft" size="sm" type="button" disabled>
                            Create contract
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {showAttachmentsHint && !compact ? (
                  <div className="rfq-responses__attachments muted">
                    {r.attachments && r.attachments.length > 0
                      ? `${r.attachments.length} attachment${r.attachments.length === 1 ? "" : "s"} provided`
                      : "No attachments provided"}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <style>
        {`
          .rfq-responses{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .rfq-responses__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .rfq-responses__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .rfq-responses__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .rfq-responses__subtitle{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .rfq-responses__head-right{
            display:flex;
            align-items: center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .rfq-responses__head-actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .rfq-responses__state{
            padding: var(--space-4);
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
            display:grid;
            gap: var(--space-2);
          }

          .rfq-responses__state-title{
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
          }

          .rfq-responses__list{
            list-style: none;
            padding: 0;
            margin: 0;
            display:grid;
            gap: var(--space-3);
          }

          .rfq-responses__item{
            border: var(--border-1);
            background: var(--color-surface);
            border-radius: var(--radius-1);
            padding: var(--space-4);
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .rfq-responses__item--clickable{
            cursor: pointer;
          }

          .rfq-responses__item--clickable:hover{
            background: var(--color-elevated);
          }

          .rfq-responses__item-head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .rfq-responses__coop-name{
            font-size: var(--fs-3);
            font-weight: var(--fw-medium);
          }

          .rfq-responses__coop-region{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .rfq-responses__badges{
            display:flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .rfq-responses__item-body{
            display:grid;
            grid-template-columns: 1fr 1.2fr;
            gap: var(--space-4);
            align-items: start;
          }

          .rfq-responses--compact .rfq-responses__item-body{
            grid-template-columns: 1fr;
          }

          .rfq-responses__kv{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .rfq-responses__kv-row{
            display:flex;
            justify-content: space-between;
            gap: var(--space-3);
            padding: 6px 0;
            border-bottom: 1px solid var(--color-border);
          }

          .rfq-responses__kv-row:last-child{
            border-bottom: none;
          }

          .rfq-responses__kv-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .rfq-responses__kv-value{
            font-size: var(--fs-2);
            text-align: right;
          }

          .rfq-responses__message{
            border-left: 3px solid var(--color-border);
            padding-left: var(--space-3);
            display:flex;
            flex-direction: column;
            gap: 6px;
          }

          .rfq-responses__message-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .rfq-responses__message-text{
            font-size: var(--fs-2);
            line-height: 1.5;
          }

          .rfq-responses__item-foot{
            display:flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
            padding-top: var(--space-2);
            border-top: 1px dashed var(--color-border);
          }

          .rfq-responses__links{
            display:flex;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .rfq-responses__link-group{
            display:flex;
            align-items: center;
            gap: 6px;
          }

          .rfq-responses__link-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .rfq-responses__link{
            text-decoration: none;
          }

          .rfq-responses__link:hover{
            text-decoration: underline;
          }

          .rfq-responses__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .rfq-responses__attachments{
            font-size: var(--fs-1);
          }

          .mono{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          @media (max-width: 980px){
            .rfq-responses__item-body{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </Card>
  );
}