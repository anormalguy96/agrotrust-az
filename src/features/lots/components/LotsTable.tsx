// agrotrust-az/src/features/lots/components/LotsTable.tsx

import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import type { Lot, LotStatus } from "../types";

import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { ROUTES } from "@/app/config/routes";

type LotsTableVariant = "default" | "compact";

export type LotsTableProps = {
  lots?: Lot[];

  loading?: boolean;
  error?: string | null;

  variant?: LotsTableVariant;
  className?: string;

  /**
   * Optional header slot (e.g., add button group)
   */
  headerActions?: ReactNode;

  /**
   * If provided, clicking a row triggers this callback.
   * The "View details" button still works independently.
   */
  onRowClick?: (lot: Lot) => void;

  showOwner?: boolean;
  showRegion?: boolean;
  showPricing?: boolean;
  showPassport?: boolean;
  showActions?: boolean;
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

function formatUnitQuantity(lot: Lot) {
  return `${lot.inventory.quantity.toLocaleString()} ${lot.inventory.unit}`;
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

function buildLotDetailsPath(lotId: string) {
  const template = ROUTES.DASHBOARD.LOT_DETAILS;
  return template.includes(":lotId")
    ? template.replace(":lotId", encodeURIComponent(lotId))
    : `${ROUTES.DASHBOARD.LOTS}/${encodeURIComponent(lotId)}`;
}

/**
 * LotsTable
 *
 * A simple, dependency-safe table for the Lots dashboard.
 * We intentionally use a plain HTML table to avoid prop-shape
 * mismatches with any evolving shared Table abstraction.
 */
export function LotsTable({
  lots = [],
  loading = false,
  error = null,
  variant = "default",
  className,
  headerActions,
  onRowClick,
  showOwner = true,
  showRegion = true,
  showPricing = true,
  showPassport = true,
  showActions = true
}: LotsTableProps) {
  const compact = variant === "compact";

  return (
    <Card
      variant="soft"
      className={cx("lots-table", `lots-table--${variant}`, className)}
    >
      <header className="lots-table__head">
        <div className="lots-table__head-left">
          <div className="lots-table__label">Marketplace</div>
          <div className="lots-table__title">Lots</div>
          <div className="muted lots-table__subtitle">
            Export-ready batches listed by cooperatives
          </div>
        </div>

        <div className="lots-table__head-right">
          <Badge variant="outline" size="sm">
            {lots.length} lot{lots.length === 1 ? "" : "s"}
          </Badge>
          {headerActions ? (
            <div className="lots-table__head-actions">{headerActions}</div>
          ) : null}
        </div>
      </header>

      {loading ? (
        <div className="lots-table__state">
          <Loading />
        </div>
      ) : error ? (
        <div className="lots-table__state">
          <div className="lots-table__state-title">Could not load lots</div>
          <div className="muted">{error}</div>
        </div>
      ) : lots.length === 0 ? (
        <div className="lots-table__state">
          <div className="lots-table__state-title">No lots found</div>
          <div className="muted">
            Try adjusting filters or add a new lot in demo mode.
          </div>
        </div>
      ) : (
        <div className="lots-table__wrap">
          <table className="lots-table__table">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Product</th>
                {showOwner && !compact && <th>Cooperative</th>}
                {showRegion && <th>Region</th>}
                <th>Quantity</th>
                {showPricing && <th>Unit price</th>}
                {showPassport && !compact && <th>Passport</th>}
                <th>Status</th>
                {showActions && <th className="lots-table__th-actions">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {lots.map((lot) => {
                const tone = statusTone(lot.status);
                const detailsPath = buildLotDetailsPath(lot.id);

                const rowClickable = typeof onRowClick === "function";

                return (
                  <tr
                    key={lot.id}
                    className={cx(rowClickable && "lots-table__row-clickable")}
                    onClick={
                      rowClickable
                        ? (e) => {
                            // Avoid hijacking clicks on links/buttons
                            const target = e.target as HTMLElement | null;
                            if (
                              target?.closest("a") ||
                              target?.closest("button")
                            ) {
                              return;
                            }
                            onRowClick(lot);
                          }
                        : undefined
                    }
                  >
                    <td className="mono">
                      <NavLink className="lots-table__link" to={detailsPath}>
                        {lot.id}
                      </NavLink>
                    </td>

                    <td>
                      <div className="lots-table__product">
                        <span className="lots-table__product-name">
                          {lot.product.name}
                        </span>
                        {lot.product.variety && !compact ? (
                          <span className="muted lots-table__product-sub">
                            {lot.product.variety}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {showOwner && !compact && (
                      <td>{lot.owner.coopName}</td>
                    )}

                    {showRegion && (
                      <td>{lot.location?.region ?? "—"}</td>
                    )}

                    <td>{formatUnitQuantity(lot)}</td>

                    {showPricing && (
                      <td>
                        {formatMoney(
                          lot.pricing?.unitPrice,
                          lot.pricing?.currency
                        )}
                      </td>
                    )}

                    {showPassport && !compact && (
                      <td className="mono">
                        {lot.passportId ?? "—"}
                      </td>
                    )}

                    <td>
                      <Badge variant={tone as any} size="sm">
                        {statusLabel(lot.status)}
                      </Badge>
                    </td>

                    {showActions && (
                      <td className="lots-table__actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          to={ROUTES.DASHBOARD.LOTS}
                          title="Back to list"
                        >
                          List
                        </Button>
                        <Button
                          variant="soft"
                          size="sm"
                          to={detailsPath}
                          title="View lot details"
                        >
                          Details
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>
        {`
          .lots-table{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .lots-table__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .lots-table__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .lots-table__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .lots-table__subtitle{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .lots-table__head-right{
            display:flex;
            align-items: center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .lots-table__head-actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .lots-table__state{
            padding: var(--space-4);
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
            display:grid;
            gap: var(--space-2);
          }

          .lots-table__state-title{
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
          }

          .lots-table__wrap{
            overflow-x: auto;
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
          }

          .lots-table__table{
            width: 100%;
            border-collapse: collapse;
            min-width: 860px;
          }

          .lots-table--compact .lots-table__table{
            min-width: 720px;
          }

          thead th{
            text-align: left;
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            padding: 12px 14px;
            border-bottom: 1px solid var(--color-border);
            background: color-mix(in oklab, var(--color-elevated) 65%, transparent);
            position: sticky;
            top: 0;
            z-index: 1;
          }

          tbody td{
            padding: 12px 14px;
            border-bottom: 1px solid var(--color-border);
            vertical-align: top;
            font-size: var(--fs-2);
          }

          tbody tr:last-child td{
            border-bottom: none;
          }

          .lots-table__row-clickable{
            cursor: pointer;
          }

          .lots-table__row-clickable:hover td{
            background: var(--color-elevated);
          }

          .lots-table__product{
            display:flex;
            flex-direction: column;
            gap: 2px;
          }

          .lots-table__product-name{
            font-weight: var(--fw-medium);
          }

          .lots-table__product-sub{
            font-size: var(--fs-1);
          }

          .lots-table__link{
            text-decoration: none;
          }

          .lots-table__link:hover{
            text-decoration: underline;
          }

          .lots-table__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .lots-table__th-actions{
            min-width: 150px;
          }

          .mono{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          @media (max-width: 980px){
            .lots-table__table{
              min-width: 760px;
            }
          }
        `}
      </style>
    </Card>
  );
}