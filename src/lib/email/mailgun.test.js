import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * `mailgun.js`'s BASE_URL is computed once, at module load, from
 * MAILGUN_REGION — so unlike the rest of the module's behavior, it can't be
 * observed by mocking the module wholesale (as route.test.js does). This
 * file re-imports the real module with a fresh module registry for each
 * region value and inspects what host the Mailgun client is constructed
 * with, without ever making a real network call (the `mailgun.js` package
 * itself is mocked).
 */

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

beforeEach(() => {
  vi.resetModules();
  restoreEnv();
});

afterEach(() => {
  vi.restoreAllMocks();
  restoreEnv();
});

async function loadMailgunWithRegion(region) {
  process.env.MAILGUN_API_KEY = "test-key";
  process.env.MAILGUN_DOMAIN = "example.com";
  process.env.MAILGUN_FROM = "noreply@example.com";
  if (region === undefined) {
    delete process.env.MAILGUN_REGION;
  } else {
    process.env.MAILGUN_REGION = region;
  }

  const clientSpy = vi.fn(() => ({
    messages: { create: vi.fn().mockResolvedValue({ id: "test" }) },
  }));

  vi.doMock("mailgun.js", () => ({
    default: class Mailgun {
      client(opts) {
        return clientSpy(opts);
      }
    },
  }));
  vi.doMock("form-data", () => ({ default: class FormData {} }));

  const mod = await import("./mailgun.js");
  return { mod, clientSpy };
}

describe("Mailgun region selection (Finding I4, Fix A)", () => {
  it('selects the EU host for MAILGUN_REGION=" eu " (trimmed, case-insensitive)', async () => {
    const { mod, clientSpy } = await loadMailgunWithRegion(" eu ");
    await mod.sendEmail({ to: "a@b.com", subject: "s", html: "<p>h</p>", text: "h" });
    expect(clientSpy).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://api.eu.mailgun.net" }),
    );
  });

  it("selects the EU host for MAILGUN_REGION=EU (uppercase)", async () => {
    const { mod, clientSpy } = await loadMailgunWithRegion("EU");
    await mod.sendEmail({ to: "a@b.com", subject: "s", html: "<p>h</p>", text: "h" });
    expect(clientSpy).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://api.eu.mailgun.net" }),
    );
  });

  it("defaults to the US host when MAILGUN_REGION is unset", async () => {
    const { mod, clientSpy } = await loadMailgunWithRegion(undefined);
    await mod.sendEmail({ to: "a@b.com", subject: "s", html: "<p>h</p>", text: "h" });
    expect(clientSpy).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://api.mailgun.net" }),
    );
  });

  it("defaults to the US host for an unrecognized region value", async () => {
    const { mod, clientSpy } = await loadMailgunWithRegion("us");
    await mod.sendEmail({ to: "a@b.com", subject: "s", html: "<p>h</p>", text: "h" });
    expect(clientSpy).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://api.mailgun.net" }),
    );
  });
});
