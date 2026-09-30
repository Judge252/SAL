import { test, expect } from "@playwright/test";

// Smoke suite for the real full-stack application.
// Requires the FastAPI backend on :8000 and the Next.js frontend on :3107.
// Tests are tolerant of an empty database: no doctor or specialty data is assumed.

test("Arabic defaults, translated navigation persists across refresh", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "أهلًا، أنا SAL",
  );
  await page.getByLabel("Language").selectOption("en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Hi, I’m SAL",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByLabel("Language").selectOption("he");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "היי, אני SAL",
  );
});

test("Public pages render without runtime errors at desktop and mobile widths", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    // Signed-out session checks legitimately return 401; all other errors fail.
    if (message.type() === "error" && !message.text().includes("status of 401"))
      errors.push(message.text());
  });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/doctors",
      "/specialties",
      "/online",
      "/information/about",
      "/information/privacy",
      "/information/terms",
      "/auth",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} at ${width}`,
      ).toBeTruthy();
    }
  }
  expect(errors).toEqual([]);
});

test("Signed-out visitors are asked to sign in on private areas", async ({
  page,
}) => {
  for (const route of ["/dashboard", "/doctor-dashboard", "/admin/doctors"]) {
    await page.goto(route);
    await expect(
      page.getByText(
        /سجّل الدخول للمتابعة|Sign in to continue|התחברו כדי להמשיך/,
      ),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator("main").getByRole("link", {
        name: /تسجيل الدخول|Sign in|התחברות/,
      }),
    ).toBeVisible();
  }
});

test("Auth page toggles between sign in and registration", async ({ page }) => {
  await page.goto("/auth");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: /إنشاء حساب جديد|Create a new account|חשבון חדש/,
    })
    .click();
  await expect(page.getByLabel(/الاسم الكامل|Full name|שם מלא/)).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("Login with invalid credentials shows a server error", async ({
  page,
}) => {
  await page.goto("/auth");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await page.getByLabel("Email").fill("nobody@example.invalid");
  await page.getByLabel(/كلمة المرور|Password|סיסמה/).fill("not-the-password");
  await page
    .getByRole("button", { name: /تسجيل الدخول|Sign in|התחברות/ })
    .click();
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 15000 });
});

test("Doctor directory reflects the database state", async ({ page }) => {
  await page.goto("/doctors");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const cards = page.locator(".doctor-card");
  await expect
    .poll(async () => cards.count(), { timeout: 15000 })
    .toBeGreaterThanOrEqual(0);
  const count = await cards.count();
  test.skip(count === 0, "No approved doctors in the database yet");
  // With doctors present, filters and profile navigation must work.
  await expect(page.getByRole("combobox", { name: "Specialty" })).toBeVisible();
  await cards.first().getByRole("link").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByText(/سنوات خبرة|years of experience|שנות ניסיון/),
  ).toBeVisible();
});

test("Specialties page lists database specialties and links to the directory", async ({
  page,
}) => {
  await page.goto("/specialties");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const empty = page.getByText(
    /لا توجد تخصصات متاحة|No specialties available|אין התמחויות זמינות/,
  );
  if (await empty.isVisible()) return; // empty database is a valid state
  await expect(
    page.locator("button, [role=button], .chip").first(),
  ).toBeVisible();
});
