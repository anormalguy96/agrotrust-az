// agrotrust-az/src/features/lots/components/LotFilters.tsx

import type { ChangeEvent } from "react";

import type { LotFilter, LotSort, ProduceCategory, LotStatus } from "../types";

import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";

export type LotFiltersProps = {
  value: LotFilter;
  onChange: (next: LotFilter) => void;

  sort?: LotSort;
  onSortChange?: (next: LotSort) => void;

  /**
   * Optional flags for compact layout
   */
  compact?: boolean;
  className?: string;
};

const CATEGORY_OPTIONS: Array<{ value: ProduceCategory | "all"; label: string }> = [
  { value: "all", label: "All produce" },
  { value: "tomato", label: "Tomato" },
  { value: "hazelnut", label: "Hazelnut" },
  { value: "persimmon", label: "Persimmon" },
  { value: "pomegranate", label: "Pomegranate" },
  { value: "grape", label: "Grape" },
  { value: "apple", label: "Apple" },
  { value: "other", label: "Other" }
];

const STATUS_OPTIONS: Array<{ value: LotStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "listed", label: "Listed" },
  { value: "reserved", label: "Reserved" },
  { value: "in_negotiation", label: "In negotiation" },
  { value: "sold", label: "Sold" },
  { value: "archived", label: "Archived" }
];

const CERT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All certifications" },
  { value: "GlobalG.A.P", label: "GlobalG.A.P" },
  { value: "Organic", label: "Organic" },
  { value: "HACCP", label: "HACCP" },
  { value: "ISO_22000", label: "ISO 22000" },
  { value: "Halal", label: "Halal" },
  { value: "Kosher", label: "Kosher" }
];

const SORT_OPTIONS: Array<{ value: LotSort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "quantity_desc", label: "Quantity: high to low" }
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

function countActiveFilters(f: LotFilter) {
  let c = 0;
  if (f.text && f.text.trim()) c++;
  if (f.category && f.category !== "all") c++;
  if (f.status && f.status !== "all") c++;
  if (f.region && f.region !== "all" && f.region.trim()) c++;
  if (f.certification && f.certification !== "all") c++;
  if (typeof f.minPrice === "number") c++;
  if (typeof f.maxPrice === "number") c++;
  if (f.currency) c++;
  return c;
}

/**
 * LotFilters
 *
 * A lightweight, dependency-safe filter bar for the Lots dashboard page.
 * Uses plain inputs to avoid prop-mismatch risk across custom form components.
 */
export function LotFilters({
  value,
  onChange,
  sort = "newest",
  onSortChange,
  compact = false,
  className
}: LotFiltersProps) {
  const activeCount = countActiveFilters(value);

  function patch(next: Partial<LotFilter>) {
    onChange({ ...value, ...next });
  }

  function handleText(e: ChangeEvent<HTMLInputElement>) {
    patch({ text: e.target.value });
  }

  function handleCategory(e: ChangeEvent<HTMLSelectElement>) {
    patch({ category: e.target.value as any });
  }

  function handleStatus(e: ChangeEvent<HTMLSelectElement>) {
    patch({ status: e.target.value as any });
  }

  function handleRegion(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    patch({ region: v ? v : "all" });
  }

  function handleCert(e: ChangeEvent<HTMLSelectElement>) {
    patch({ certification: e.target.value });
  }

  function handleMinPrice(e: ChangeEvent<HTMLInputElement>) {
    patch({ minPrice: toNumberOrUndefined(e.target.value) });
  }

  function handleMaxPrice(e: ChangeEvent<HTMLInputElement>) {
    patch({ maxPrice: toNumberOrUndefined(e.target.value) });
  }

  function handleCurrency(e: ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    patch({ currency: v ? (v as any) : undefined });
  }

  function clearAll() {
    onChange({
      text: "",
      category: "all",
      status: "all",
      region: "all",
      certification: "all",
      minPrice: undefined,
      maxPrice: undefined,
      currency: undefined
    });
  }

  function handleSort(e: ChangeEvent<HTMLSelectElement>) {
    onSortChange?.(e.target.value as LotSort);
  }

  return (
    <Card
      variant="soft"
      className={cx("lot-filters", compact && "lot-filters--compact", className)}
    >
      <div className="lot-filters__head">
        <div className="lot-filters__title">
          Filters
          {activeCount > 0 ? (
            <Badge variant="outline" size="sm">
              {activeCount} active
            </Badge>
          ) : null}
        </div>

        <div className="lot-filters__head-actions">
          {onSortChange ? (
            <label className="lot-filters__sort">
              <span className="lot-filters__sort-label">Sort</span>
              <select
                className="lot-filters__select"
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

      <div className="lot-filters__grid">
        <label className="lot-filters__field">
          <span className="lot-filters__label">Search</span>
          <input
            className="lot-filters__input"
            value={value.text ?? ""}
            onChange={handleText}
            placeholder="Lot ID, coop, product, region..."
          />
        </label>

        <label className="lot-filters__field">
          <span className="lot-filters__label">Category</span>
          <select
            className="lot-filters__select"
            value={value.category ?? "all"}
            onChange={handleCategory}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="lot-filters__field">
          <span className="lot-filters__label">Status</span>
          <select
            className="lot-filters__select"
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

        <label className="lot-filters__field">
          <span className="lot-filters__label">Region</span>
          <input
            className="lot-filters__input"
            value={value.region && value.region !== "all" ? value.region : ""}
            onChange={handleRegion}
            placeholder="Masalli, Lankaran, Ganja..."
          />
        </label>

        <label className="lot-filters__field">
          <span className="lot-filters__label">Certification</span>
          <select
            className="lot-filters__select"
            value={value.certification ?? "all"}
            onChange={handleCert}
          >
            {CERT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="lot-filters__field">
          <span className="lot-filters__label">Currency</span>
          <select
            className="lot-filters__select"
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

        <label className="lot-filters__field">
          <span className="lot-filters__label">Min unit price</span>
          <input
            className="lot-filters__input"
            inputMode="decimal"
            value={value.minPrice ?? ""}
            onChange={handleMinPrice}
            placeholder="e.g., 0.8"
          />
        </label>

        <label className="lot-filters__field">
          <span className="lot-filters__label">Max unit price</span>
          <input
            className="lot-filters__input"
            inputMode="decimal"
            value={value.maxPrice ?? ""}
            onChange={handleMaxPrice}
            placeholder="e.g., 6.5"
          />
        </label>
      </div>

      <style>
        {`
          .lot-filters{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .lot-filters__head{
            display:flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .lot-filters__title{
            display:flex;
            align-items:center;
            gap: 8px;
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
          }

          .lot-filters__head-actions{
            display:flex;
            align-items:center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .lot-filters__sort{
            display:flex;
            align-items:center;
            gap: 8px;
          }

          .lot-filters__sort-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .lot-filters__grid{
            display:grid;
            grid-template-columns: 1.4fr 1fr 1fr 1fr;
            gap: var(--space-3);
          }

          .lot-filters--compact .lot-filters__grid{
            grid-template-columns: 1fr 1fr;
          }

          .lot-filters__field{
            display:flex;
            flex-direction: column;
            gap: 6px;
          }

          .lot-filters__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .lot-filters__input,
          .lot-filters__select{
            height: 38px;
            border-radius: 10px;
            border: 1px solid var(--color-border);
            background: var(--color-surface);
            color: var(--color-text);
            padding: 0 10px;
            font-size: var(--fs-2);
            outline: none;
          }

          .lot-filters__input::placeholder{
            color: var(--color-text-muted);
          }

          .lot-filters__input:focus,
          .lot-filters__select:focus{
            border-color: color-mix(in oklab, var(--color-primary) 40%, var(--color-border));
            box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent);
          }

          @media (max-width: 1100px){
            .lot-filters__grid{
              grid-template-columns: 1fr 1fr 1fr;
            }
          }

          @media (max-width: 820px){
            .lot-filters__grid{
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 520px){
            .lot-filters__grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </Card>
  );
}