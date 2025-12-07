// agrotrust-az/src/features/rfq/components/RFQList.tsx

import type { ReactNode } from "react";

import type {
  RFQ,
  RFQFilter,
  RFQSort,
  RFQStatus,
  RFQPriority
} from "../types";

import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";

import { RFQCard } from "./RFQCard";
import { RFQFilters } from "./RFQFilters";

type RFQListLayout = "grid" | "list";

export type RFQListProps = {
  rfqs?: RFQ[];

  loading?: boolean;
  error?: string | null;

  className?: string;

  /**
   * Visual layout for cards
   */
  layout?: RFQListLayout;

  /**
   * Controls the card rendering density
   */
  cardVariant?: "default" | "compact";

  /**
   * Optional header copy
   */
  title?: string;
  subtitle?: string;

  headerActions?: ReactNode;

  /**
   * Filters (controlled)
   */
  filter?: RFQFilter;
  onFilterChange?: (next: RFQFilter) => void;

  /**
   * Sort (controlled)
   */
  sort?: RFQSort;
  onSortChange?: (next: RFQSort) => void;

  /**
   * If true (default), this component will apply
   * client-side filtering/sorting using the provided
   * filter/sort values.
   */
  applyClientSideQuerying?: boolean;

  /**
   * Toggle the built-in filter UI.
   */
  showFilters?: boolean;

  /**
   * If provided, append per-card actions
   * (e.g., "View offers", "Create contract").
   */
  renderCardActions?: (rfq: RFQ) => ReactNode;

  /**
   * Called when a card is clicked (outside buttons/links).
   */
  onSelect?: (rfq: RFQ) => void;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const DEFAULT_FILTER: RFQFilter = {
  text: "",
  status: "all",
  priority: "all",
  category: "all",
  country: "all",
  minTargetPrice: undefined,
  maxTargetPrice: undefined,
  currency: undefined
};

function normaliseFilter(f?: RFQFilter): RFQFilter {
  return { ...DEFAULT_FILTER, ...(f ?? {}) };
}

function safeLower(v: unknown) {
  return String(v ?? "").toLowerCase();
}

function matchesText(rfq: RFQ, text: string) {
  if (!text.trim()) return true;
  const q = safeLower(text);

  const hay = [
    rfq.id,
    rfq.title,
    rfq.description,
    rfq.buyer?.name,
    rfq.buyer?.organisation,
    rfq.buyer?.country,
    rfq.buyer?.city,
    ...(rfq.products ?? []).map((p) => p.name),
    ...(rfq.products ?? []).map((p) => p.category),
    ...(rfq.products ?? []).map((p) => p.variety)
  ]
    .filter(Boolean)
    .map((x) => safeLower(x));

  return hay.some((h) => h.includes(q));
}

function matchesStatus(rfq: RFQ, status?: RFQStatus | "all") {
  if (!status || status === "all") return true;
  return rfq.status === status;
}

function matchesPriority(rfq: RFQ, priority?: RFQPriority | "all") {
  if (!priority || priority === "all") return true;
  return (rfq.priority ?? "low") === priority;
}

function matchesCategory(rfq: RFQ, category?: string | "all") {
  if (!category || category === "all" || !String(category).trim()) return true;
  const c = safeLower(category);

  return (rfq.products ?? []).some((p) =>
    safeLower(p.category).includes(c) || safeLower(p.name).includes(c)
  );
}

function matchesCountry(rfq: RFQ, country?: string | "all") {
  if (!country || country === "all" || !String(country).trim()) return true;
  return safeLower(rfq.buyer?.country).includes(safeLower(country));
}

function matchesPriceBand(rfq: RFQ, min?: number, max?: number) {
  const t = rfq.terms?.targetUnitPrice;
  if (typeof t !== "number" || !Number.isFinite(t)) {
    // If no price is given, do not filter it out aggressively.
    return true;
  }
  if (typeof min === "number" && t < min) return false;
  if (typeof max === "number" && t > max) return false;
  return true;
}

function matchesCurrency(rfq: RFQ, currency?: string) {
  if (!currency) return true;
  return rfq.terms?.currency === currency;
}

function applyFilters(list: RFQ[], f: RFQFilter) {
  return list.filter((rfq) => {
    return (
      matchesText(rfq, f.text ?? "") &&
      matchesStatus(rfq, f.status) &&
      matchesPriority(rfq, f.priority) &&
      matchesCategory(rfq, f.category) &&
      matchesCountry(rfq, f.country) &&
      matchesPriceBand(rfq, f.minTargetPrice, f.maxTargetPrice) &&
      matchesCurrency(rfq, f.currency)
    );
  });
}

function toTime(iso?: string) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function toNum(v?: number) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function applySort(list: RFQ[], sort: RFQSort) {
  const copy = [...list];

  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt));
    case "deadline_asc":
      return copy.sort((a, b) => toTime(a.openUntil) - toTime(b.openUntil));
    case "deadline_desc":
      return copy.sort((a, b) => toTime(b.openUntil) - toTime(a.openUntil));
    case "price_asc":
      return copy.sort(
        (a, b) => toNum(a.terms?.targetUnitPrice) - toNum(b.terms?.targetUnitPrice)
      );
    case "price_desc":
      return copy.sort(
        (a, b) => toNum(b.terms?.targetUnitPrice) - toNum(a.terms?.targetUnitPrice)
      );
    case "priority":
      return copy.sort((a, b) => {
        const rank = (p?: RFQPriority) =>
          p === "high" ? 3 : p === "medium" ? 2 : 1;
        return rank(b.priority) - rank(a.priority);
      });
    case "newest":
    default:
      return copy.sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));
  }
}

export function RFQList({
  rfqs = [],
  loading = false,
  error = null,

  className,

  layout = "grid",
  cardVariant = "default",

  title = "RFQs",
  subtitle = "Buyer requests awaiting competitive offers",

  headerActions,

  filter,
  onFilterChange,

  sort = "newest",
  onSortChange,

  applyClientSideQuerying = true,
  showFilters = true,

  renderCardActions,
  onSelect
}: RFQListProps) {
  const f = normaliseFilter(filter);

  const queried = applyClientSideQuerying
    ? applySort(applyFilters(rfqs, f), sort)
    : rfqs;

  function handleClear() {
    onFilterChange?.({ ...DEFAULT_FILTER });
  }

  return (
    <Card
      variant="soft"
      className={cx("rfq-list", `rfq-list--${layout}`, className)}
    >
      <header className="rfq-list__head">
        <div className="rfq-list__head-left">
          <div className="rfq-list__label">Marketplace demand</div>
          <div className="rfq-list__title">{title}</div>
          <div className="muted rfq-list__subtitle">{subtitle}</div>
        </div>

        <div className="rfq-list__head-right">
          <Badge variant="outline" size="sm">
            {queried.length} result{queried.length === 1 ? "" : "s"}
          </Badge>

          {headerActions ? (
            <div className="rfq-list__head-actions">
              {headerActions}
            </div>
          ) : null}

          {showFilters && onFilterChange ? (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Reset filters
            </Button>
          ) : null}
        </div>
      </header>

      {showFilters && filter && onFilterChange ? (
        <div className="rfq-list__filters">
          <RFQFilters
            value={f}
            onChange={onFilterChange}
            sort={sort}
            onSortChange={onSortChange}
            compact={layout === "list"}
          />
        </div>
      ) : null}

      {loading ? (
        <div className="rfq-list__state">
          <Loading />
        </div>
      ) : error ? (
        <div className="rfq-list__state">
          <div className="rfq-list__state-title">
            Could not load RFQs
          </div>
          <div className="muted">{error}</div>
        </div>
      ) : queried.length === 0 ? (
        <div className="rfq-list__state">
          <div className="rfq-list__state-title">No RFQs found</div>
          <div className="muted">
            Adjust your filters or create a new RFQ in demo mode.
          </div>
        </div>
      ) : (
        <div
          className={cx(
            "rfq-list__content",
            layout === "grid" ? "rfq-list__content--grid" : "rfq-list__content--list"
          )}
        >
          {queried.map((rfq) => (
            <div
              key={rfq.id}
              className={cx(
                "rfq-list__item",
                onSelect && "rfq-list__item--clickable"
              )}
              onClick={
                onSelect
                  ? (e) => {
                      const target = e.target as HTMLElement | null;
                      if (target?.closest("a") || target?.closest("button")) {
                        return;
                      }
                      onSelect(rfq);
                    }
                  : undefined
              }
            >
              <RFQCard
                rfq={rfq}
                variant={cardVariant}
                actions={renderCardActions?.(rfq)}
              />
            </div>
          ))}
        </div>
      )}

      <style>
        {`
          .rfq-list{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .rfq-list__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .rfq-list__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .rfq-list__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .rfq-list__subtitle{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .rfq-list__head-right{
            display:flex;
            align-items: center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .rfq-list__head-actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .rfq-list__filters{
            display:grid;
            gap: var(--space-3);
          }

          .rfq-list__state{
            padding: var(--space-4);
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
            display:grid;
            gap: var(--space-2);
          }

          .rfq-list__state-title{
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
          }

          .rfq-list__content{
            display:grid;
            gap: var(--space-3);
          }

          .rfq-list__content--grid{
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .rfq-list__content--list{
            grid-template-columns: 1fr;
          }

          .rfq-list__item--clickable{
            cursor: pointer;
          }

          .rfq-list__item--clickable:hover{
            filter: brightness(1.02);
          }

          @media (max-width: 1100px){
            .rfq-list__content--grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </Card>
  );
}
