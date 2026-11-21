"use client";

import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { buttonStyles } from "@/components/site/button-link";
import { cn } from "@/lib/utils";

/**
 * The submit button of a form whose action is a Server Function. While the
 * action runs it shows `pendingLabel` and is disabled, so a second click
 * can't send the form twice. 44 px tall at least (buttonStyles).
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant,
  size,
  className,
}: {
  children: ReactNode;
  pendingLabel: ReactNode;
  className?: string;
} & VariantProps<typeof buttonStyles>) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={cn(buttonStyles({ variant, size }), className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
