// agrotrust-az/src/components/common/Modal.tsx

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

type ModalSize = "sm" | "md" | "lg";

export type ModalProps = {
  open: boolean;
  onClose: () => void;

  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;

  size?: ModalSize;
  className?: string;

  closeOnOverlayClick?: boolean;
  ariaLabel?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function ensureModalRoot() {
  let root = document.getElementById("modal-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "modal-root";
    document.body.appendChild(root);
  }
  return root;
}

function ensureModalStyles() {
  const id = "agrotrust-modal-styles";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    .modal-overlay{
      position: fixed;
      inset: 0;
      background: color-mix(in oklab, #000 45%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(12px, 2vw, 24px);
      z-index: 60;
    }

    .modal{
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      border-radius: var(--radius-2, 14px);
      border: var(--border-1, 1px solid rgba(255,255,255,0.08));
      background: var(--color-surface, #0f1216);
      box-shadow:
        0 10px 30px rgba(0,0,0,0.35),
        0 0 0 1px rgba(255,255,255,0.04) inset;
      display: grid;
      grid-template-rows: auto 1fr auto;
      animation: modal-in 140ms ease;
    }

    .modal--sm{ max-width: 420px; }
    .modal--md{ max-width: 680px; }
    .modal--lg{ max-width: 940px; }

    .modal__header{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 18px 20px;
      border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
      background: var(--color-surface, #0f1216);
    }

    .modal__title{
      font-size: var(--fs-5, 1.2rem);
      font-weight: var(--fw-semibold, 600);
      margin: 0;
      line-height: 1.2;
    }

    .modal__close{
      border: var(--border-1, 1px solid rgba(255,255,255,0.08));
      background: var(--color-elevated, rgba(255,255,255,0.04));
      color: var(--color-text, #fff);
      border-radius: 10px;
      height: 34px;
      width: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 120ms ease, opacity 120ms ease, background 120ms ease;
    }

    .modal__close:hover{ transform: translateY(-1px); }
    .modal__close:active{ transform: translateY(0); opacity: 0.85; }

    .modal__body{
      padding: 18px 20px 22px;
      overflow: auto;
    }

    .modal__footer{
      padding: 14px 20px 18px;
      border-top: 1px solid var(--color-border, rgba(255,255,255,0.08));
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      background: var(--color-surface, #0f1216);
    }

    @keyframes modal-in{
      from{
        opacity: 0;
        transform: translateY(6px) scale(0.99);
      }
      to{
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  document.head.appendChild(style);
}

function getFocusable(container: HTMLElement) {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ];
  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(",")));
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  className,
  closeOnOverlayClick = true,
  ariaLabel
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const modalRoot = useMemo(() => {
    if (typeof document === "undefined") return null;
    return ensureModalRoot();
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    ensureModalStyles();
  }, [open]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Focus management
      const timer = window.setTimeout(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = getFocusable(panel);
        (focusables[0] ?? panel).focus?.();
      }, 0);

      return () => {
        window.clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        previouslyFocusedRef.current?.focus?.();
      };
    }

    return;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = getFocusable(panel);
      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !modalRoot) return null;

  const panelClasses = cx("modal", `modal--${size}`, className);

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (!closeOnOverlayClick) return;
        // close only when clicking the overlay itself
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={panelClasses}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={title ? "agrotrust-modal-title" : undefined}
        tabIndex={-1}
        onMouseDown={(e) => {
          // Prevent overlay click close when interacting inside panel
          e.stopPropagation();
        }}
      >
        <div className="modal__header">
          <div className="modal__title" id="agrotrust-modal-title">
            {title}
          </div>
          <button
            type="button"
            className="modal__close"
            aria-label="Close"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>,
    modalRoot
  );
}