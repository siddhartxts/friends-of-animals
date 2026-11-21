import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/**
 * The page in front of the test has a <main>, one h1 and no axe violations
 * under every default rule. `label` names it in failure messages.
 */
export async function expectAccessible(page: Page, label: string) {
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations.map(({ id, help, nodes }) => ({
      id,
      help,
      targets: nodes.map((node) => node.target.join(" ")),
    })),
    `axe violations on ${label}`
  ).toEqual([]);
}

/** Opens `path`, which must answer below 400, and checks it as above. */
export async function expectRendersAccessibly(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), `HTTP status of ${path}`).toBeLessThan(400);
  await expectAccessible(page, path);
}

/** The same checks with the dark theme on (`.dark` on <html>). */
export async function expectAccessibleInDark(page: Page, label: string) {
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expectAccessible(page, `${label} (dark)`);
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
}
