// Every namespace file, imported statically so the merged messages are typed
// and bundled at build time. One file per namespace: each agent edits its own.
// Adding a namespace: create messages/en-IN/<name>.json ({ "<name>": {} }),
// import it here and add it to NAMESPACES and `messages`.
import a11y from "../../messages/en-IN/a11y.json";
import account from "../../messages/en-IN/account.json";
import about from "../../messages/en-IN/about.json";
import auth from "../../messages/en-IN/auth.json";
import awareness from "../../messages/en-IN/awareness.json";
import common from "../../messages/en-IN/common.json";
import competitions from "../../messages/en-IN/competitions.json";
import contact from "../../messages/en-IN/contact.json";
import credits from "../../messages/en-IN/credits.json";
import donate from "../../messages/en-IN/donate.json";
import error from "../../messages/en-IN/error.json";
import footer from "../../messages/en-IN/footer.json";
import home from "../../messages/en-IN/home.json";
import impact from "../../messages/en-IN/impact.json";
import legal from "../../messages/en-IN/legal.json";
import nav from "../../messages/en-IN/nav.json";
import notFound from "../../messages/en-IN/notFound.json";
import pricing from "../../messages/en-IN/pricing.json";
import refunds from "../../messages/en-IN/refunds.json";
import sample from "../../messages/en-IN/sample.json";
import schools from "../../messages/en-IN/schools.json";
import showcase from "../../messages/en-IN/showcase.json";
import stories from "../../messages/en-IN/stories.json";
import styleguide from "../../messages/en-IN/styleguide.json";

export const NAMESPACES = [
  "a11y",
  "account",
  "about",
  "auth",
  "awareness",
  "common",
  "competitions",
  "contact",
  "credits",
  "donate",
  "error",
  "footer",
  "home",
  "impact",
  "legal",
  "nav",
  "notFound",
  "pricing",
  "refunds",
  "sample",
  "schools",
  "showcase",
  "stories",
  "styleguide",
] as const;

export type Namespace = (typeof NAMESPACES)[number];

/** en-IN messages, merged: { common: {...}, nav: {...}, ... }. */
export const messages = {
  ...a11y,
  ...account,
  ...about,
  ...auth,
  ...awareness,
  ...common,
  ...competitions,
  ...contact,
  ...credits,
  ...donate,
  ...error,
  ...footer,
  ...home,
  ...impact,
  ...legal,
  ...nav,
  ...notFound,
  ...pricing,
  ...refunds,
  ...sample,
  ...schools,
  ...showcase,
  ...stories,
  ...styleguide,
};

export type Messages = typeof messages;
