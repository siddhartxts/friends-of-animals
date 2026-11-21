import { createTranslator } from "next-intl";

import auth from "../../../messages/en-IN/auth.json";
import type { EmailMessage } from "../ports/email";

/** The email that carries a sign-in code, worded from messages/en-IN. */
export function codeEmail(
  to: string,
  code: string,
  minutes: number
): EmailMessage {
  const t = createTranslator({
    locale: "en-IN",
    messages: auth,
    namespace: "auth.email.code",
  });
  return {
    to,
    subject: t("subject"),
    text: t("text", { code, minutes }),
  };
}
