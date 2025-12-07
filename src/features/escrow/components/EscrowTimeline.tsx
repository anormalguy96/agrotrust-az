// agrotrust-az/src/features/escrow/components/EscrowTimeline.tsx

import type { ReactNode } from "react";

import type {
  EscrowContract,
  EscrowMilestone,
  EscrowMilestoneType
} from "../types";

import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";

type TimelineVariant = "default" | "compact";

export type EscrowTimelineProps = {
  /**
   * Preferred input: full contract.
   */
  contract?: EscrowContract | null;

  /**
   * Optional override if you want to render milestones alone.
   */
  milestones?: EscrowMilestone[];

  title?: ReactNode;
  subtitle?: ReactNode;

  variant?: TimelineVariant;
  className?: string;

  showActor?: boolean;
  showEvidenceCount?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const TYPE_LABELS: Record<EscrowMilestoneType, string> = {
  contract_created: "Contract created",
  deposit_requested: "Deposit requested",
  deposit_received: "Deposit received",
  shipment_dispatched: "Shipment dispatched",
  shipment_arrived: "Shipment arrived",
  inspection_started: "Inspection started",
  inspection_passed: "Inspection passed",
  inspection_failed: "Inspection failed",
  release_requested: "Release requested",
  released: "Funds released",
  refund_requested: "Refund requested",
  refunded: "Refunded",
  cancelled: "Cancelled",
  custom: "Update"
};

function labelForType(type: EscrowMilestoneType) {
  return TYPE_LABELS[type] ?? "Update";
}

function toneForType(type: EscrowMilestoneType) {
  switch (type) {
    case "deposit_received":
    case "inspection_passed":
    case "released":
      return "success";
    case "deposit_requested":
    case "inspection_started":
    case "release_requested":
    case "refund_requested":
    case "shipment_dispatched":
    case "shipment_arrived":
      return "warning";
    case "inspection_failed":
    case "refunded":
    case "cancelled":
      return "danger";
    case "contract_created":
    case "custom":
    default:
      return "muted";
  }
}

function sortByDate(items: EscrowMilestone[]) {
  return [...items].sort((a, b) => {
    const da = Date.parse(a.date);
    const db = Date.parse(b.date);
    if (!Number.isFinite(da) && !Number.isFinite(db)) return 0;
    if (!Number.isFinite(da)) return 1;
    if (!Number.isFinite(db)) return -1;
    return da - db;
  });
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  try {
    return new Date(t).toLocaleString();
  } catch {
    return "—";
  }
}

/**
 * EscrowTimeline
 *
 * Presents an audit-like narrative of the escrow journey.
 * Works in both:
 * - Mock mode (localStorage milestones created by escrowApi.ts)
 * - Function mode (serverless milestones)
 */
export function EscrowTimeline({
  contract,
  milestones,
  title = "Escrow timeline",
  subtitle = "A transparent log of deposit, inspection and release events",
  variant = "default",
  className,
  showActor = true,
  showEvidenceCount = true
}: EscrowTimelineProps) {
  const raw = milestones ?? contract?.milestones ?? [];
  const items = sortByDate(raw);
  const compact = variant === "compact";

  return (
    <Card
      variant="soft"
      className={cx("escrow-timeline", `escrow-timeline--${variant}`, className)}
    >
      <header className="escrow-timeline__head">
        <div>
          <div className="escrow-timeline__label">Trust & payments</div>
          <div className="escrow-timeline__title">{title}</div>
          {subtitle ? (
            <div className="muted escrow-timeline__subtitle">{subtitle}</div>
          ) : null}
        </div>

        <div className="escrow-timeline__meta">
          <Badge variant="outline" size="sm">
            {items.length} event{items.length === 1 ? "" : "s"}
          </Badge>
          {contract?.id ? (
            <Badge variant="muted" size="sm">
              {contract.id}
            </Badge>
          ) : null}
        </div>
      </header>

      {items.length === 0 ? (
        <div className="escrow-timeline__empty">
          <div className="escrow-timeline__empty-title">No timeline yet</div>
          <div className="muted">
            Create an escrow contract to generate a milestone trail for this deal.
          </div>
        </div>
      ) : (
        <ol className="escrow-timeline__list">
          {items.map((m, idx) => {
            const type = m.type ?? "custom";
            const label = (m.title && String(m.title).trim()) || labelForType(type);
            const tone = toneForType(type);
            const date = formatDate(m.date);

            const actorText =
              m.actor?.organisation
                ? `${m.actor.organisation} (${m.actor.role})`
                : m.actor?.name
                ? `${m.actor.name} (${m.actor.role})`
                : m.actor?.role;

            const evidenceCount = m.evidenceUrls?.length ?? 0;

            return (
              <li key={m.id ?? `${type}-${idx}`} className="esc-item">
                <span className="esc-item__rail" aria-hidden="true" />

                <div className="esc-item__card">
                  <div className="esc-item__top">
                    <div className="esc-item__name">
                      {label}
                    </div>

                    <div className="esc-item__right">
                      <Badge variant={tone as any} size="sm">
                        {labelForType(type)}
                      </Badge>
                      <span className="esc-item__date">{date}</span>
                    </div>
                  </div>

                  {!compact && (
                    <div className="esc-item__meta">
                      {showActor && actorText ? (
                        <span className="esc-item__pill">
                          <span className="esc-item__pill-label">Actor</span>
                          <span className="esc-item__pill-value">{actorText}</span>
                        </span>
                      ) : null}

                      {showEvidenceCount ? (
                        <span className="esc-item__pill">
                          <span className="esc-item__pill-label">Evidence</span>
                          <span className="esc-item__pill-value">
                            {evidenceCount || 0}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  )}

                  {m.description ? (
                    <div className="esc-item__notes">
                      {m.description}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <style>
        {`
          .escrow-timeline{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .escrow-timeline__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .escrow-timeline__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .escrow-timeline__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .escrow-timeline__subtitle{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .escrow-timeline__meta{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .escrow-timeline__empty{
            padding: var(--space-4);
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
            display:grid;
            gap: var(--space-2);
          }

          .escrow-timeline__empty-title{
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
          }

          .escrow-timeline__list{
            list-style: none;
            padding: 0;
            margin: 0;
            display: grid;
            gap: var(--space-3);
          }

          .esc-item{
            position: relative;
            display: grid;
            grid-template-columns: 20px 1fr;
            gap: var(--space-3);
            align-items: start;
          }

          .esc-item__rail{
            position: relative;
            display: block;
            width: 20px;
            height: 100%;
          }

          .esc-item__rail::before{
            content: "";
            position: absolute;
            top: 2px;
            left: 9px;
            width: 2px;
            height: 100%;
            background: var(--color-border);
          }

          .esc-item__rail::after{
            content: "";
            position: absolute;
            top: 10px;
            left: 5px;
            width: 10px;
            height: 10px;
            border-radius: 999px;
            background: var(--color-elevated);
            border: 2px solid color-mix(in oklab, var(--color-primary) 45%, var(--color-border));
          }

          .esc-item:last-child .esc-item__rail::before{
            height: 20px;
          }

          .esc-item__card{
            border: var(--border-1);
            background: var(--color-surface);
            border-radius: var(--radius-1);
            padding: var(--space-4);
            display: grid;
            gap: var(--space-2);
          }

          .esc-item__top{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .esc-item__name{
            font-size: var(--fs-3);
            font-weight: var(--fw-medium);
          }

          .esc-item__right{
            display:flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .esc-item__date{
            font-size: var(--fs-1);
            color: var(--color-text-muted);
            white-space: nowrap;
          }

          .esc-item__meta{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .esc-item__pill{
            display:inline-flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            border-radius: 8px;
            border: 1px solid var(--color-border);
            background: var(--color-elevated);
          }

          .esc-item__pill-label{
            font-size: var(--fs-0, 0.72rem);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .esc-item__pill-value{
            font-size: var(--fs-1);
          }

          .esc-item__notes{
            border-top: 1px dashed var(--color-border);
            padding-top: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text-muted);
            line-height: 1.5;
          }

          .escrow-timeline--compact .esc-item__card{
            padding: var(--space-3);
          }
        `}
      </style>
    </Card>
  );
}