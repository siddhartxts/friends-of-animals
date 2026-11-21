import { MonitorSmartphone } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SubmitButton } from "@/components/form";
import { Chip } from "@/components/site/chip";
import { PageHeader, SectionHeading } from "@/components/site/heading";
import { Section } from "@/components/site/section";
import { ROUTES } from "@/lib/routes";
import { as, currentActor } from "@/server/app";
import type { SessionSummary } from "@/server/identity";

import { signOutEverywhereAction, signOutSessionAction } from "./_lib/actions";
import { describeDevice } from "./_lib/device";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.sessions.meta");
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

export default async function Page() {
  const t = await getTranslations("account.sessions");
  return (
    <Section hue="blue" tone="tint" width="prose" className="pt-10 sm:pt-14">
      <PageHeader
        eyebrow={t("eyebrow")}
        tile="blue"
        title={t("title")}
        lead={t("lead")}
      />
      {/* The session is read per request, so it streams in behind this
          boundary while the heading above is prerendered. */}
      <Suspense
        fallback={<p className="mt-8 text-ink-muted">{t("loading")}</p>}
      >
        <Sessions />
      </Suspense>
    </Section>
  );
}

const CARD =
  "rounded-3xl border-2 border-border bg-surface p-5 shadow-warm sm:p-6";

async function Sessions() {
  const actor = await currentActor();
  if (actor.kind !== "user") redirect(ROUTES.signIn.path);
  const [t, format, account, sessions] = await Promise.all([
    getTranslations("account.sessions"),
    getFormatter(),
    as(actor).getAccount(),
    as(actor).listSessions(),
  ]);

  const deviceName = (session: SessionSummary) => {
    const { browser, os } = describeDevice(session.userAgent);
    if (browser && os) return t("device", { browser, os });
    if (browser) return t("deviceBrowserOnly", { browser });
    if (os) return t("deviceOsOnly", { os });
    return t("deviceUnknown");
  };

  return (
    <div className="mt-8 flex flex-col gap-10">
      <p className="text-lead text-ink">{t("signedInAs", account)}</p>

      <section aria-labelledby="sessions-list">
        <SectionHeading id="sessions-list" title={t("listTitle")} />
        <ul className="mt-5 flex flex-col gap-4">
          {sessions.map((session) => {
            const device = deviceName(session);
            const date = format.dateTime(session.startedAt, "longDateTime");
            return (
              <li key={session.id} className={CARD}>
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  <MonitorSmartphone
                    aria-hidden="true"
                    className="size-5 shrink-0"
                  />
                  <span>{device}</span>
                  {session.current ? (
                    <Chip tone="green">{t("thisDevice")}</Chip>
                  ) : null}
                </p>
                <p className="mt-2 text-ink-muted">{t("started", { date })}</p>
                {session.ipAddress ? (
                  <p className="text-ink-muted">
                    {t("ip", { ip: session.ipAddress })}
                  </p>
                ) : null}
                <form action={signOutSessionAction} className="mt-4">
                  <input type="hidden" name="sessionId" value={session.id} />
                  <SubmitButton
                    variant="secondary"
                    pendingLabel={t("signingOut")}
                  >
                    {t("signOut")}
                    <span className="sr-only">
                      {" "}
                      {t("signOutOf", { device, date })}
                    </span>
                  </SubmitButton>
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="sessions-everywhere" className={CARD}>
        <h2 id="sessions-everywhere" className="text-lead font-bold text-ink">
          {t("everywhereTitle")}
        </h2>
        <p className="mt-2 text-ink">{t("everywhereLead")}</p>
        <form action={signOutEverywhereAction} className="mt-4">
          <SubmitButton pendingLabel={t("signingOut")}>
            {t("everywhere")}
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
