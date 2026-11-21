import { OctagonAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Inputs are rounded-2xl with a 2 px border and a 44 px minimum height. */
export const inputStyles =
  "block min-h-11 w-full rounded-2xl border-2 border-border-strong bg-surface px-4 py-2 text-body text-ink placeholder:text-ink-faint aria-invalid:border-danger";

/** The error prop, not aria-invalid, marks the input invalid. */
type TextFieldProps = Omit<
  ComponentProps<"input">,
  "id" | "children" | "aria-invalid"
> & {
  /** Also the stem of the hint's and error's ids. Unique on the page. */
  id: string;
  name: string;
  label: ReactNode;
  /** Shown under the label and read out with the input. */
  hint?: ReactNode;
  /** Shown above the input and read out with it; marks the input invalid. */
  error?: ReactNode;
  /** More ids to read out with the input, before the hint and error. */
  "aria-describedby"?: string;
};

/**
 * A labelled text input with an optional hint and error, both tied to the
 * input with aria-describedby so screen readers read them with it. Works
 * in Server and Client Components: it holds no state.
 */
export function TextField({
  id,
  label,
  hint,
  error,
  className,
  "aria-describedby": callerDescribedBy,
  ...input
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [callerDescribedBy, hintId, errorId]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-semibold text-ink">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-2 font-semibold text-danger"
        >
          <OctagonAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
      {/* The rest first, so nothing a caller passes can undo the wiring. */}
      <input
        {...input}
        id={id}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={inputStyles}
      />
    </div>
  );
}
