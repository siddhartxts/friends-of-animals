import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/site/heading";
import { Section } from "@/components/site/section";
import { SiteLink } from "@/components/site/site-link";
import { ROUTES } from "@/lib/routes";

import { EmailCodeForm } from "./email-code-form";

const LINK =
  "inline-flex min-h-11 items-center font-semibold text-link underline decoration-2 underline-offset-4 hover:text-link-hover";

/** The sign-up and sign-in pages: a heading, the form, the other way in. */
export async function AuthPage({ intent }: { intent: "sign-up" | "sign-in" }) {
  const page = await getTranslations(
    intent === "sign-up" ? "auth.signUp" : "auth.signIn"
  );
  const t = await getTranslations("auth.form");
  const tc = await getTranslations("common.callout");
  const other = intent === "sign-up" ? ROUTES.signIn : ROUTES.signUp;

  return (
    <Section hue="blue" tone="tint" width="prose" className="pt-10 sm:pt-14">
      <PageHeader
        eyebrow={page("eyebrow")}
        tile="blue"
        title={page("title")}
        lead={page("lead")}
      />
      <div className="mt-8 max-w-xl rounded-3xl border-2 border-border bg-surface p-5 shadow-warm sm:p-8">
        <EmailCodeForm
          intent={intent}
          labels={{
            name: { label: t("name.label"), hint: t("name.hint") },
            email: { label: t("email.label"), hint: t("email.hint") },
            code: { label: t("code.label") },
            sendCode: t("sendCode"),
            sending: t("sending"),
            verify: intent === "sign-up" ? t("signUp") : t("signIn"),
            checking: t("checking"),
            resend: t("resend"),
            changeEmail: t("changeEmail"),
            signUpInstead: t("signUpInstead"),
            problem: tc("danger"),
            done: tc("success"),
          }}
        />
      </div>
      <p className="mt-6 text-ink">
        {page("other")}{" "}
        <SiteLink href={other.path} className={LINK}>
          {page("otherLink")}
        </SiteLink>
      </p>
    </Section>
  );
}
