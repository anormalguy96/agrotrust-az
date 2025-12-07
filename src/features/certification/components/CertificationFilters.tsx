// agrotrust-az/src/features/certification/components/CertificationFilters.tsx

import type { ChangeEvent } from "react";

import type {
  CertificationFilter,
  CertificationSort,
  CertificationStatus
} from "../types";

import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";

export type CertificationFiltersProps = {
  value: CertificationFilter;
  onChange: (next: CertificationFilter) => void;

  sort?: CertificationSort;
  onSortChange?: (next: CertificationSort) => void;

  compact?: boolean;
  className?: string;
};

const STATUS_OPTIONS: Array<{ value: CertificationStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "claimed", label: "Claimed" },
  { value: "requested", label: "Requested" },
  { value: "pending_review", label: "Pending review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" }
];

const CODE_OPTIONS: Array<{ value: string | "all"; label: string }> = [
  { value: "all", label: "All standards" },
  { value: "GlobalG.A.P", label: "GlobalG.A.P" },
  { value: "Organic", label: "Organic" },
  { value: "HACCP", label: "HACCP" },
  { value: "ISO_22000", label: "ISO 22000" },
  { value: "Halal", label: "Halal" },
  { value: "Kosher", label: "Kosher" },
  { value: "Other", label: "Other / Custom" }
];

const SORT_OPTIONS: Array<{ value: CertificationSort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "status", label: "Status" },
  { value: "expires_asc", label: "Expiry: soonest" },
  { value: "expires_desc", label: "Expiry: latest" }
];

const DEFAULT_FILTER: CertificationFilter = {
  text: "",
  code: "all",
  status: "all",
  issuerName: "",
  expiringWithinDays: undefined,
  coopId: "",
  lotId: "",
  passportId: ""
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toNumberOrUndefined(v: string) {
  const n = Number(v);
  return Number.isFinite(n) && v.trim() !== "" ? n : undefined;
}

function countActiveFilters(f: CertificationFilter) {
  let c = 0;

  if (f.text && f.text.trim()) c++;
  if (f.code && f.code !== "all") c++;
  if (f.status && f.status !== "all") c++;
  if (f.issuerName && f.issuerName.trim()) c++;
  if (typeof f.expiringWithinDays === "number") c++;

  if (f.coopId && f.coopId.trim()) c++;
  if (f.lotId && f.lotId.trim()) c++;
  if (f.passportId && f.passportId.trim()) c++;

  return c;
}

/**
 * CertificationFilters
 *
 * MVP-friendly filter bar for certifications.
 * Uses plain HTML inputs to remain stable across evolving form abstractions.
 */
export function CertificationFilters({
  value,
  onChange,
  sort = "newest",
  onSortChange,
  compact = false,
  className
}: CertificationFiltersProps) {
  const activeCount = countActiveFilters(value);

  function patch(next: Partial<CertificationFilter>) {
    onChange({ ...value, ...next });
  }

  function handleText(e: ChangeEvent<HTMLInputElement>) {
    patch({ text: e.target.value });
  }

  function handleCode(e: ChangeEvent<HTMLSelectElement>) {
    patch({ code: e.target.value });
  }

  function handleStatus(e: ChangeEvent<HTMLSelectElement>) {
    patch({ status: e.target.value as any });
  }

  function handleIssuer(e: ChangeEvent<HTMLInputElement>) {
    patch({ issuerName: e.target.value });
  }

  function handleExpiring(e: ChangeEvent<HTMLInputElement>) {
    patch({ expiringWithinDays: toNumberOrUndefined(e.target.value) });
  }

  function handleCoop(e: ChangeEvent<HTMLInputElement>) {
    patch({ coopId: e.target.value });
  }

  function handleLot(e: ChangeEvent<HTMLInputElement>) {
    patch({ lotId: e.target.value });
  }

  function handlePassport(e: ChangeEvent<HTMLInputElement>) {
    patch({ passportId: e.target.value });
  }

  function handleSort(e: ChangeEvent<HTMLSelectElement>) {
    onSortChange?.(e.target.value as CertificationSort);
  }

  function clearAll() {
    onChange({ ...DEFAULT_FILTER });
  }

  return (
    <Card
      variant="soft"
      className={cx("cert-filters", compact && "cert-filters--compact", className)}
    >
      <div className="cert-filters__head">
        <div className="cert-filters__title">
          Filters
          {activeCount > 0 ? (
            <Badge variant="outline" size="sm">
              {activeCount} active
            </Badge>
          ) : null}
        </div>

        <div className="cert-filters__head-actions">
          {onSortChange ? (
            <label className="cert-filters__sort">
              <span className="cert-filters__sort-label">Sort</span>
              <select
                className="cert-filters__select"
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

      <div className="cert-filters__grid">
        <label className="cert-filters__field cert-filters__field--wide">
          <span className="cert-filters__label">Search</span>
          <input
            className="cert-filters__input"
            value={value.text ?? ""}
            onChange={handleText}
            placeholder="Cert ID, coop, standard, lot, passport..."
          />
        </label>

        <label className="cert-filters__field">
          <span className="cert-filters__label">Standard</span>
          <select
            className="cert-filters__select"
            value={value.code ?? "all"}
            onChange={handleCode}
          >
            {CODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="cert-filters__field">
          <span className="cert-filters__label">Status</span>
          <select
            className="cert-filters__select"
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

        <label className="cert-filters__field">
          <span className="cert-filters__label">Issuer</span>
          <input
            className="cert-filters__input"
            value={value.issuerName ?? ""}
            onChange={handleIssuer}
            placeholder="Demo Auditor..."
          />
        </label>

        <label className="cert-filters__field">
          <span className="cert-filters__label">Expiring within (days)</span>
          <input
            className="cert-filters__input"
            inputMode="numeric"
            value={value.expiringWithinDays ?? ""}
            onChange={handleExpiring}
            placeholder="e.g., 30"
          />
        </label>

        {!compact && (
          <>
            <label className="cert-filters__field">
              <span className="cert-filters__label">Coop ID</span>
              <input
                className="cert-filters__input"
                value={value.coopId ?? ""}
                onChange={handleCoop}
                placeholder="COOP-..."
              />
            </label>

            <label className="cert-filters__field">
              <span className="cert-filters__label">Lot ID</span>
              <input
                className="cert-filters__input"
                value={value.lotId ?? ""}
                onChange={handleLot}
                placeholder="LOT-..."
              />
            </label>

            <label className="cert-filters__field">
              <span className="cert-filters__label">Passport ID</span>
              <input
                className="cert-filters__input"
                value={value.passportId ?? ""}
                onChange={handlePassport}
                placeholder="PP-..."
              />
            </label>
          </>
        )}
      </div>

      <style>
        {`
          .cert-filters{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .cert-filters__head{
            display:flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .cert-filters__title{
            display:flex;
            align-items:center;
            gap: 8px;
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
          }

          .cert-filters__head-actions{
            display:flex;
            align-items:center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .cert-filters__sort{
            display:flex;
            align-items:center;
            gap: 8px;
          }

          .cert-filters__sort-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .cert-filters__grid{
            display:grid;
            grid-template-columns: 1.4fr 1fr 1fr 1fr;
            gap: var(--space-3);
          }

          .cert-filters__field{
            display:flex;
            flex-direction: column;
            gap: 6px;
          }

          .cert-filters__field--wide{
            grid-column: span 2;
          }

          .cert-filters--compact .cert-filters__grid{
            grid-template-columns: 1fr 1fr;
          }

          .cert-filters--compact .cert-filters__field--wide{
            grid-column: span 2;
          }

          .cert-filters__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .cert-filters__input,
          .cert-filters__select{
            height: 38px;
            border-radius: 10px;
            border: 1px solid var(--color-border);
            background: var(--color-surface);
            color: var(--color-text);
            padding: 0 10px;
            font-size: var(--fs-2);
            outline: none;
          }

          .cert-filters__input::placeholder{
            color: var(--color-text-muted);
          }

          .cert-filters__input:focus,
          .cert-filters__select:focus{
            border-color: color-mix(in oklab, var(--color-primary) 40%, var(--color-border));
            box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 18%, transparent);
          }

          @media (max-width: 1100px){
            .cert-filters__grid{
              grid-template-columns: 1fr 1fr 1fr;
            }
            .cert-filters__field--wide{
              grid-column: span 2;
            }
          }

          @media (max-width: 820px){
            .cert-filters__grid{
              grid-template-columns: 1fr 1fr;
            }
            .cert-filters__field--wide{
              grid-column: span 2;
            }
          }

          @media (max-width: 520px){
            .cert-filters__grid{
              grid-template-columns: 1fr;
            }
            .cert-filters__field--wide{
              grid-column: span 1;
            }
          }
        `}
      </style>
    </Card>
  );
}