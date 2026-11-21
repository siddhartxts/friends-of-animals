import {
  expect,
  test,
  type Browser,
  type Page,
  type TestInfo,
} from "@playwright/test";

import { expectAccessible, expectAccessibleInDark } from "./support/a11y";
import { freshEmail, readCode } from "./support/mailbox";

// #57: a member sees where they are signed in and signs out of one session,
// or all of them. Two browser contexts stand in for two devices.

/** Another browser with this project's settings (base URL, bypass cookie). */
async function secondDevice(browser: Browser, testInfo: TestInfo) {
  const { baseURL, storageState, viewport, userAgent } = testInfo.project.use;
  const context = await browser.newContext({
    baseURL,
    storageState,
    viewport,
    userAgent,
    reducedMotion: "reduce",
  });
  return context.newPage();
}

async function signInWithCode(
  page: Page,
  request: Parameters<typeof readCode>[0],
  email: string,
  after?: string
) {
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByRole("status")).toContainText(email);
  const code = await readCode(request, email, after);
  await page.getByRole("textbox", { name: "6-digit code" }).fill(code);
  await page
    .getByRole("button", { name: /^(Create account|Sign in)$/ })
    .click();
  await expect(page).toHaveURL(/\/account\/sessions$/);
  return code;
}

test("a member signs out of another device, then everywhere", async ({
  browser,
  page,
  request,
}, testInfo) => {
  const email = freshEmail(testInfo.project.name);

  // First device: sign up.
  const laptop = await secondDevice(browser, testInfo);
  await laptop.goto("/sign-up");
  await laptop.getByRole("textbox", { name: "Your name" }).fill("Meera Iyer");
  const firstCode = await signInWithCode(laptop, request, email);

  // Second device: sign in. Both sessions are listed; this one is marked.
  await page.goto("/sign-in");
  await signInWithCode(page, request, email, firstCode);
  const sessions = page
    .getByRole("region", { name: "Signed in on" })
    .getByRole("listitem");
  await expect(sessions).toHaveCount(2);
  await expect(sessions.filter({ hasText: "This device" })).toHaveCount(1);
  await expectAccessible(page, "/account/sessions with two sessions");
  await expectAccessibleInDark(page, "/account/sessions with two sessions");

  // Sign the first device out from the second.
  await sessions
    .filter({ hasNotText: "This device" })
    .getByRole("button", { name: /^Sign out/ })
    .click();
  await expect(sessions).toHaveCount(1);
  await laptop.goto("/account/sessions");
  await expect(laptop).toHaveURL(/\/sign-in$/);

  // Sign out everywhere: this device too.
  await page.getByRole("button", { name: "Sign out everywhere" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/account/sessions");
  await expect(page).toHaveURL(/\/sign-in$/);

  await laptop.context().close();
});
