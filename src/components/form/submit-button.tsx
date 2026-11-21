"use client";

import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { buttonStyles } from "@/components/site/button-link";
import { cn } from "@/lib/utils";

/**
 * A submit button of a form whose action is a Server Function. While the
 * action runs, every button in the form is disabled, so a second click
 * can't send it twice, and the one that was pressed shows `pendingLabel`.
 * `name` and `value` tell the action which button that was. 44 px tall at
 * least (buttonStyles).
 */
export function SubmitButton({
  children,
  pendingLabel,
  name,
  value,
  variant,
  size,
  className,
}: {
  children: ReactNode;
  pendingLabel: ReactNode;
  name?: string;
  value?: string;
  className?: string;
} & VariantProps<typeof buttonStyles>) {
  const { pending, data } = useFormStatus();
  const pressed =
    pending && (name === undefined || data?.get(name) === (value ?? ""));
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pressed || undefined}
      className={cn(buttonStyles({ variant, size }), className)}
    >
      {pressed ? pendingLabel : children}
    </button>
  );
}
