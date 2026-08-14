import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyRecaptcha, isRecaptchaConfigured } from "./recaptcha.js";
import { RECAPTCHA_SITE_KEY } from "../config/recaptcha.js";

const ENV_KEYS = ["RECAPTCHA_PROJECT_ID", "RECAPTCHA_API_KEY", "RECAPTCHA_MIN_SCORE"];

const original = {};

function configure(overrides = {}) {
  process.env.RECAPTCHA_PROJECT_ID = "brainfood-505317";
  process.env.RECAPTCHA_API_KEY = "test-api-key";
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

/** Stubs one assessment response from Google. */
function mockAssessment(payload, { status = 200 } = {}) {
  return vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(payload),
    }),
  );
}

const good = {
  tokenProperties: { valid: true, action: "contact_submit" },
  riskAnalysis: { score: 0.9 },
};

beforeEach(() => {
  for (const key of ENV_KEYS) original[key] = process.env[key];
  for (const key of ENV_KEYS) delete process.env[key];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
  vi.restoreAllMocks();
});

describe("isRecaptchaConfigured", () => {
  // The project and site key have compiled-in defaults, so the API key is the
  // piece that actually decides whether verification can happen.
  it("is false without the secret API key", () => {
    expect(isRecaptchaConfigured()).toBe(false);
  });

  it("is true once the API key is present", () => {
    configure();
    expect(isRecaptchaConfigured()).toBe(true);
  });
});

describe("verifyRecaptcha", () => {
  it("skips verification entirely when unconfigured", async () => {
    const fetchMock = mockAssessment(good);
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyRecaptcha({ token: "t", expectedAction: "contact_submit" });

    expect(result.ok).toBe(true);
    expect(result.reason).toBe("not-configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a valid, high-scoring token", async () => {
    configure();
    vi.stubGlobal("fetch", mockAssessment(good));

    const result = await verifyRecaptcha({ token: "t", expectedAction: "contact_submit" });

    expect(result).toEqual({ ok: true, reason: "ok", score: 0.9 });
  });

  it("posts the documented assessment body to the project endpoint", async () => {
    configure();
    const fetchMock = mockAssessment(good);
    vi.stubGlobal("fetch", fetchMock);

    await verifyRecaptcha({ token: "abc123", expectedAction: "contact_submit" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://recaptchaenterprise.googleapis.com/v1/projects/brainfood-505317/assessments?key=test-api-key",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      event: {
        token: "abc123",
        expectedAction: "contact_submit",
        siteKey: RECAPTCHA_SITE_KEY,
      },
    });
  });

  // ── Fail closed ───────────────────────────────────────────────────────────

  it("rejects a missing token when configured", async () => {
    configure();
    const fetchMock = mockAssessment(good);
    vi.stubGlobal("fetch", fetchMock);

    expect((await verifyRecaptcha({ token: "", expectedAction: "a" })).ok).toBe(false);
    expect((await verifyRecaptcha({ token: "  ", expectedAction: "a" })).ok).toBe(false);
    expect((await verifyRecaptcha({ token: undefined, expectedAction: "a" })).ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid token and surfaces Google's reason", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      mockAssessment({ tokenProperties: { valid: false, invalidReason: "EXPIRED" } }),
    );

    const result = await verifyRecaptcha({ token: "t", expectedAction: "contact_submit" });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("EXPIRED");
  });

  it("rejects a token raised for a different action", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      mockAssessment({
        tokenProperties: { valid: true, action: "newsletter_signup" },
        riskAnalysis: { score: 0.9 },
      }),
    );

    const result = await verifyRecaptcha({ token: "t", expectedAction: "contact_submit" });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("action-mismatch");
  });

  it("rejects a score below the threshold", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      mockAssessment({
        tokenProperties: { valid: true, action: "contact_submit" },
        riskAnalysis: { score: 0.1 },
      }),
    );

    const result = await verifyRecaptcha({ token: "t", expectedAction: "contact_submit" });

    expect(result).toEqual({ ok: false, reason: "low-score", score: 0.1 });
  });

  it("honours a custom threshold", async () => {
    configure({ RECAPTCHA_MIN_SCORE: "0.9" });
    vi.stubGlobal(
      "fetch",
      mockAssessment({
        tokenProperties: { valid: true, action: "contact_submit" },
        riskAnalysis: { score: 0.7 },
      }),
    );

    const result = await verifyRecaptcha({ token: "t", expectedAction: "contact_submit" });

    expect(result.ok).toBe(false);
  });

  // ── Fail open ─────────────────────────────────────────────────────────────
  //
  // A Google outage must not silently swallow leads.

  it("allows the submission when Google returns an error status", async () => {
    configure();
    vi.stubGlobal("fetch", mockAssessment({ error: {} }, { status: 503 }));

    const result = await verifyRecaptcha({ token: "t", expectedAction: "contact_submit" });

    expect(result.ok).toBe(true);
    expect(result.reason).toBe("verification-unavailable");
  });

  it("allows the submission when the request throws", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("ECONNRESET"))));

    const result = await verifyRecaptcha({ token: "t", expectedAction: "contact_submit" });

    expect(result.ok).toBe(true);
    expect(result.reason).toBe("verification-unavailable");
  });

  it("allows the submission when the assessment carries no score", async () => {
    configure();
    vi.stubGlobal("fetch", mockAssessment({ tokenProperties: { valid: true, action: "contact_submit" } }));

    const result = await verifyRecaptcha({ token: "t", expectedAction: "contact_submit" });

    expect(result.ok).toBe(true);
    expect(result.reason).toBe("verification-unavailable");
  });

  it("never logs the token or the API key", async () => {
    configure();
    vi.stubGlobal("fetch", mockAssessment({ error: {} }, { status: 500 }));

    await verifyRecaptcha({ token: "super-secret-token", expectedAction: "contact_submit" });

    const logged = console.error.mock.calls.flat().join(" ");
    expect(logged).not.toContain("super-secret-token");
    expect(logged).not.toContain("test-api-key");
  });
});
