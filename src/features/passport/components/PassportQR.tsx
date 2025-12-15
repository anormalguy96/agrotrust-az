import { useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

type PassportQRSize = "sm" | "md" | "lg";

export type PassportQRProps = {
  passportId?: string | null;
  qrPayload?: string | null;
  data?: string;

  title?: string;
  subtitle?: string;

  size?: PassportQRSize;
  showDataText?: boolean;

  className?: string;
};

function looksLikeUrl(v: string) {
  return /^https?:\/\/|^\//i.test(v.trim());
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function guessPassportIdFromPayload(payload: string): string | null {
  const obj = safeJsonParse<any>(payload);
  const id = obj?.passportId;
  if (typeof id === "string" && id.trim()) return id.trim();
  return null;
}

function buildBuyerVerifyUrl(passportId: string) {
  const base = window.location.origin;
  
  return `${base}/buyers/passport?passportId=${encodeURIComponent(passportId)}`;
}

export function PassportQR({
  passportId,
  qrPayload,
  data,
  title = "Passport QR",
  subtitle = "Scan to verify passport details",
  size = "md",
  showDataText = false,
  className
}: PassportQRProps) {
  const [copied, setCopied] = useState<"link" | "payload" | null>(null);

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

  const resolved = useMemo(() => {
    const fallback = (data || "").trim();

    const payloadCandidate = (qrPayload || "").trim() || fallback;

    const id =
      (passportId || "").trim() ||
      
      (payloadCandidate ? guessPassportIdFromPayload(payloadCandidate) : null) ||
      null;

    let verifyLink = "";
    if (fallback && looksLikeUrl(fallback)) {
      verifyLink = fallback;
    } else if (id && typeof window !== "undefined") {
      verifyLink = buildBuyerVerifyUrl(id);
    }

    return {
      passportId: id,
      verifyLink,
      rawPayload: payloadCandidate || ""
    };
  }, [passportId, qrPayload, data]);

  const qrSrc = useMemo(() => {
    const toEncode = resolved.verifyLink || resolved.rawPayload || "";
    const encoded = encodeURIComponent(toEncode);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encoded}`;
  }, [resolved.verifyLink, resolved.rawPayload, px]);

  async function copyToClipboard(text: string, which: "link" | "payload") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      setCopied(null);
    }
  }

  const canCopyLink = Boolean(resolved.verifyLink);
  const canCopyPayload = Boolean(resolved.rawPayload);

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
          {subtitle ? (
            <div className="muted passport-qr__subtitle">{subtitle}</div>
          ) : null}
        </div>

        <div className="passport-qr__actions">
          <Button
            variant="ghost"
            size="sm"
            disabled={!canCopyLink}
            onClick={() => copyToClipboard(resolved.verifyLink, "link")}
            title={canCopyLink ? "Copy verification link" : "No verification link available"}
          >
            {copied === "link" ? "Copied link" : "Copy link"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={!canCopyPayload}
            onClick={() => copyToClipboard(resolved.rawPayload, "payload")}
            title={canCopyPayload ? "Copy raw payload" : "No payload available"}
          >
            {copied === "payload" ? "Copied payload" : "Copy payload"}
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
            alt="Passport QR code"
            loading="lazy"
          />
        </div>

        {showDataText && (
          <div className="passport-qr__debug">
            <div className="passport-qr__debug-row">
              <div className="passport-qr__debug-label">Passport ID</div>
              <code className="passport-qr__debug-code">
                {resolved.passportId ?? "—"}
              </code>
            </div>

            <div className="passport-qr__debug-row">
              <div className="passport-qr__debug-label">Verification link</div>
              <code className="passport-qr__debug-code">
                {resolved.verifyLink || "—"}
              </code>
            </div>

            <div className="passport-qr__debug-row">
              <div className="passport-qr__debug-label">Raw payload</div>
              <code className="passport-qr__debug-code">
                {resolved.rawPayload || "—"}
              </code>
            </div>
          </div>
        )}
      </div>

      <div className="passport-qr__foot muted">
        QR encodes a buyer-friendly verification link (preferred). If no link is available,
        it falls back to encoding the raw payload.
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

          .passport-qr__debug{
            width: 100%;
            display: grid;
            gap: 10px;
          }

          .passport-qr__debug-row{
            display: grid;
            gap: 6px;
          }

          .passport-qr__debug-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .passport-qr__debug-code{
            display:block;
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: var(--border-1);
            background: var(--color-elevated);
            font-size: var(--fs-1);
            overflow-wrap: anywhere;
            white-space: pre-wrap;
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
