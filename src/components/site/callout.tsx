import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { CALLOUT_TONE, calloutBox, type CalloutTone } from "./callout-tone";

/**
 * A boxed note. Meaning never rides on colour alone: every tone shows an icon
 * and a word ("Note", "Careful"…), then an optional title.
 */
export async function Callout({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: CalloutTone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const t = await getTranslations("common.callout");
  const { icon: Icon, box, label } = CALLOUT_TONE[tone];
  return (
    <aside className={cn(calloutBox, box, className)}>
      <p className={cn("flex items-center gap-2 font-semibold", label)}>
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        <span>{t(tone)}</span>
        {title ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-ink">{title}</span>
          </>
        ) : null}
      </p>
      <div className="mt-2 text-ink [&>*+*]:mt-3">{children}</div>
    </aside>
  );
}
