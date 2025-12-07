// agrotrust-az/src/features/passport/components/PassportQR.tsx

import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

type PassportQRSize = "sm" | "md" | "lg";

export type PassportQRProps = {
  /**
   * The QR payload string. In our MVP this is often the
   * Netlify verify endpoint URL produced by buildQrData().
   */
  data: string;

  title?: string;
  subtitle?: string;

  size?: PassportQRSize;
  showDataText?: boolean;

  className?: string;
};

/**
 * PassportQR
 *
 * Hackathon-friendly QR renderer.
 *
 * To keep this MVP dependency-free, we use a simple public QR image endpoint.
 * If you later want an offline/enterprise-safe version, we can switch to a
 * local QR generator utility.
 */
export function PassportQR({
  data,
  title = "Passport QR",
  subtitle = "Scan to verify origin and quality trail",
  size = "md",
  showDataText = false,
  className
}: PassportQRProps) {
  const [copied, setCopied] = useState(false);

  const px = useMemo(() => {
    switch (size) {
      case "sm":
        return 140;
      case "lg":
        return 240;
      default:
        return 180;
    }
  }, [size]);

  const qrSrc = useMemo(() => {
    const encoded = encodeURIComponent(data || "");
    // Public QR image generator for MVP demos
    return `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encoded}`;
  }, [data, px]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card
      variant="soft"
      className={["passport-qr", `passport-qr--${size}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="passport-qr__head">
        <div>
          <div className="passport-qr__label">Digital Product Passport</div>
          <div className="passport-qr__title">{title}</div>
          {subtitle ? <div className="muted passport-qr__subtitle">{subtitle}</div> : null}
        </div>

        <div className="passport-qr__actions">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? "Copied" : "Copy QR data"}
          </Button>
        </div>
      </div>

      <div className="passport-qr__body">
        <div className="passport-qr__frame">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={qrSrc}
            width={px}
            height={px}
            alt="Passport verification QR code"
            loading="lazy"
          />
        </div>

        {showDataText && (
          <code className="passport-qr__data">
            {data}
          </code>
        )}
      </div>

      <div className="passport-qr__foot muted">
        For the hackathon MVP this QR is generated via a lightweight public service.
      </div>

      <style>
        {`
          .passport-qr{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .passport-qr__head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .passport-qr__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .passport-qr__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .passport-qr__subtitle{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .passport-qr__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .passport-qr__body{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
            align-items: flex-start;
          }

          .passport-qr__frame{
            display:inline-flex;
            align-items:center;
            justify-content:center;
            padding: 10px;
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
          }

          .passport-qr__data{
            display:block;
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: var(--border-1);
            background: var(--color-elevated);
            font-size: var(--fs-1);
            overflow-wrap: anywhere;
          }

          .passport-qr__foot{
            font-size: var(--fs-1);
          }

          .passport-qr--sm .passport-qr__title{
            font-size: var(--fs-4);
          }
        `}
      </style>
    </Card>
  );
}