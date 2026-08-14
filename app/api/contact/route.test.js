import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/lib/email/mailgun.js", () => ({
  sendEmail: vi.fn(() => Promise.resolve({ id: "test" })),
  isMailConfigured: vi.fn(() => true),
}));

// Mocked so these tests never depend on whether RECAPTCHA_API_KEY happens to be
// set in the environment, and never make a network call. The verifier's own
// behaviour is covered in src/lib/recaptcha.test.js.
vi.mock("../../../src/lib/recaptcha.js", () => ({
  verifyRecaptcha: vi.fn(() => Promise.resolve({ ok: true, reason: "ok", score: 0.9 })),
  isRecaptchaConfigured: vi.fn(() => true),
}));

import { sendEmail, isMailConfigured } from "../../../src/lib/email/mailgun.js";
import { verifyRecaptcha } from "../../../src/lib/recaptcha.js";
import { POST, resetRateLimiterForTests } from "./route.js";

const valid = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "512-555-0100",
  message: "I need help with recovery coaching.",
  company: "",
  source: "Contact page",
  recaptchaToken: "test-token",
};

function req(body, headers = {}) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  isMailConfigured.mockReturnValue(true);
  verifyRecaptcha.mockResolvedValue({ ok: true, reason: "ok", score: 0.9 });
  // The rate limiter's Map is module-level state shared by every test in this
  // file; without a reset, tests would pass or fail based on execution order
  // and how many requests earlier tests made rather than on what each test
  // actually verifies (see Finding I5).
  resetRateLimiterForTests();
});

describe("POST /api/contact", () => {
  it("sends the admin notification for a valid submission", async () => {
    const res = await POST(req(valid));
    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalled();
  });

  it("puts the submitter's address in replyTo, never in from", async () => {
    await POST(req(valid));
    const call = sendEmail.mock.calls[0][0];
    expect(call.replyTo).toBe(valid.email);
    expect(call.from).toBeUndefined();
  });

  it("rejects an invalid submission with 400 and sends nothing", async () => {
    const res = await POST(req({ ...valid, email: "nope" }));
    expect(res.status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("tolerates a malformed body with 400, not 500", async () => {
    const res = await POST(
      new Request("http://localhost/api/contact", { method: "POST", body: "not json" }),
    );
    expect(res.status).toBe(400);
  });

  it("silently accepts a filled honeypot without sending", async () => {
    const res = await POST(req({ ...valid, company: "Acme" }));
    expect(res.status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("reports an error when the transport fails — never a false success", async () => {
    sendEmail.mockRejectedValueOnce(new Error("mailgun down"));
    const res = await POST(req(valid));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBeTruthy();
  });

  it("still succeeds when only the auto-reply fails, and actually attempts both sends", async () => {
    sendEmail.mockResolvedValueOnce({ id: "admin" }).mockRejectedValueOnce(new Error("bounce"));
    const res = await POST(req(valid));
    expect(res.status).toBe(200);
    // Finding I3: a route that sends only the admin notification and never
    // calls the auto-reply would consume just the first mock, never touch
    // the rejection, and still return 200 here — a green test on a broken
    // feature. Asserting the call count and the second call's recipient
    // forces the auto-reply send to actually happen.
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail.mock.calls[1][0].to).toBe(valid.email);
  });

  it("returns an error when Mailgun is not configured", async () => {
    isMailConfigured.mockReturnValue(false);
    const res = await POST(req(valid));
    expect(res.status).toBe(500);
  });

  it("does not consume rate-limit quota when Mailgun is unconfigured (Finding M2)", async () => {
    isMailConfigured.mockReturnValue(false);
    // One request per call so every submission lands in the same rate-limit
    // bucket (the fixture sends no forwarded-IP header, so every request in
    // this file resolves to the same "unknown" key).
    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await POST(req(valid));
      expect(res.status).toBe(500);
    }
    isMailConfigured.mockReturnValue(true);
    const res = await POST(req(valid));
    expect(res.status).toBe(200);
  });

  it("produces a single-line subject when source contains a CR/LF (Finding Fix B, header injection)", async () => {
    const injected = "Contact page\r\nBcc: attacker@evil.com";
    await POST(req({ ...valid, source: injected }));
    const call = sendEmail.mock.calls[0][0];
    // The entire defense is that a raw CR/LF can never reach the subject
    // line — if it did, a submitter could smuggle extra email headers
    // (e.g. an injected Bcc:) into the outgoing message.
    expect(call.subject).not.toMatch(/[\r\n]/);
    expect(call.subject.split("\n")).toHaveLength(1);
    expect(call.subject).toBe("New submission from Contact page Bcc: attacker@evil.com");
  });

  // Client-side validation is a courtesy to humans. A script posting JSON
  // straight at this route never runs it, so every rule has to hold here too.
  describe("server-side validation", () => {
    it("rejects a too-short phone number — the bug that let '785' through", async () => {
      const res = await POST(req({ ...valid, phone: "785" }));
      expect(res.status).toBe(400);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("still accepts a submission with no phone at all", async () => {
      const res = await POST(req({ ...valid, phone: "" }));
      expect(res.status).toBe(200);
    });

    it("normalises the phone number before it reaches the inbox", async () => {
      await POST(req({ ...valid, phone: "5125550100" }));
      const call = sendEmail.mock.calls[0][0];
      expect(call.text).toContain("(512) 555-0100");
    });

    it("rejects a one-character name and a filler message", async () => {
      expect((await POST(req({ ...valid, name: "J" }))).status).toBe(400);
      resetRateLimiterForTests();
      expect((await POST(req({ ...valid, name: "12345" }))).status).toBe(400);
      resetRateLimiterForTests();
      expect((await POST(req({ ...valid, message: "Test" }))).status).toBe(400);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("rejects an inquiry value that is not one of the offered options", async () => {
      const res = await POST(req({ ...valid, inquiry: "<script>alert(1)</script>" }));
      expect(res.status).toBe(400);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("carries the chosen inquiry into the notification", async () => {
      await POST(req({ ...valid, inquiry: "Sober Companion Services" }));
      const call = sendEmail.mock.calls[0][0];
      expect(call.text).toContain("Sober Companion Services");
      expect(call.html).toContain("Sober Companion Services");
    });
  });

  describe("reCAPTCHA", () => {
    it("rejects a submission the assessment refuses, and sends nothing", async () => {
      verifyRecaptcha.mockResolvedValue({ ok: false, reason: "low-score", score: 0.1 });
      const res = await POST(req(valid));
      expect(res.status).toBe(403);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("asserts the action matching the submitting form", async () => {
      await POST(req(valid));
      expect(verifyRecaptcha).toHaveBeenCalledWith({
        token: "test-token",
        expectedAction: "contact_submit",
      });

      resetRateLimiterForTests();
      await POST(req({ ...valid, source: "Sidebar" }));
      expect(verifyRecaptcha).toHaveBeenLastCalledWith({
        token: "test-token",
        expectedAction: "sidebar_submit",
      });
    });

    it("drops the action assertion for an unrecognised source rather than failing", async () => {
      await POST(req({ ...valid, source: "Some future form" }));
      expect(verifyRecaptcha).toHaveBeenCalledWith({
        token: "test-token",
        expectedAction: undefined,
      });
      expect(sendEmail).toHaveBeenCalled();
    });

    it("is not consulted for a filled honeypot", async () => {
      await POST(req({ ...valid, company: "Acme" }));
      expect(verifyRecaptcha).not.toHaveBeenCalled();
    });

    it("does not burn assessment quota on a rate-limited request", async () => {
      for (let i = 0; i < 6; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await POST(req(valid));
      }
      // Five got through and were assessed; the sixth was capped before the
      // assessment call.
      expect(verifyRecaptcha).toHaveBeenCalledTimes(5);
    });
  });

  describe("rate limiting (Finding I4)", () => {
    it("allows up to the configured maximum requests per IP", async () => {
      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await POST(req(valid));
        expect(res.status).toBe(200);
      }
    });

    it("returns 429 once the limit is exceeded, and sends nothing on that request", async () => {
      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await POST(req(valid));
      }
      sendEmail.mockClear();

      const res = await POST(req(valid));

      expect(res.status).toBe(429);
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });
});
