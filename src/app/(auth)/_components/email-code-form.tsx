"use client";

import { useActionState } from "react";

import { FormAlert, SubmitButton, TextField } from "@/components/form";
import { SiteLink } from "@/components/site/site-link";
import { ROUTES } from "@/lib/routes";

import { emailCodeAction } from "../_lib/actions";
import { START_VIEW } from "../_lib/form-state";

export type EmailCodeFormLabels = {
  name: { label: string; hint: string };
  email: { label: string; hint: string };
  code: { label: string };
  sendCode: string;
  sending: string;
  verify: string;
  checking: string;
  resend: string;
  changeEmail: string;
  signUpInstead: string;
  /** common.callout words: meaning never by colour alone. */
  problem: string;
  done: string;
};

const LINK =
  "inline-flex min-h-11 items-center font-semibold text-link underline decoration-2 underline-offset-4 hover:text-link-hover";

/**
 * Sign up or sign in by email code, in two steps on one form: the email
 * (and, to sign up, a name), then the code we email. Every message comes
 * translated from the action; static words come in `labels`.
 */
export function EmailCodeForm({
  intent,
  labels,
}: {
  intent: "sign-up" | "sign-in";
  labels: EmailCodeFormLabels;
}) {
  const [view, formAction] = useActionState(emailCodeAction, START_VIEW);
  const { text } = view;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="intent" value={intent} />

      {text.alert ? (
        <FormAlert tone="danger" label={labels.problem}>
          <p>{text.alert}</p>
          {view.alert === "no_account" ? (
            <p>
              <SiteLink href={ROUTES.signUp.path} className={LINK}>
                {labels.signUpInstead}
              </SiteLink>
            </p>
          ) : null}
        </FormAlert>
      ) : text.sent ? (
        <FormAlert tone="success" label={labels.done}>
          <p>{text.sent}</p>
        </FormAlert>
      ) : null}

      {view.step === "email" ? (
        <>
          {intent === "sign-up" ? (
            <TextField
              id="name"
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              defaultValue={view.name}
              label={labels.name.label}
              hint={labels.name.hint}
              error={text.errors.name}
            />
          ) : null}
          <TextField
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            maxLength={254}
            defaultValue={view.email}
            label={labels.email.label}
            hint={labels.email.hint}
            error={text.errors.email}
          />
          <div>
            <SubmitButton
              name="step"
              value="email"
              pendingLabel={labels.sending}
            >
              {labels.sendCode}
            </SubmitButton>
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="email" value={view.email} />
          <input type="hidden" name="name" value={view.name} />
          <TextField
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            required
            label={labels.code.label}
            hint={text.codeHint}
            error={
              text.errors.code ?? (view.name ? undefined : text.errors.name)
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton
              name="step"
              value="code"
              pendingLabel={labels.checking}
            >
              {labels.verify}
            </SubmitButton>
            <SubmitButton
              name="step"
              value="email"
              variant="secondary"
              pendingLabel={labels.sending}
            >
              {labels.resend}
            </SubmitButton>
            <SubmitButton
              name="step"
              value="restart"
              variant="quiet"
              pendingLabel={labels.changeEmail}
            >
              {labels.changeEmail}
            </SubmitButton>
          </div>
        </>
      )}
    </form>
  );
}
