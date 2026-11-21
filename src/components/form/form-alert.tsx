import type { ReactNode } from "react";

import {
  CALLOUT_TONE,
  calloutBox,
  type CalloutTone,
} from "@/components/site/callout-tone";
import { cn } from "@/lib/utils";

type Tone = Extract<CalloutTone, "danger" | "success">;

/** A problem is announced at once, good news politely. */
const ROLE: Record<Tone, "alert" | "status"> = {
  danger: "alert",
  success: "status",
};

/**
 * The outcome of a form submission, for the whole form rather than one
 * field. A problem is announced at once (role="alert"), good news politely
 * (role="status"). Meaning never rides on colour alone: it shows an icon and
 * a word (`label`, e.g. common.callout.danger, "Important"). Holds no state,
 * so it works in Client Components, which can't render <Callout>; both take
 * their look from ../site/callout-tone.ts.
 */
export function FormAlert({
  tone,
  label,
  children,
  className,
}: {
  tone: Tone;
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, box, label: word } = CALLOUT_TONE[tone];
  return (
    <div role={ROLE[tone]} className={cn(calloutBox, box, className)}>
      <p className={cn("flex items-center gap-2 font-semibold", word)}>
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        <span>{label}</span>
      </p>
      <div className="mt-2 text-ink">{children}</div>
    </div>
  );
}
