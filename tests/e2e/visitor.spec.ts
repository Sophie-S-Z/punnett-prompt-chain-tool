import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("visitor cannot read or mutate prompt data; icons remain public", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("Appearance")).toHaveValue("night");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Create and test prompt chains",
  );
  for (const path of ["/chains", "/runs", "/unknown"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
  }
  expect(
    (
      await context.request.get("/asset/00110000-0000-4000-8000-000000000001")
    ).status(),
  ).toBe(403);
  expect((await context.request.post("/chains", { data: "" })).status()).toBe(
    403,
  );
  for (const [path, mime] of [
    ["/icon.svg", "image/svg+xml"],
    ["/favicon.ico", "image/x-icon"],
    ["/apple-touch-icon.png", "image/png"],
  ]) {
    const response = await context.request.get(path);
    expect(response.status()).toBe(200);
    const types =
      path === "/favicon.ico" ? [mime, "image/vnd.microsoft.icon"] : [mime];
    expect(types).toContain(
      response.headers()["content-type"].split(";")[0].trim(),
    );
  }
  await page.getByLabel("Appearance").selectOption("system");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "lights-on");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
});
test("appearance follows system, persists selection, and remains accessible at mobile and desktop sizes", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/");
  for (const theme of ["lights-on", "night", "system"]) {
    await page.getByLabel("Appearance").selectOption(theme);
    await page.reload();
    await expect(page.getByLabel("Appearance")).toHaveValue(theme);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        scan.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    }
  }
});
test("Google initiation uses the exact callback on this origin", async ({
  page,
}) => {
  await page.goto("/");
  let redirect: string | null = null;
  await page.route("**/auth/v1/authorize**", async (route) => {
    redirect = new URL(route.request().url()).searchParams.get("redirect_to");
    await route.abort();
  });
  const origin = new URL(page.url()).origin;
  await page.getByRole("button", { name: "Sign in with Google" }).click();
  await expect.poll(() => redirect).toBe(`${origin}/auth/callback`);
});
