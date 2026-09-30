import { test, expect, type Page } from "@playwright/test";
const user = {
  id: "auth-ui-test",
  full_name: "UI Test",
  email: "test@example.invalid",
  role: "patient",
  preferred_language: "en",
  phone: null,
};
async function mock(page: Page) {
  let signedIn = false;
  const calls: { path: string; body: Record<string, string> }[] = [];
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === "POST")
      calls.push({ path, body: route.request().postDataJSON() || {} });
    if (path === "/api/auth/me")
      return route.fulfill(
        signedIn
          ? { json: user }
          : { status: 401, json: { detail: "Sign in required" } },
      );
    if (path === "/api/auth/refresh")
      return route.fulfill({
        status: 401,
        json: { detail: "Sign in required" },
      });
    if (path === "/api/auth/confirm" || path === "/api/auth/login") {
      signedIn = true;
      return route.fulfill({ json: { authenticated: true } });
    }
    if (path === "/api/auth/register")
      return route.fulfill({ json: { confirmation_required: true } });
    if (path === "/api/auth/resend")
      return route.fulfill({ json: { sent: true } });
    if (path === "/api/auth/oauth/google")
      return route.fulfill({
        json: {
          url: "http://127.0.0.1:3107/auth/confirm?code=test-pkce-code&state=test-state&next=%2Fsal",
        },
      });
    return route.fulfill({ json: [] });
  });
  await page
    .context()
    .addCookies([
      { name: "clinic-locale", value: "en", url: "http://127.0.0.1:3107" },
    ]);
  return calls;
}
test("signup preserves destination and explains email confirmation", async ({
  page,
}) => {
  const calls = await mock(page);
  await page.goto("/auth?mode=signup&next=%2Fsal");
  await page.getByLabel("Full name", { exact: true }).fill("UI Test");
  await page.getByLabel("Email", { exact: true }).fill("test@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("test-password-only");
  await page
    .locator("form")
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByText(
      "Check your email. Open the confirmation link to continue where you left off.",
    ),
  ).toBeVisible();
  expect(calls.find((c) => c.path.endsWith("/register"))?.body.next).toBe(
    "/sal",
  );
  await page.getByRole("button", { name: "Resend confirmation email" }).click();
  await expect
    .poll(() => calls.filter((c) => c.path.endsWith("/resend")).length)
    .toBe(1);
});
test("token-hash callback exchanges once then restores destination", async ({
  page,
}) => {
  const calls = await mock(page);
  await page.goto(
    "/auth/confirm?token_hash=one-time-test-hash&type=signup&next=%2Fsal",
    { waitUntil: "domcontentloaded" },
  );
  await expect(page).toHaveURL(/\/sal$/);
  expect(calls.filter((c) => c.path.endsWith("/confirm"))).toEqual([
    {
      path: "/api/auth/confirm",
      body: { token_hash: "one-time-test-hash", type: "signup" },
    },
  ]);
  await page.reload();
  await expect(page.locator(".account-link")).toBeVisible();
});
test("default email fragment is exchanged and removed from address", async ({
  page,
}) => {
  const calls = await mock(page);
  await page.goto(
    "/auth/confirm?next=%2Fsal#access_token=test-access&refresh_token=test-refresh&type=signup",
    { waitUntil: "domcontentloaded" },
  );
  await expect(page).toHaveURL(/\/sal$/);
  expect(calls.find((c) => c.path.endsWith("/confirm"))?.body).toEqual({
    access_token: "test-access",
    refresh_token: "test-refresh",
  });
  expect(
    await page.evaluate(
      () => JSON.stringify(localStorage) + JSON.stringify(sessionStorage),
    ),
  ).not.toContain("test-access");
});
test("Google entry completes PKCE UI callback", async ({ page }) => {
  const calls = await mock(page);
  await page.goto("/auth?next=%2Fsal");
  await page
    .getByRole("button", { name: "Continue with Google", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sal$/);
  expect(calls.find((c) => c.path.endsWith("/google"))?.body.next).toBe("/sal");
  expect(calls.find((c) => c.path.endsWith("/confirm"))?.body).toEqual({
    code: "test-pkce-code",
    state: "test-state",
  });
});
test("invalid callback provides recovery without sending null credentials", async ({
  page,
}) => {
  const calls = await mock(page);
  await page.goto("/auth/confirm?error=access_denied&next=%2Fsal", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main").getByRole("alert")).toContainText("expired");
  expect(calls.filter((c) => c.path.endsWith("/confirm"))).toHaveLength(0);
  await page
    .getByRole("link", { name: "Sign in or resend confirmation" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/confirm$/);
  await expect(
    page.getByRole("button", { name: "Resend confirmation email" }),
  ).toBeVisible();
});
test("unsafe redirect is discarded and user reaches their account", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/auth?next=%2F%5Cevil.invalid");
  await page.getByLabel("Email", { exact: true }).fill("test@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("test-password-only");
  await page
    .locator("form")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
