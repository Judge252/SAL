import { test, expect } from "@playwright/test";

test("Arabic defaults, translated navigation persists across refresh", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "ابحث عن طبيب",
  );
  await page.getByLabel("Language").selectOption("en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Find your doctor",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByLabel("Language").selectOption("he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "מצאו את הרופא",
  );
});
test("Discovery filters, empty state, saving and booking cancellation", async ({
  page,
}) => {
  await page.goto("/doctors");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await page
    .getByRole("combobox", { name: "Specialty", exact: true })
    .selectOption("dermatology");
  await expect(page.locator(".doctor-card")).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "City", exact: true })
    .selectOption("jaffa");
  await expect(page.getByText("No matching doctors")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(page.locator(".doctor-card")).toHaveCount(10);
  await page.getByRole("button", { name: "Save doctor" }).first().click();
  await page
    .getByRole("link", { name: "Dr. Lina Mansour", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Dr. Lina Mansour",
  );
  await page.getByRole("link", { name: "Choose an appointment" }).click();
  await expect(
    page.getByRole("button", { name: "Continue to your details" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "09:00", exact: true }).click();
  await page.getByRole("button", { name: "Continue to your details" }).click();
  await page.getByLabel("Full name").fill("Demo Patient");
  await page.getByLabel("Phone number").fill("0500000000");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirm demo booking" }).click();
  await expect(page.getByText("Your demo visit is set.")).toBeVisible();
  await page.getByRole("link", { name: "Go to my care" }).click();
  await expect(page.getByText("Confirmed · Demo")).toBeVisible();
  await page.getByRole("tab", { name: "Saved doctors" }).click();
  await expect(page.locator(".doctor-card")).toHaveCount(1);
  await page.getByRole("tab", { name: "Appointments" }).click();
  await page.getByRole("button", { name: "Cancel visit", exact: true }).click();
  await page.getByRole("button", { name: "Yes, cancel" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
});
test("SAL intake completes and leads to family doctor discovery", async ({
  page,
}) => {
  await page.goto("/sal");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await page.getByRole("button", { name: "A general checkup" }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.getByRole("button", { name: "Mild", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Your message to SAL" })
    .waitFor({ state: "hidden" })
    .catch(() => {});
  await page
    .getByRole("spinbutton", { name: "Your message to SAL" })
    .fill("30");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByRole("button", { name: "Haifa", exact: true }).click();
  await expect(page.getByText("A little more clarity.")).toBeVisible();
  await page
    .getByRole("link", { name: "Explore doctors", exact: true })
    .click();
  await expect(page.locator(".doctor-card")).toHaveCount(2);
});
test("Urgent symptom route blocks booking and remains blocked after navigation", async ({
  page,
}) => {
  await page.goto("/sal");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await page
    .getByRole("textbox", { name: "Your message to SAL" })
    .fill("chest pain");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("log").getByRole("alert")).toContainText(
    "Your safety comes first",
  );
  await expect(page.getByRole("button", { name: "Send message" })).toHaveCount(
    0,
  );
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "Find a doctor" })
    .click();
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "Ask SAL" })
    .click();
  await expect(page.getByRole("log").getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Start fresh" }).click();
  await expect(
    page.getByRole("textbox", { name: "Your message to SAL" }),
  ).toBeVisible();
});
test("Document metadata and doctor workspace interactions", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await page.getByRole("tab", { name: "Documents" }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "demo.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 demo"),
  });
  await expect(page.getByText("demo.pdf", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove document" }).click();
  await expect(page.getByText("demo.pdf", { exact: true })).toHaveCount(0);
  await page.goto("/doctor-dashboard");
  await page.getByRole("tab", { name: "Patient requests" }).click();
  await page
    .getByRole("button", { name: "Accept", exact: true })
    .first()
    .click();
  await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Schedule", exact: true }).click();
  await expect(page.getByText("Tomorrow · Confirmed")).toBeVisible();
  await page.getByRole("button", { name: "12:00 Closed" }).click();
  await expect(
    page.getByRole("button", { name: "12:00 Available" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: "Manage profile" }).click();
  await page.getByLabel("About you").fill("An illustrative doctor profile.");
  await page.getByRole("button", { name: "Save demo changes" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Changes saved for this page.",
  );
});
test("All screens are responsive and free of runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    for (const route of [
      "/",
      "/sal",
      "/doctors",
      "/doctors/lina-mansour",
      "/booking/lina-mansour",
      "/dashboard",
      "/doctor-dashboard",
      "/specialties",
      "/online",
      "/information/privacy",
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

test("Home search passes doctor, city and consultation filters to results", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await page
    .getByRole("textbox", { name: "Doctor or specialty" })
    .fill("Dermatology");
  await page
    .getByRole("combobox", { name: "Where?", exact: true })
    .selectOption("haifa");
  await page
    .locator(".care-search")
    .getByRole("button", { name: "Find a doctor", exact: true })
    .click();
  await expect(page.locator(".doctor-card")).toHaveCount(1);
  await expect(page.locator(".doctor-card")).toContainText("Dr. Nour Haddad");
  await expect(
    page.getByRole("combobox", { name: "City", exact: true }),
  ).toHaveValue("haifa");
});

test("Specialty selection handles available and empty specialties", async ({
  page,
}) => {
  await page.goto("/specialties");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await page.getByRole("button", { name: /Ear, nose/ }).click();
  await expect(
    page.getByText(
      "No profiles in this specialty are available in the demo yet.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: /Family medicine/ }).click();
  await page.getByRole("link", { name: "View specialists" }).click();
  await expect(page.locator(".doctor-card")).toHaveCount(2);
});

test("Online consultation and chosen slot carry through to the patient appointment", async ({
  page,
}) => {
  await page.goto("/online");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await page
    .locator(".doctor-card")
    .first()
    .getByRole("link", { name: "Book 09:00", exact: true })
    .click();
  await expect(
    page.getByRole("radio", { name: "Video consultation", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("button", { name: "09:00", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Continue to your details" }).click();
  await page.getByLabel("Full name").fill("Sample Patient");
  await page.getByLabel("Phone number").fill("0500000000");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirm demo booking" }).click();
  await page.getByRole("link", { name: "Go to my care" }).click();
  await expect(page.locator(".appointment-row")).toContainText(
    "Video consultation",
  );
});

test("Mobile filters, readable controls and unclipped original logos in all locales", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/doctors");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Consultation type", exact: true })
    .selectOption("video");
  await expect(page.locator(".doctor-card")).toHaveCount(7);
  for (const locale of ["ar", "en", "he"]) {
    await page.getByLabel("Language", { exact: true }).selectOption(locale);
    for (const route of [
      "/",
      "/sal",
      "/doctors",
      "/specialties",
      "/online",
      "/booking/lina-mansour",
    ]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${locale}: ${route}`,
      ).toBeTruthy();
      const logo = page.locator("header .clinic-mark img");
      const size = await logo.boundingBox();
      expect(size!.width / size!.height).toBeCloseTo(1672 / 941, 1);
      expect(
        await logo.evaluate(
          (el) => getComputedStyle(el.parentElement!).overflow,
        ),
      ).toBe("visible");
    }
  }
});

test("Dashboard tabs support keyboard navigation and SAL notice clears mobile navigation", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await page.getByRole("tab", { name: "Appointments" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Saved doctors" })).toBeFocused();
  await expect(
    page.getByRole("tab", { name: "Saved doctors" }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Documents" })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sal");
  await page.getByLabel("Language", { exact: true }).selectOption("ar");
  await page.evaluate(() => document.fonts.ready);
  const notice = await page.locator(".composer-note").boundingBox();
  const nav = await page.locator(".mobile-nav").boundingBox();
  expect(notice!.y + notice!.height).toBeLessThanOrEqual(nav!.y);
});
