// agrotrust-az/src/features/passport/components/PassportPreview.tsx

import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import type { Passport } from "../types";
import {
  formatDateShort,
  formatKg,
  getCertificationCodes,
  getLatestTraceDate,
  statusToTone
} from "../utils";

import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { ROUTES, lotDetailsPath } from "@/app/config/routes";

type PassportPreviewVariant = "default" | "compact";

export type PassportPreviewProps = {
  passport?: Passport | null;
  variant?: PassportPreviewVariant;

  /**
   * Optional slot for additional actions (e.g., "Verify", "Download PDF")
   */
  actions?: ReactNode;

  className?: string;
};

/**
 * PassportPreview
 *
 * A clean, judge-friendly summary card for a single Digital Product Passport.
 * Used in dashboards and feature-level views.
 */
export function PassportPreview({
  passport,
  variant = "default",
  actions,
  className
}: PassportPreviewProps) {
  if (!passport) {
    return (
      <Card className={["passport-preview", className].filter(Boolean).join(" ")}>
        <div className="passport-preview__empty">
          <div className="passport-preview__empty-title">
            No passport selected
          </div>
          <div className="muted">
            Choose a lot and create a Digital Product Passport to see a preview here.
          </div>
        </div>

        <style>
          {`
            .passport-preview__empty{
              padding: var(--space-4);
              display: grid;
              gap: var(--space-2);
            }
            .passport-preview__empty-title{
              font-size: var(--fs-4);
              font-weight: var(--fw-semibold);
            }
          `}
        </style>
      </Card>
    );
  }

  const certCodes = getCertificationCodes(passport);
  const latestTrace = getLatestTraceDate(passport.traceability ?? []);

  const tone = statusToTone(passport.status);

  const isCompact = variant === "compact";

  return (
    <Card
      variant="soft"
      className={[
        "passport-preview",
        `passport-preview--${variant}`,
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="passport-preview__head">
        <div className="passport-preview__head-left">
          <div className="passport-preview__kicker">
            Digital Product Passport
          </div>
          <div className="passport-preview__title">
            {passport.product.product}
            {passport.product.variety ? (
              <span className="passport-preview__title-sub">
                {" "}
                • {passport.product.variety}
              </span>
            ) : null}
          </div>
        </div>

        <div className="passport-preview__head-right">
          <Badge variant={tone as any}>
            {passport.status}
          </Badge>
          {actions ? <div className="passport-preview__actions">{actions}</div> : null}
        </div>
      </header>

      <div className="passport-preview__grid">
        <section className="passport-preview__section">
          <div className="passport-preview__section-title">Identity</div>

          <div className="pp-kv">
            <div className="pp-kv__row">
              <span className="pp-kv__label">Passport ID</span>
              <span className="pp-kv__value mono">{passport.id}</span>
            </div>

            <div className="pp-kv__row">
              <span className="pp-kv__label">Lot</span>
              <span className="pp-kv__value">
                {passport.lotId ? (
                  <NavLink
                    to={lotDetailsPath(passport.lotId)}
                    className="pp-link mono"
                  >
                    {passport.lotId}
                  </NavLink>
                ) : (
                  <span className="muted">Not linked</span>
                )}
              </span>
            </div>

            <div className="pp-kv__row">
              <span className="pp-kv__label">Cooperative</span>
              <span className="pp-kv__value">
                {passport.owner?.coopName ?? (
                  <span className="muted">Unknown</span>
                )}
              </span>
            </div>

            <div className="pp-kv__row">
              <span className="pp-kv__label">Created</span>
              <span className="pp-kv__value">
                {formatDateShort(passport.createdAt)}
              </span>
            </div>
          </div>
        </section>

        <section className="passport-preview__section">
          <div className="passport-preview__section-title">Product</div>

          <div className="pp-kv">
            <div className="pp-kv__row">
              <span className="pp-kv__label">Product</span>
              <span className="pp-kv__value">
                {passport.product.product}
              </span>
            </div>

            {!isCompact && passport.product.grade ? (
              <div className="pp-kv__row">
                <span className="pp-kv__label">Grade</span>
                <span className="pp-kv__value">{passport.product.grade}</span>
              </div>
            ) : null}

            <div className="pp-kv__row">
              <span className="pp-kv__label">Region</span>
              <span className="pp-kv__value">
                {passport.product.region ?? <span className="muted">—</span>}
              </span>
            </div>

            <div className="pp-kv__row">
              <span className="pp-kv__label">Harvest date</span>
              <span className="pp-kv__value">
                {formatDateShort(passport.product.harvestDate)}
              </span>
            </div>

            <div className="pp-kv__row">
              <span className="pp-kv__label">Quantity</span>
              <span className="pp-kv__value">
                {formatKg(passport.product.quantityKg)}
              </span>
            </div>
          </div>
        </section>

        <section className="passport-preview__section">
          <div className="passport-preview__section-title">Certifications</div>

          {certCodes.length === 0 ? (
            <div className="muted">
              No certifications listed for this passport yet.
            </div>
          ) : (
            <div className="passport-preview__chips">
              {certCodes.map((c) => (
                <Badge key={c} variant="outline" size="sm">
                  {c}
                </Badge>
              ))}
            </div>
          )}

          {!isCompact && (
            <div className="passport-preview__hint muted">
              In production, these would be verified against accredited auditor records.
            </div>
          )}
        </section>

        <section className="passport-preview__section">
          <div className="passport-preview__section-title">Traceability</div>

          <div className="pp-kv">
            <div className="pp-kv__row">
              <span className="pp-kv__label">Events</span>
              <span className="pp-kv__value">
                {(passport.traceability ?? []).length}
              </span>
            </div>

            <div className="pp-kv__row">
              <span className="pp-kv__label">Latest event</span>
              <span className="pp-kv__value">
                {latestTrace ? formatDateShort(latestTrace) : <span className="muted">—</span>}
              </span>
            </div>
          </div>

          {!isCompact && passport.qrData ? (
            <div className="passport-preview__qrline">
              <span className="passport-preview__qrlabel">QR payload</span>
              <code className="passport-preview__qrcode">
                {passport.qrData}
              </code>
            </div>
          ) : null}

          {!isCompact && (
            <div className="passport-preview__actions-row">
              <NavLink
                className="btn btn--soft btn--sm"
                to={ROUTES.DASHBOARD.LOTS}
              >
                Back to lots
              </NavLink>
            </div>
          )}
        </section>
      </div>

      <style>
        {`
          .passport-preview{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .passport-preview__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .passport-preview__kicker{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .passport-preview__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-top: 2px;
          }

          .passport-preview__title-sub{
            font-weight: var(--fw-regular);
            color: var(--color-text-muted);
            font-size: 0.95em;
          }

          .passport-preview__head-right{
            display:flex;
            align-items: center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .passport-preview__actions{
            display:flex;
            gap: var(--space-2);
          }

          .passport-preview__grid{
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-4);
            align-items: start;
          }

          .passport-preview--compact .passport-preview__grid{
            grid-template-columns: 1fr;
          }

          .passport-preview__section{
            border: var(--border-1);
            background: var(--color-surface);
            border-radius: var(--radius-1);
            padding: var(--space-4);
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .passport-preview__section-title{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .pp-kv{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .pp-kv__row{
            display:flex;
            justify-content: space-between;
            gap: var(--space-3);
            padding: 6px 0;
            border-bottom: 1px solid var(--color-border);
          }

          .pp-kv__row:last-child{
            border-bottom: none;
          }

          .pp-kv__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .pp-kv__value{
            font-size: var(--fs-2);
            text-align: right;
          }

          .mono{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .pp-link{
            text-decoration: none;
          }

          .pp-link:hover{
            text-decoration: underline;
          }

          .passport-preview__chips{
            display:flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .passport-preview__hint{
            font-size: var(--fs-1);
          }

          .passport-preview__qrline{
            display:flex;
            flex-direction: column;
            gap: 6px;
            padding-top: var(--space-2);
          }

          .passport-preview__qrlabel{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .passport-preview__qrcode{
            display:block;
            padding: 8px 10px;
            border-radius: 8px;
            border: var(--border-1);
            background: var(--color-elevated);
            font-size: var(--fs-1);
            overflow-wrap: anywhere;
          }

          .passport-preview__actions-row{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          @media (max-width: 980px){
            .passport-preview__grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </Card>
  );
}