import { test, expect } from "@playwright/test";

/**
 * The whole point of this build, exercised end to end: the /contact form's success
 * or error state must be driven by the real response from POST /api/contact — never
 * by a timer. Before this feature, all three public contact forms faked success with
 * a `setTimeout` and threw the submission away.
 *
 * This test does not assume which way Mailgun answers. Whatever CONTACT_RECIPIENT/
 * MAILGUN_* say in the environment the server was started with, the assertion is the
 * same invariant either way: the UI's success state may appear ONLY when the POST
 * actually returned 2xx, and the error state must appear otherwise. That is exactly
 * the bug this feature fixed — a reintroduced fake `setTimeout` success would violate
 * it in one of two ways, both caught below:
 *
 *   - a fetch-less fake (the original bug): no request to /api/contact is ever made,
 *     so `waitForResponse` below times out and the test fails.
 *   - a fetch-and-ignore fake: the request fires but the UI shows "Message Sent"
 *     regardless of its outcome; if the server said no, the branch below that asserts
 *     the success button must NOT appear catches it.
 *
 * At the time this test was written, Mailgun is configured with a sandbox domain that
 * only delivers to authorized recipients, so the admin notification send fails and the
 * route returns 500 — a real failure, not a code defect (see mg-task-7-brief.md). That
 * makes the error path the deterministic outcome today. Once the sending domain is
 * verified in Mailgun, the same test will exercise the success path instead, without
 * any change here.
 */

async function fillContactForm(page) {
  await page.goto("/contact");
  await page.locator('input[name="name"]').fill("E2E Test User");
  await page.locator('input[name="email"]').fill("e2e-test@example.com");
  await page.locator('input[name="phone"]').fill("512-555-0100");
  await page
    .locator('textarea[name="message"]')
    .fill("This is an automated end-to-end test submission.");
}

test("the honeypot field is present but hidden from real users and unreachable by keyboard", async ({
  page,
}) => {
  await page.goto("/contact");
  const honeypot = page.locator('input[name="company"]');

  await expect(honeypot).toHaveCount(1);
  await expect(honeypot).toHaveAttribute("aria-hidden", "true");
  await expect(honeypot).toHaveAttribute("tabindex", "-1");
  await expect(honeypot).toHaveAttribute("autocomplete", "off");
  // Not asserting `not.toBeVisible()` here: Playwright's visibility check only
  // looks at CSS visibility/display and bounding-box size, not `clip`. Tailwind's
  // `.sr-only` utility (position:absolute; 1px x 1px; clip:rect(0,0,0,0)) reports
  // as "visible" under that check even though nothing is on screen — verified by
  // hand against this exact CSS before writing this test. aria-hidden + tabindex
  // are the properties that actually make it invisible to assistive tech and
  // unreachable by keyboard, so those are what's asserted instead.
});

test("submitting /contact reflects the real server response, never a timer", async ({ page }) => {
  await fillContactForm(page);

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/api/contact") && res.request().method() === "POST",
    { timeout: 20_000 },
  );

  await page.locator('button[type="submit"]').click();

  // If this times out, no request was ever sent — i.e. the old fake-`setTimeout`
  // behavior is back. That must fail this test, not be swallowed.
  const response = await responsePromise;

  // Scoped to the form's own error <p role="alert">: Next's App Router also
  // injects an always-empty `<div role="alert" id="__next-route-announcer__">`
  // on every page (see the identical two-robots-meta situation documented in
  // admin.spec.js's 404 test), which would otherwise make a bare
  // `getByRole("alert")` ambiguous.
  const errorAlert = page.locator('form p[role="alert"]');

  if (response.ok()) {
    // The success path: only reachable once Mailgun accepts the send.
    await expect(page.getByRole("button", { name: /Message Sent/i })).toBeVisible();
    await expect(errorAlert).toHaveCount(0);
  } else {
    // Today's expected path: Mailgun's sandbox domain rejects the recipient,
    // the route surfaces a real 500, and the UI must show the error state —
    // never a false "Message Sent".
    await expect(errorAlert).toBeVisible();
    await expect(page.getByRole("button", { name: /Try Again/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Message Sent/i })).toHaveCount(0);
  }
});
