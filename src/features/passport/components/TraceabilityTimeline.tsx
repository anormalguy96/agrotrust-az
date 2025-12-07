// agrotrust-az/src/features/passport/components/TraceabilityTimeline.tsx

import type { ReactNode } from "react";

import type { TraceabilityRecord, TraceEventType } from "../types";
import { formatDateShort, sortTraceability } from "../utils";

import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";

type TimelineVariant = "default" | "compact";

export type TraceabilityTimelineProps = {
  records?: TraceabilityRecord[];
  title?: ReactNode;
  subtitle?: ReactNode;

  variant?: TimelineVariant;
  className?: string;

  /**
   * If true, show record type badges.
   */
  showTypeBadges?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const TYPE_LABELS: Record<TraceEventType, string> = {
  planting: "Planting",
  fertiliser: "Fertiliser",
  pesticide: "Pesticide",
  irrigation: "Irrigation",
  harvest: "Harvest",
  sorting: "Sorting",
  packaging: "Packaging",
  storage: "Storage",
  transport: "Transport",
  inspection: "Inspection",
  custom: "Custom"
};

function labelForType(t: TraceEventType) {
  return TYPE_LABELS[t] ?? "Event";
}

/**
 * TraceabilityTimeline
 *
 * Visualises the traceability chain for a Digital Product Passport.
 * This is a UI-first component for the hackathon MVP, designed to:
 * - Communicate credibility quickly to judges
 * - Stay resilient with partial data
 */
export function TraceabilityTimeline({
  records = [],
  title = "Traceability timeline",
  subtitle = "Chronological evidence recorded by the cooperative",
  variant = "default",
  className,
  showTypeBadges = true
}: TraceabilityTimelineProps) {
  const sorted = sortTraceability(records);
  const compact = variant === "compact";

  return (
    <Card
      variant="soft"
      className={cx("trace-timeline", `trace-timeline--${variant}`, className)}
    >
      <header className="trace-timeline__head">
        <div>
          <div className="trace-timeline__label">Digital Product Passport</div>
          <div className="trace-timeline__title">{title}</div>
          {subtitle ? (
            <div className="muted trace-timeline__subtitle">{subtitle}</div>
          ) : null}
        </div>

        <div className="trace-timeline__meta">
          <Badge variant="outline" size="sm">
            {sorted.length} event{sorted.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </header>

      {sorted.length === 0 ? (
        <div className="trace-timeline__empty">
          <div className="trace-timeline__empty-title">No traceability yet</div>
          <div className="muted">
            Add planting, input usage, harvest and logistics steps to strengthen
            export-grade trust.
          </div>
        </div>
      ) : (
        <ol className="trace-timeline__list">
          {sorted.map((r, idx) => {
            const type = r.type ?? "custom";
            const label = r.title?.trim() || labelForType(type);
            const date = formatDateShort(r.date);

            const hasNotes = Boolean(r.notes?.trim());
            const attachmentsCount = r.attachments?.length ?? 0;

            return (
              <li key={r.id ?? `${type}-${idx}`} className="trace-item">
                <span className="trace-item__rail" aria-hidden="true" />

                <div className="trace-item__card">
                  <div className="trace-item__top">
                    <div className="trace-item__name">
                      {label}
                    </div>

                    <div className="trace-item__right">
                      {showTypeBadges && (
                        <Badge variant="muted" size="sm">
                          {labelForType(type)}
                        </Badge>
                      )}
                      <span className="trace-item__date">{date}</span>
                    </div>
                  </div>

                  {!compact && (
                    <div className="trace-item__details">
                      {r.geo?.locationName ? (
                        <div className="trace-item__kv">
                          <span className="trace-item__kv-label">Location</span>
                          <span className="trace-item__kv-value">
                            {r.geo.locationName}
                          </span>
                        </div>
                      ) : null}

                      {attachmentsCount > 0 ? (
                        <div className="trace-item__kv">
                          <span className="trace-item__kv-label">Attachments</span>
                          <span className="trace-item__kv-value">
                            {attachmentsCount}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {hasNotes ? (
                    <div className="trace-item__notes">
                      {r.notes}
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
          .trace-timeline{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .trace-timeline__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .trace-timeline__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .trace-timeline__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .trace-timeline__subtitle{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .trace-timeline__meta{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .trace-timeline__empty{
            padding: var(--space-4);
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
            display:grid;
            gap: var(--space-2);
          }

          .trace-timeline__empty-title{
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
          }

          .trace-timeline__list{
            list-style: none;
            padding: 0;
            margin: 0;
            display: grid;
            gap: var(--space-3);
          }

          .trace-item{
            position: relative;
            display: grid;
            grid-template-columns: 20px 1fr;
            gap: var(--space-3);
            align-items: start;
          }

          .trace-item__rail{
            position: relative;
            display: block;
            width: 20px;
            height: 100%;
          }

          .trace-item__rail::before{
            content: "";
            position: absolute;
            top: 2px;
            left: 9px;
            width: 2px;
            height: 100%;
            background: var(--color-border);
          }

          .trace-item__rail::after{
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

          .trace-item:last-child .trace-item__rail::before{
            height: 20px;
          }

          .trace-item__card{
            border: var(--border-1);
            background: var(--color-surface);
            border-radius: var(--radius-1);
            padding: var(--space-4);
            display: grid;
            gap: var(--space-2);
          }

          .trace-item__top{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .trace-item__name{
            font-size: var(--fs-3);
            font-weight: var(--fw-medium);
          }

          .trace-item__right{
            display:flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .trace-item__date{
            font-size: var(--fs-1);
            color: var(--color-text-muted);
            white-space: nowrap;
          }

          .trace-item__details{
            display:flex;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .trace-item__kv{
            display:inline-flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            border-radius: 8px;
            border: 1px solid var(--color-border);
            background: var(--color-elevated);
          }

          .trace-item__kv-label{
            font-size: var(--fs-0, 0.72rem);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .trace-item__kv-value{
            font-size: var(--fs-1);
          }

          .trace-item__notes{
            border-top: 1px dashed var(--color-border);
            padding-top: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text-muted);
            line-height: 1.5;
          }

          .trace-timeline--compact .trace-item__card{
            padding: var(--space-3);
          }
        `}
      </style>
    </Card>
  );
}