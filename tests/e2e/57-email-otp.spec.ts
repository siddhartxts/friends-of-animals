import { expect, test, type Page } from "@playwright/test";

import { SEED_ACCOUNTS } from "./support/accounts";
import {
  expectAccessible,
  expectAccessibleInDark,
  expectRendersAccessibly,
} from "./support/a11y";
import { freshEmail, latestCode, readCode } from "./support/mailbox";

// #57: sign up and sign in by email one-time code, reading the code from
// the preview's capture mailbox. Each test uses its own address, so runs and
// projects don't share codes or rate limits per address.

async function askForCode(page: Page, email: string) {
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByRole("status")).toContainText(
    `We've sent a code to ${email}.`
  );
}

async function enterCode(page: Page, code: string, button: string) {
  await page.getByRole("textbox", { name: "6-digit code" }).fill(code);
  await page.getByRole("button", { name: button }).click();
}

test("a visitor signs up by email code, signs out and signs back in", async ({
  page,
  request,
}, testInfo) => {
  const email = freshEmail(testInfo.project.name);

  await expectRendersAccessibly(page, "/sign-up");
  await expectAccessibleInDark(page, "/sign-up");
  await page.getByRole("textbox", { name: "Your name" }).fill("Asha Rao");
  await askForCode(page, email);
  await expectAccessible(page, "/sign-up, code step");

  const signUpCode = await readCode(request, email);
  await enterCode(page, signUpCode, "Create account");

  await expect(page).toHaveURL(/\/account\/sessions$/);
  await expect(
    page.getByText(`You're signed in as Asha Rao (${email}).`)
  ).toBeVisible();
  await expectAccessible(page, "/account/sessions");
  await expectAccessibleInDark(page, "/account/sessions");

  await page
    .getByRole("region", { name: "Signed in on" })
    .getByRole("listitem")
    .filter({ hasText: "This device" })
    .getByRole("button", { name: /^Sign out/ })
    .click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await askForCode(page, email);
  await enterCode(page, await readCode(request, email, signUpCode), "Sign in");
  await expect(page).toHaveURL(/\/account\/sessions$/);
  await expect(page.getByText(`(${email})`)).toBeVisible();
});

test("a seeded member signs in by email code", async ({
  page,
  request,
}, testInfo) => {
  // One member per project, so parallel projects never share a code.
  const member =
    SEED_ACCOUNTS.members[testInfo.project.name === "mobile" ? 1 : 0];

  await expectRendersAccessibly(page, "/sign-in");
  await expectAccessibleInDark(page, "/sign-in");
  const before = await latestCode(request, member.email);
  await askForCode(page, member.email);
  await expectAccessible(page, "/sign-in, code step");
  await enterCode(
    page,
    await readCode(request, member.email, before),
    "Sign in"
  );

  await expect(page).toHaveURL(/\/account\/sessions$/);
  await expect(
    page.getByText(`You're signed in as ${member.name} (${member.email}).`)
  ).toBeVisible();
});

test("a wrong code is refused and named on the field", async ({
  page,
}, testInfo) => {
  await page.goto("/sign-in");
  await askForCode(page, freshEmail(testInfo.project.name));

  await enterCode(page, "000000", "Sign in");

  const code = page.getByRole("textbox", { name: "6-digit code" });
  await expect(code).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("That code isn't right.")).toBeVisible();
  await expectAccessible(page, "/sign-in, wrong code");
});

test("a visitor who opens the sessions page is sent to sign in", async ({
  page,
}) => {
  await page.goto("/account/sessions");
  await expect(page).toHaveURL(/\/sign-in$/);
});
