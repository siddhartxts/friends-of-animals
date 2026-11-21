// The look of each callout tone, shared by <Callout> (a Server Component)
// and the form kit's <FormAlert> (which Client Components render), so the
// two can't drift. No server imports here.

import {
  CircleCheck,
  Info,
  type LucideIcon,
  OctagonAlert,
  TriangleAlert,
} from "lucide-react";

export type CalloutTone = "info" | "success" | "warning" | "danger";

/** The box around a callout; add the tone's `box` classes. */
export const calloutBox = "rounded-3xl border-2 p-5 text-ink sm:p-6";

/** Each tone's icon, box colours and the colour of its word. */
export const CALLOUT_TONE: Record<
  CalloutTone,
  { icon: LucideIcon; box: string; label: string }
> = {
  info: {
    icon: Info,
    box: "border-info-border bg-info-bg",
    label: "text-info",
  },
  success: {
    icon: CircleCheck,
    box: "border-success-border bg-success-bg",
    label: "text-success",
  },
  warning: {
    icon: TriangleAlert,
    box: "border-warning-border bg-warning-bg",
    label: "text-warning",
  },
  danger: {
    icon: OctagonAlert,
    box: "border-danger-border bg-danger-bg",
    label: "text-danger",
  },
};
