// agrotrust-az/src/features/rfq/components/RFQFilters.tsx

import type { ChangeEvent } from "react";

import type {
  RFQFilter,
  RFQSort,
  RFQStatus,
  RFQPriority
} from "../types";

import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";

export type RFQFiltersProps = {
  value: RFQFilter;
  onChange: (next: RFQFilter) => void;

  sort?: RFQSort;
  onSortChange?: (next: RFQSort) => void;

  compact?: boolean;
  className?: string;
};

const STATUS_OPTIONS: Array<{ value: RFQStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "shortlisting", label: "Shortlisting" },
  { value: "negotiation", label: "Negotiation" },
  { value: "awarded", label: "Awarded" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" }
];

const PRIORITY_OPTIONS: Array<{ value: RFQPriority | "all"; label: string }> = [
  { value: "all", label: "All priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" }
];

const SORT_OPTIONS: Array<{ value: RFQSort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "deadline_asc", label: "Deadline: soonest" },
  { value: "deadline_desc", label: "Deadline: latest" },
  { value: "price_asc", label: "Target price: low to high" },
  { value: "price_desc", label: "Target price: high to low" },
  { value: "priority", label: "Priority" }
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "AZN", label: "AZN" }
] as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toNumberOrUndefined(v: string) {
  const n = Number(v);
  return Number.isFinite(n) && v.trim() !== "" ? n : undefined;
}

function countActiveFilters(f: RFQFilter) {
  let c = 0;
  if (f.text && f.text.trim()) c++;
  if (f.status && f.status !== "all") c++;
  if (f.priority && f.priority !== "all") c++;
  if (f.category && f.category !== "all" && String(f.category).trim()) c++;
  if (f.country && f.country !== "all" && String(f.country).trim()) c++;
  if (typeof f.minTargetPrice === "number") c++;
  if (typeof f.maxTargetPrice === "number") c++;
  if (f.currency) c++;
  return c;
}

/**
 * RFQFilters
 *
 * Simple filter bar for RFQ pages.
 * Uses plain HTML inputs to keep the MVP stable and avoid
 * prop-shape mismatches with evolving form components.
 */
export function RFQFilters({
  value,
  onChange,
  sort = "newest",
  onSortChange,
  compact = false,
  className
}: RFQFiltersProps) {
  const activeCount = countActiveFilters(value);

  function patch(next: Partial<RFQFilter>) {
    onChange({ ...value, ...next });
  }

  function handleText(e: ChangeEvent<HTMLInputElement>) {
    patch({ text: e.target.value });
  }

  function handleStatus(e: ChangeEvent<HTMLSelectElement>) {
    patch({ status: e.target.value as any });
  }

  function handlePriority(e: ChangeEvent<HTMLSelectElement>) {
    patch({ priority: e.target.value as any });
  }

  function handleCategory(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    patch({ category: v ? v : "all" });
  }

  function handleCountry(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    patch({ country: v ? v : "all" });
  }

  function handleMinPrice(e: ChangeEvent<HTMLInputElement>) {
    patch({ minTargetPrice: toNumberOrUndefined(e.target.value) });
  }

  function handleMaxPrice(e: ChangeEvent<HTMLInputElement>) {
    patch({ maxTargetPrice: toNumberOrUndefined(e.target.value) });
  }

  function handleCurrency(e: ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    patch({ currency: v ? (v as any) : undefined });
  }

  function handleSort(e: ChangeEvent<HTMLSelectElement>) {
    onSortChange?.(e.target.value as RFQSort);
  }

  function clearAll() {
    onChange({
      text: "",
      status: "all",
      priority: "all",
      category: "all",
      country: "all",
      minTargetPrice: undefined,
      maxTargetPrice: undefined,
      currency: undefined
    });
  }

  return (
    <Card
      variant="soft"
      className={cx("rfq-filters", compact && "rfq-filters--compact", className)}
    >
      <div className="rfq-filters__head">
        <div className="rfq-filters__title">
          Filters
          {activeCount > 0 ? (
            <Badge variant="outline" size="sm">
              {activeCount} active
            </Badge>
          ) : null}
        </div>

        <div className="rfq-filters__head-actions">
          {onSortChange ? (
            <label className="rfq-filters__sort">
              <span className="rfq-filters__sort-label">Sort</span>
              <select
                className="rfq-filters__select"
                value={sort}
                onChange={handleSort}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </div>

      <div className="rfq-filters__grid">
        <label className="rfq-filters__field">
          <span className="rfq-filters__label">Search</span>
          <input
            className="rfq-filters__input"
            value={value.text ?? ""}
            onChange={handleText}
            placeholder="RFQ ID, title, buyer, product..."
          />
        </label>

        <label className="rfq-filters__field">
          <span className="rfq-filters__label">Status</span>
          <select
            className="rfq-filters__select"
            value={value.status ?? "all"}
            onChange={handleStatus}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="rfq-filters__field">
          <span className="rfq-filters__label">Priority</span>
          <select
            className="rfq-filters__select"
            value={value.priority ?? "all"}
            onChange={handlePriority}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="rfq-filters__field">
          <span className="rfq-filters__label">Category</span>
          <input
            className="rfq-filters__input"
            value={value.category && value.category !== "all" ? String(value.category) : ""}
            onChange={handleCategory}
            placeholder="Tomato, hazelnut..."
          />
        </label>

        <label className="rfq-filters__field">
          <span className="rfq-filters__label">Country</span>
          <input
            className="rfq-filters__input"
            value={value.country && value.country !== "all" ? String(value.country) : ""}
            onChange={handleCountry}
            placeholder="UAE, Germany..."
          />
        </label>

        <label className="rfq-filters__field">
          <span className="rfq-filters__label">Currency</span>
          <select
            className="rfq-filters__select"
            value={value.currency ?? ""}
            onChange={handleCurrency}
          >
            <option value="">Any</option>
            {CURRENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="rfq-filters__field">
          <span className="rfq-filters__label">Min target price</span>
          <input
            className="rfq-filters__input"
            inputMode="decimal"
            value={value.minTargetPrice ?? ""}
            onChange={handleMinPrice}
            placeholder="e.g., 0.8"
          />
        </label>

        <label className="rfq-filters__field">
          <span className="rfq-filters__label">Max target price</span>
          <input
            className="rfq-filters__input"
            inputMode="decimal"
            value={value.maxTargetPrice ?? ""}
            onChange={handleMaxPrice}
            placeholder="e.g., 6.5"
          />
        </label>
      </div>

      <style>
        {`
          .rfq-filters{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .rfq-filters__head{
            display:flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .rfq-filters__title{
            display:flex;
            align-items:center;
            gap: 8px;
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
          }

          .rfq-filters__head-actions{
            display:flex;
            align-items:center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .rfq-filters__sort{
            display:flex;
            align-items:center;
            gap: 8px;
          }

          .rfq-filters__sort-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .rfq-filters__grid{
            display:grid;
            grid-template-columns: 1.4fr 1fr 1fr 1fr;
            gap: var(--space-3);
          }

          .rfq-filters--compact .rfq-filters__grid{
            grid-template-columns: 1fr 1fr;
          }

          .rfq-filters__field{
            display:flex;
            flex-direction: column;
            gap: 6px;
          }

          .rfq-filters__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .rfq-filters__input,
          .rfq-filters__select{
            height: 38px;
            border-radius: 10px;
            border: 1px solid var(--color-border);
            background: var(--color-surface);
            color: var(--color-text);
            padding: 0 10px;
            font-size: var(--fs-2);
            outline: none;
          }

          .rfq-filters__input::placeholder{
            color: var(--color-text-muted);
          }

          .rfq-filters__input:focus,
          .rfq-filters__select:focus{
            border-color: color-mix(in oklab, var(--color-primary) 40%, var(--color-border));
            box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent);
          }

          @media (max-width: 1100px){
            .rfq-filters__grid{
              grid-template-columns: 1fr 1fr 1fr;
            }
          }

          @media (max-width: 820px){
            .rfq-filters__grid{
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 520px){
            .rfq-filters__grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </Card>
  );
}