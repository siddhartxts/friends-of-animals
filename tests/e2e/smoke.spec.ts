import { expect, test } from "@playwright/test";

import { expectRendersAccessibly } from "./support/a11y";

// M0 smoke journey (#56): the existing public pages render, and axe finds
// nothing on any of them.

for (const path of ["/", "/donate", "/safeguarding"]) {
  test(`${path} renders with no axe violations`, async ({ page }) => {
    await expectRendersAccessibly(page, path);
  });
}

test("/competitions and a competition page render with no axe violations", async ({
  page,
}) => {
  await expectRendersAccessibly(page, "/competitions");
  const href = await page
    .locator('main a[href^="/competitions/"]')
    .first()
    .getAttribute("href");
  expect(href, "a competition linked from /competitions").toBeTruthy();
  await expectRendersAccessibly(page, href!);
});
