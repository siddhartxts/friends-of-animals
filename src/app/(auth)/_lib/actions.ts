"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { APP_ROUTES } from "@/lib/app-routes";
import { as, currentActor } from "@/server/app";
import { EMAIL_CODE } from "@/server/identity/settings";

import {
  afterRequest,
  afterVerify,
  START,
  type EmailCodeFormState,
  type EmailCodeFormView,
  type FormField,
} from "./form-state";

async function withText(state: EmailCodeFormState): Promise<EmailCodeFormView> {
  const t = await getTranslations("auth.form");
  const errors: Partial<Record<FormField, string>> = {};
  if (state.fieldErrors?.email) errors.email = t("email.error");
  if (state.fieldErrors?.name) errors.name = t("name.error");
  if (state.fieldErrors?.code) errors.code = t("code.error");
  let alert: string | undefined;
  if (state.alert === "rate_limited") {
    alert = t("alerts.rate_limited", {
      minutes: state.retryAfterMinutes ?? 15,
    });
  } else if (state.alert) {
    alert = t(`alerts.${state.alert}`);
  }
  return {
    ...state,
    text: {
      alert,
      sent: state.sent ? t("sent", { email: state.email }) : undefined,
      codeHint:
        state.step === "code"
          ? t("code.hint", {
              email: state.email,
              minutes: EMAIL_CODE.lifetimeMinutes,
            })
          : undefined,
      errors,
    },
  };
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * The sign-up and sign-in form's one action. `step` (from the pressed
 * button) says what to do: email a code, check the code, or start again.
 */
export async function emailCodeAction(
  _previous: EmailCodeFormView,
  formData: FormData
): Promise<EmailCodeFormView> {
  const intent =
    field(formData, "intent") === "sign-up" ? "sign-up" : "sign-in";
  const step = field(formData, "step") || "email";
  const entered = {
    email: field(formData, "email"),
    name: field(formData, "name"),
  };

  const actor = await currentActor();
  if (actor.kind !== "visitor") redirect(APP_ROUTES.accountSessions);
  if (step === "restart") return withText({ ...START, name: entered.name });

  try {
    if (step === "code") {
      const code = field(formData, "code");
      const result = await as(actor).verifyEmailCode(
        intent === "sign-up"
          ? { intent, ...entered, code }
          : { intent, email: entered.email, code }
      );
      if (!result.ok) {
        return withText(afterVerify(result, { step: "code", ...entered }));
      }
    } else {
      return withText(
        afterRequest(
          await as(actor).requestEmailCode({ email: entered.email }),
          entered
        )
      );
    }
  } catch (error) {
    // The details stay in the server logs (no personal data in them).
    console.error("Email code form: the use case failed.", error);
    return withText({
      step: step === "code" ? "code" : "email",
      ...entered,
      alert: "failed",
    });
  }
  // Signed in: the session cookie is set. Outside the try, because
  // redirect() works by throwing.
  redirect(APP_ROUTES.accountSessions);
}
