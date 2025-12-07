// agrotrust-az/src/features/certification/components/CertificationList.tsx

import type { ReactNode } from "react";

import type {
  CertificationRecord,
  CertificationSummary,
  CertificationFilter,
  CertificationSort,
  CertificationStatus
} from "../types";

import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";

import { CertificationCard } from "./CertificationCard";
import { CertificationFilters } from "./CertificationFilters";

type CertificationItem = CertificationRecord | CertificationSummary;

type CertificationListLayout = "grid" | "list";

export type CertificationListProps = {
  certifications?: CertificationItem[];

  loading?: boolean;
  error?: string | null;

  className?: string;

  layout?: CertificationListLayout;
  cardVariant?: "default" | "compact";

  title?: string;
  subtitle?: string;

  headerActions?: ReactNode;

  /**
   * Filters (controlled)
   */
  filter?: CertificationFilter;
  onFilterChange?: (next: CertificationFilter) => void;

  /**
   * Sort (controlled)
   */
  sort?: CertificationSort;
  onSortChange?: (next: CertificationSort) => void;

  /**
   * Apply client-side filtering/sorting inside this component.
   */
  applyClientSideQuerying?: boolean;

  /**
   * Toggle the built-in filter UI.
   */
  showFilters?: boolean;

  /**
   * If provided, append per-card actions.
   */
  renderCardActions?: (cert: CertificationItem) => ReactNode;

  /**
   * Called when a card wrapper is clicked (outside buttons/links).
   */
  onSelect?: (cert: CertificationItem) => void;
};

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

function safeLower(v: unknown) {
  return String(v ?? "").toLowerCase();
}

function isRecord(item: CertificationItem): item is CertificationRecord {
  return Boolean((item as CertificationRecord).standard);
}

function getCode(item: CertificationItem) {
  return isRecord(item)
    ? String(item.standard.code)
    : String((item as CertificationSummary).code);
}

function getLabel(item: CertificationItem) {
  return isRecord(item)
    ? item.standard.label
    : (item as CertificationSummary).label;
}

function getStatus(item: CertificationItem): CertificationStatus {
  return isRecord(item)
    ? item.status
    : (item as CertificationSummary).status;
}

function getIssuerName(item: CertificationItem) {
  return isRecord(item)
    ? item.issuer?.name
    : (item as CertificationSummary).issuerName;
}

function getCoopName(item: CertificationItem) {
  return isRecord(item)
    ? item.applicant?.coopName
    : (item as CertificationSummary).coopName;
}

function getLotId(item: CertificationItem) {
  return isRecord(item)
    ? item.scope?.lotId
    : (item as CertificationSummary).lotId;
}

function getPassportId(item: CertificationItem) {
  return isRecord(item)
    ? item.scope?.passportId
    : (item as CertificationSummary).passportId;
}

function getCreatedAt(item: CertificationItem) {
  return isRecord(item)
    ? item.createdAt
    : (item as CertificationSummary).createdAt;
}

function getExpiresAt(item: CertificationItem) {
  return isRecord(item)
    ? item.expiresAt
    : (item as CertificationSummary).expiresAt;
}

function toTime(iso?: string) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function daysTo(iso?: string) {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return undefined;
  return Math.round((t - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Filtering
 */

function matchesText(item: CertificationItem, text: string) {
  if (!text.trim()) return true;
  const q = safeLower(text);

  const hay = [
    (item as any).id,
    getCode(item),
    getLabel(item),
    getCoopName(item),
    getIssuerName(item),
    getLotId(item),
    getPassportId(item),
    isRecord(item) ? item.notes : undefined
  ]
    .filter(Boolean)
    .map((x) => safeLower(x));

  return hay.some((h) => h.includes(q));
}

function matchesCode(item: CertificationItem, code?: string | "all") {
  if (!code || code === "all") return true;
  return safeLower(getCode(item)) === safeLower(code);
}

function matchesStatus(item: CertificationItem, status?: CertificationStatus | "all") {
  if (!status || status === "all") return true;
  return getStatus(item) === status;
}

function matchesIssuer(item: CertificationItem, issuerName?: string) {
  if (!issuerName || !issuerName.trim()) return true;
  return safeLower(getIssuerName(item)).includes(safeLower(issuerName));
}

function matchesScopedIds(item: CertificationItem, f: CertificationFilter) {
  if (f.coopId && f.coopId.trim()) {
    const name = getCoopName(item);
    const anyId = isRecord(item) ? item.scope?.coopId : undefined;
    const hay = [name, anyId].filter(Boolean).map((v) => safeLower(v));
    if (!hay.some((h) => h.includes(safeLower(f.coopId)))) return false;
  }

  if (f.lotId && f.lotId.trim()) {
    if (!safeLower(getLotId(item)).includes(safeLower(f.lotId))) return false;
  }

  if (f.passportId && f.passportId.trim()) {
    if (!safeLower(getPassportId(item)).includes(safeLower(f.passportId))) return false;
  }

  return true;
}

function matchesExpiring(item: CertificationItem, withinDays?: number) {
  if (typeof withinDays !== "number") return true;
  const d = daysTo(getExpiresAt(item));
  if (typeof d !== "number") return false;
  return d <= withinDays;
}

function applyFilters(list: CertificationItem[], f: CertificationFilter) {
  return list.filter((item) => {
    return (
      matchesText(item, f.text ?? "") &&
      matchesCode(item, f.code) &&
      matchesStatus(item, f.status as any) &&
      matchesIssuer(item, f.issuerName) &&
      matchesScopedIds(item, f) &&
      matchesExpiring(item, f.expiringWithinDays)
    );
  });
}

/**
 * Sorting
 */

function applySort(list: CertificationItem[], sort: CertificationSort) {
  const copy = [...list];

  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => toTime(getCreatedAt(a)) - toTime(getCreatedAt(b)));
    case "status":
      return copy.sort((a, b) => safeLower(getStatus(a)).localeCompare(safeLower(getStatus(b))));
    case "expires_asc":
      return copy.sort((a, b) => toTime(getExpiresAt(a)) - toTime(getExpiresAt(b)));
    case "expires_desc":
      return copy.sort((a, b) => toTime(getExpiresAt(b)) - toTime(getExpiresAt(a)));
    case "newest":
    default:
      return copy.sort((a, b) => toTime(getCreatedAt(b)) - toTime(getCreatedAt(a)));
  }
}

function normaliseFilter(f?: CertificationFilter): CertificationFilter {
  return { ...DEFAULT_FILTER, ...(f ?? {}) };
}

/**
 * CertificationList
 *
 * A reusable list wrapper to align with Lots/RFQ patterns.
 * Safe for MVP demos and flexible for future growth.
 */
export function CertificationList({
  certifications = [],
  loading = false,
  error = null,

  className,

  layout = "grid",
  cardVariant = "default",

  title = "Certifications",
  subtitle = "Proof of compliance strengthening export trust",

  headerActions,

  filter,
  onFilterChange,

  sort = "newest",
  onSortChange,

  applyClientSideQuerying = true,
  showFilters = true,

  renderCardActions,
  onSelect
}: CertificationListProps) {
  const f = normaliseFilter(filter);

  const queried = applyClientSideQuerying
    ? applySort(applyFilters(certifications, f), sort)
    : certifications;

  function handleClear() {
    onFilterChange?.({ ...DEFAULT_FILTER });
  }

  const showFilterUI = Boolean(showFilters && filter && onFilterChange);

  return (
    <Card
      variant="soft"
      className={cx("cert-list", `cert-list--${layout}`, className)}
    >
      <header className="cert-list__head">
        <div className="cert-list__head-left">
          <div className="cert-list__label">Quality & compliance</div>
          <div className="cert-list__title">{title}</div>
          <div className="muted cert-list__subtitle">{subtitle}</div>
        </div>

        <div className="cert-list__head-right">
          <Badge variant="outline" size="sm">
            {queried.length} result{queried.length === 1 ? "" : "s"}
          </Badge>

          {headerActions ? (
            <div className="cert-list__head-actions">
              {headerActions}
            </div>
          ) : null}

          {showFilterUI ? (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Reset filters
            </Button>
          ) : null}
        </div>
      </header>

      {showFilterUI ? (
        <div className="cert-list__filters">
          <CertificationFilters
            value={f}
            onChange={onFilterChange!}
            sort={sort}
            onSortChange={onSortChange}
            compact={layout === "list"}
          />
        </div>
      ) : null}

      {loading ? (
        <div className="cert-list__state">
          <Loading />
        </div>
      ) : error ? (
        <div className="cert-list__state">
          <div className="cert-list__state-title">
            Could not load certifications
          </div>
          <div className="muted">{error}</div>
        </div>
      ) : queried.length === 0 ? (
        <div className="cert-list__state">
          <div className="cert-list__state-title">No certifications found</div>
          <div className="muted">
            Create or verify certifications in demo mode to populate this list.
          </div>
        </div>
      ) : (
        <div
          className={cx(
            "cert-list__content",
            layout === "grid" ? "cert-list__content--grid" : "cert-list__content--list"
          )}
        >
          {queried.map((cert) => (
            <div
              key={(cert as any).id}
              className={cx(
                "cert-list__item",
                onSelect && "cert-list__item--clickable"
              )}
              onClick={
                onSelect
                  ? (e) => {
                      const target = e.target as HTMLElement | null;
                      if (target?.closest("a") || target?.closest("button")) {
                        return;
                      }
                      onSelect(cert);
                    }
                  : undefined
              }
            >
              <CertificationCard
                certification={cert}
                variant={cardVariant}
                actions={renderCardActions?.(cert)}
              />
            </div>
          ))}
        </div>
      )}

      <style>
        {`
          .cert-list{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .cert-list__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .cert-list__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .cert-list__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .cert-list__subtitle{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .cert-list__head-right{
            display:flex;
            align-items: center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .cert-list__head-actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .cert-list__filters{
            display:grid;
            gap: var(--space-3);
          }

          .cert-list__state{
            padding: var(--space-4);
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
            display:grid;
            gap: var(--space-2);
          }

          .cert-list__state-title{
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
          }

          .cert-list__content{
            display:grid;
            gap: var(--space-3);
          }

          .cert-list__content--grid{
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cert-list__content--list{
            grid-template-columns: 1fr;
          }

          .cert-list__item--clickable{
            cursor: pointer;
          }

          .cert-list__item--clickable:hover{
            filter: brightness(1.02);
          }

          @media (max-width: 1100px){
            .cert-list__content--grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </Card>
  );
}