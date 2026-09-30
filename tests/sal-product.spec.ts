import { test, expect, type Page, type Route } from "@playwright/test";

// UI contract fixtures only. They intercept test-browser requests and are never
// bundled into the product or written to Supabase/Gemini.
const patient = {
  id: "10000000-0000-4000-8000-000000000001",
  role: "patient",
  full_name: "UI Test Patient",
  email: "test@example.invalid",
  preferred_language: "en",
  phone: null,
};
const conversation = "10000000-0000-4000-8000-000000000002";
const specialty = {
  id: "10000000-0000-4000-8000-000000000003",
  name_en: "UI Test Specialty",
  name_ar: "تخصص اختبار",
  name_he: "התמחות בדיקה",
  description: "",
  active: true,
};
const service = {
  ...specialty,
  id: "10000000-0000-4000-8000-000000000004",
  name_en: "UI Test Video Visit",
  price: 100,
  duration_minutes: 30,
  consultation_type: "video",
};
const doctor = {
  id: "10000000-0000-4000-8000-000000000005",
  full_name: "UI Fixture Clinician",
  bio: "Synthetic browser-test record. Never published.",
  experience_years: 5,
  consultation_fee: 100,
  languages: ["en", "ar"],
  profile_image: null,
  specialty_id: specialty.id,
  status: "approved",
  specialties: specialty,
  services: [service],
  doctor_locations: [
    {
      id: "location",
      city: "Test City",
      address: "Test address",
      clinic_name: "UI Test Clinic",
    },
  ],
};
const slots = [
  {
    id: "10000000-0000-4000-8000-000000000006",
    doctor_id: doctor.id,
    date: "2030-01-02",
    start_time: "10:00:00",
    end_time: "10:30:00",
    is_booked: false,
  },
];
const answer =
  "I can help you explore the available care options. What would you like to add?";
const reply = {
  conversation_id: conversation,
  message: {
    id: "reply-1",
    role: "assistant",
    content: answer,
    created_at: "2026-09-27T00:00:00Z",
  },
  urgent: false,
  doctors: [doctor],
  sources: [{ id: "source-1", title: "UI Test Navigation Guide" }],
};

async function setup(page: Page, authenticated = true) {
  let signedIn = authenticated;
  const requests: {
    message: string;
    locale: string;
    conversation_id?: string;
  }[] = [];
  const bookings: Record<string, string>[] = [];
  let respond: (route: Route) => Promise<void> = async (route) =>
    route.fulfill({
      json: {
        ...reply,
        message: { ...reply.message, id: `reply-${requests.length}` },
      },
    });
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path === "/api/auth/me")
      return route.fulfill(
        signedIn
          ? { json: patient }
          : { status: 401, json: { detail: "Sign in required" } },
      );
    if (path === "/api/auth/refresh")
      return route.fulfill({
        status: 401,
        json: { detail: "Sign in required" },
      });
    if (path === "/api/auth/login") {
      signedIn = true;
      return route.fulfill({ json: { authenticated: true } });
    }
    if (path === "/api/auth/logout") {
      signedIn = false;
      return route.fulfill({ json: { authenticated: false } });
    }
    if (path === "/api/specialties")
      return route.fulfill({ json: [specialty] });
    if (path === "/api/doctors") return route.fulfill({ json: [doctor] });
    if (path === `/api/doctors/${doctor.id}`)
      return route.fulfill({ json: { ...doctor, availability: slots } });
    if (path === `/api/doctors/${doctor.id}/availability`)
      return route.fulfill({ json: slots });
    if (path === "/api/sal/chat") {
      requests.push(route.request().postDataJSON());
      return respond(route);
    }
    if (path === "/api/appointments" && route.request().method() === "POST") {
      bookings.push(route.request().postDataJSON());
      return route.fulfill({ json: { id: "synthetic-appointment", status: "pending" } });
    }
    if (path === `/api/sal/conversations/${conversation}`)
      return route.fulfill({
        json: [
          {
            id: "old-user",
            role: "user",
            content: "My saved test message",
            created_at: "2026-09-26T00:00:00Z",
          },
          { ...reply.message, content: "Your saved conversation is here." },
        ],
      });
    if (path === "/api/sal/conversations")
      return route.fulfill({
        json: [{ id: conversation, created_at: "2026-09-26T00:00:00Z" }],
      });
    if (path === "/api/patient/appointments")
      return route.fulfill({ json: [] });
    return route.fulfill({
      status: 404,
      json: { detail: `Unhandled test request: ${path}` },
    });
  });
  return {
    requests,
    bookings,
    setResponder: (fn: typeof respond) => {
      respond = fn;
    },
  };
}

async function english(page: Page, path = "/") {
  await page.goto(path);
  await page.getByLabel("Language", { exact: true }).selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
}

test("SAL, input and action fit the first mobile viewport in all languages", async ({
  page,
}) => {
  await setup(page, false);
  for (const [width, height] of [
    [390, 844],
    [320, 568],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    for (const locale of ["ar", "en", "he"]) {
      await page.getByLabel("Language", { exact: true }).selectOption(locale);
      const image = page.locator(".sal-character-art img");
      await expect(image).toBeVisible();
      await expect(page.locator(".sal-writing-desk textarea")).toBeInViewport();
      const geometry = await page.evaluate(() => ({
        action: document.querySelector(".sal-send")!.getBoundingClientRect(),
        bottomNav: document
          .querySelector(".mobile-nav")!
          .getBoundingClientRect().top,
        width: document.documentElement.scrollWidth,
        viewport: innerWidth,
        image: document
          .querySelector(".sal-character-art img")!
          .getBoundingClientRect(),
      }));
      expect(geometry.action.bottom, `${locale} ${width}`).toBeLessThanOrEqual(
        geometry.bottomNav,
      );
      expect(geometry.width).toBeLessThanOrEqual(geometry.viewport);
      expect(geometry.image.width / geometry.image.height).toBeCloseTo(1, 2);
      await expect(
        page.locator(".sal-doctor-option, .sal-home .doctor-card"),
      ).toHaveCount(0);
    }
  }
});

test("guests chat before authentication and booking preserves the chosen doctor", async ({
  page,
}) => {
  const api = await setup(page, false);
  api.setResponder(async (route) =>
    route.fulfill({ json: { ...reply, conversation_id: null } }),
  );
  await english(page);
  await page
    .getByRole("textbox", { name: "Your message to SAL" })
    .fill("Help me choose care.");
  await page
    .getByRole("button", { name: "Start with SAL", exact: true })
    .click();
  await expect(page.locator(".sal-entry-assistant")).toHaveCount(1);
  await expect(page).toHaveURL("/");
  expect(api.requests).toHaveLength(1);
  await page.getByRole("link", { name: "Choose a time", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("dialog")).toContainText("continuing your selected booking");
  await page.getByLabel("Email", { exact: true }).fill("test@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("test-password-only");
  await page
    .locator("form")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/booking/${doctor.id}\\?mode=video`),
  );
  await expect(
    page.getByRole("combobox", { name: "Service", exact: true }),
  ).toHaveValue(service.id);
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Confirm appointment request", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Appointment requested", exact: true })).toBeVisible();
  expect(api.bookings).toHaveLength(1);
  expect(api.bookings[0]).toMatchObject({ doctor_id: doctor.id, service_id: service.id, slot_id: slots[0].id });
  await expect(page.locator("main")).toContainText("pending the clinician’s confirmation");
});

test("auth modal keeps the guest draft, traps focus and returns it on Escape", async ({ page }) => {
  await setup(page, false);
  await english(page);
  await page.getByRole("textbox", { name: "Your message to SAL" }).fill("My unsent consultation");
  const trigger = page.locator(".header-auth").getByRole("link", { name: "Create account", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Full name", { exact: true })).toBeVisible();
  await expect(page).toHaveURL("/");
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBeTruthy();
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Your message to SAL" })).toHaveValue("My unsent consultation");
  await expect(page.locator(".sal-character-art img")).toHaveAttribute("src", /listening/);
});

test("official SAL is prominent on desktop and respects reduced motion", async ({ page }) => {
  await setup(page, false);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await english(page);
  const stage = page.locator(".sal-session-stage .sal-character-stage");
  expect((await stage.boundingBox())!.width).toBeGreaterThanOrEqual(350);
  await expect(page.locator(".sal-character-art img")).toHaveAttribute("src", /waving/);
  expect(await page.locator(".sal-character-art").evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  await expect(page.getByRole("button", { name: "Voice input — coming soon" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Attachments — coming soon" })).toBeDisabled();
});

test("real API contract drives thinking, replies, recommendations and booking navigation", async ({
  page,
}, testInfo) => {
  const api = await setup(page);
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  api.setResponder(async (route) => {
    await pending;
    await route.fulfill({ json: reply });
  });
  await english(page);
  await page
    .getByRole("textbox", { name: "Your message to SAL" })
    .fill("Please help me find care.");
  await expect(page.locator(".sal-character")).toHaveAttribute(
    "data-state",
    "listening",
  );
  await page
    .getByRole("button", { name: "Start with SAL", exact: true })
    .click();
  await expect(page.locator(".sal-character")).toHaveAttribute(
    "data-state",
    "thinking",
  );
  await expect(page.locator(".sal-character-art img")).toHaveAttribute("src", /thinking/);
  await expect(
    page.getByRole("textbox", { name: "Your message to SAL" }),
  ).toBeDisabled();
  await expect(page.locator(".sal-doctor-option")).toHaveCount(0);
  finish();
  await expect(page.locator(".sal-entry-assistant")).toHaveText(
    /I can help you explore/,
  );
  await expect(page.locator(".sal-character")).toHaveAttribute(
    "data-state",
    "recommendation",
  );
  await expect(page.locator(".sal-character-art img")).toHaveAttribute("src", /booking/);
  expect(api.requests).toEqual([
    { message: "Please help me find care.", locale: "en" },
  ]);
  await expect(page.locator(".sal-doctor-option")).toContainText(
    "UI Fixture Clinician",
  );
  await expect(page.locator(".sal-doctor-option")).toContainText(
    "UI Test Specialty",
  );
  await expect(page.locator(".sal-doctor-option")).toContainText("Test City");
  await expect(page.locator(".sal-doctor-option")).toContainText("2030-01-02");
  await page.locator(".sal-sources summary").click();
  await expect(page.locator(".sal-sources")).toContainText(
    "UI Test Navigation Guide",
  );
  await page
    .locator(".sal-character-art img")
    .evaluate((img: HTMLImageElement) => img.decode());
  await expect(page.locator(".sal-results-jump")).toBeVisible();
  await page
    .locator(".sal-experience")
    .screenshot({ path: testInfo.outputPath("sal-response-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".sal-recommendations")
    .screenshot({ path: testInfo.outputPath("sal-response-mobile.png") });
  await page.getByRole("link", { name: "Choose a time", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/booking/${doctor.id}\\?mode=video`),
  );
  await expect(
    page.getByRole("combobox", { name: "Service", exact: true }),
  ).toHaveValue(service.id);
  await expect(page.getByRole("radio")).toHaveCount(1);
});

test("follow-ups retain conversation ID; navigation preserves the current conversation", async ({
  page,
}) => {
  const api = await setup(page);
  await english(page);
  await page
    .getByRole("textbox", { name: "Your message to SAL" })
    .fill("First test message");
  await page
    .getByRole("button", { name: "Start with SAL", exact: true })
    .click();
  await expect(page.locator(".sal-entry-assistant")).toHaveCount(1);
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "Start with SAL" })
    .click();
  await expect(page).toHaveURL(/\/sal$/);
  await expect(page.locator(".sal-entry-assistant")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Your message to SAL" })
    .fill("Second test message");
  await page.getByRole("button", { name: "Send to SAL", exact: true }).click();
  await expect(page.locator(".sal-entry-assistant")).toHaveCount(2);
  expect(api.requests[1].conversation_id).toBe(conversation);
});

test("failed replies retain the draft and never fabricate an answer", async ({
  page,
}) => {
  const api = await setup(page);
  api.setResponder(async (route) => {
    await route.fulfill({
      status: 503,
      json: { detail: "SAL temporarily unavailable" },
    });
  });
  await english(page);
  await page
    .getByRole("textbox", { name: "Your message to SAL" })
    .fill("Keep this test draft");
  await page
    .getByRole("button", { name: "Start with SAL", exact: true })
    .click();
  await expect(page.locator(".sal-request-error")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Your message to SAL" }),
  ).toHaveValue("Keep this test draft");
  await expect(
    page.locator(".sal-entry-assistant, .sal-doctor-option"),
  ).toHaveCount(0);
  expect(api.requests).toHaveLength(1);
});

test("saved conversations load, new conversation resets, and urgent replies hide booking", async ({
  page,
}) => {
  const api = await setup(page);
  await english(page, `/sal?conversation=${conversation}`);
  await expect(page.locator(".sal-entry-assistant")).toContainText(
    "Your saved conversation is here.",
  );
  await page.getByRole("button", { name: "New conversation" }).click();
  await expect(page).toHaveURL(/\/sal$/);
  await expect(page.locator(".sal-entry")).toHaveCount(0);
  api.setResponder(async (route) => {
    await route.fulfill({ json: { ...reply, urgent: true } });
  });
  await page
    .getByRole("textbox", { name: "Your message to SAL" })
    .fill("Synthetic urgent-path test");
  await page
    .getByRole("button", { name: "Start with SAL", exact: true })
    .click();
  await expect(page.locator(".sal-urgent")).toBeVisible();
  await expect(page.locator(".sal-doctor-option")).toHaveCount(0);
});

test("empty recommendations offer a next step and sign-out clears private messages", async ({
  page,
}) => {
  const api = await setup(page);
  api.setResponder(async (route) => {
    await route.fulfill({ json: { ...reply, doctors: [], sources: [] } });
  });
  await english(page);
  await page
    .getByRole("textbox", { name: "Your message to SAL" })
    .fill("Private synthetic test message");
  await page
    .getByRole("button", { name: "Start with SAL", exact: true })
    .click();
  await expect(page.locator(".sal-recommendations")).toContainText(
    "SAL did not return doctors",
  );
  await page.locator(".account-link").click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "Start with SAL" })
    .click();
  await expect(page.locator(".sal-entry")).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Your message to SAL" }),
  ).toHaveValue("");
});

test("guest service failure preserves context and retries without requiring sign-in", async ({ page }) => {
  const api = await setup(page, false);
  api.setResponder(async route => route.fulfill({status:503,json:{detail:"SAL temporarily unavailable"}}));
  await english(page);
  const message="A synthetic retry check";
  await page.getByRole("textbox",{name:"Your message to SAL"}).fill(message);
  await page.locator(".sal-send").click();
  await expect(page.locator(".sal-request-error")).toContainText("draft is still here");
  await expect(page.getByRole("textbox",{name:"Your message to SAL"})).toHaveValue(message);
  api.setResponder(async route=>route.fulfill({json:{...reply,conversation_id:null}}));
  await page.getByRole("button",{name:"Try again",exact:true}).click();
  await expect(page.locator(".sal-entry-assistant")).toHaveCount(1);
  expect(api.requests).toHaveLength(2);
  await expect(page).toHaveURL("/");
});

for (const [code, phrase] of [
  ["AI_UNAVAILABLE", "AI service is busy"],
  ["BACKEND_UNAVAILABLE", "server could not be reached"],
  ["RAG_UNAVAILABLE", "knowledge service"],
  ["CONVERSATION_SAVE_FAILED", "could not be loaded or saved"],
] as const) {
  test(`SAL exposes ${code} without losing the draft`, async ({ page }) => {
    const api = await setup(page, false);
    api.setResponder(async route => route.fulfill({status:503,json:{detail:{code,message:"Service unavailable"}}}));
    await english(page);
    await page.getByRole("textbox",{name:"Your message to SAL"}).fill("Synthetic diagnostic check");
    await page.locator(".sal-send").click();
    await expect(page.locator(".sal-request-error")).toContainText(phrase);
    await expect(page.getByRole("textbox",{name:"Your message to SAL"})).toHaveValue("Synthetic diagnostic check");
    await expect(page.locator(".sal-entry-assistant")).toHaveCount(0);
  });
}
