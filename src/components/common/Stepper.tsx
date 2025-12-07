// agrotrust-az/src/components/common/Stepper.tsx

import type { ReactNode } from "react";

type StepStatus = "complete" | "active" | "upcoming" | "error";
type StepOrientation = "horizontal" | "vertical";
type StepSize = "sm" | "md";

export type StepItem = {
  key?: string;
  title: ReactNode;
  subtitle?: ReactNode;

  /**
   * Optional explicit status.
   * If not provided, status will be derived from activeIndex.
   */
  status?: StepStatus;

  /**
   * Optional interaction (useful for wizard-like demos).
   */
  onClick?: () => void;
  disabled?: boolean;
};

export type StepperProps = {
  steps: StepItem[];
  activeIndex?: number;

  orientation?: StepOrientation;
  size?: StepSize;

  /**
   * Show numeric index badges.
   */
  showIndex?: boolean;

  className?: string;
  "aria-label"?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function deriveStatus(
  explicit: StepStatus | undefined,
  index: number,
  activeIndex: number
): StepStatus {
  if (explicit) return explicit;
  if (index < activeIndex) return "complete";
  if (index === activeIndex) return "active";
  return "upcoming";
}

/**
 * Stepper
 *
 * Lightweight stepper that follows the project’s utility-class approach.
 * Expected global classes (you can define them in globals.css later if needed):
 * - .stepper, .stepper--horizontal, .stepper--vertical
 * - .stepper--sm, .stepper--md
 * - .step, .step--complete, .step--active, .step--upcoming, .step--error
 * - .step__index, .step__content, .step__title, .step__subtitle, .step__connector
 *
 * The component still renders clean HTML even if those classes are minimal.
 */
export function Stepper({
  steps,
  activeIndex = 0,
  orientation = "horizontal",
  size = "md",
  showIndex = true,
  className,
  "aria-label": ariaLabel = "Progress"
}: StepperProps) {
  const safeActive = Math.min(Math.max(activeIndex, 0), Math.max(steps.length - 1, 0));

  return (
    <div
      className={cx(
        "stepper",
        `stepper--${orientation}`,
        `stepper--${size}`,
        className
      )}
      role="list"
      aria-label={ariaLabel}
    >
      {steps.map((s, i) => {
        const status = deriveStatus(s.status, i, safeActive);
        const isInteractive = typeof s.onClick === "function" && !s.disabled;

        const StepRoot: any = isInteractive ? "button" : "div";

        const rootProps = isInteractive
          ? {
              type: "button" as const,
              onClick: s.onClick,
              disabled: s.disabled,
              "aria-current": status === "active" ? "step" : undefined
            }
          : { "aria-current": status === "active" ? "step" : undefined };

        return (
          <div key={s.key ?? `${i}`} className="step__wrap" role="listitem">
            <StepRoot
              className={cx(
                "step",
                `step--${status}`,
                s.disabled && "step--disabled",
                isInteractive && "step--interactive"
              )}
              {...rootProps}
            >
              {showIndex && (
                <span className="step__index" aria-hidden="true">
                  {status === "complete" ? "✓" : i + 1}
                </span>
              )}

              <span className="step__content">
                <span className="step__title">{s.title}</span>
                {s.subtitle ? (
                  <span className="step__subtitle">{s.subtitle}</span>
                ) : null}
              </span>
            </StepRoot>

            {i < steps.length - 1 && (
              <span
                className={cx(
                  "step__connector",
                  `step__connector--${orientation}`
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export type { StepStatus, StepOrientation, StepSize };