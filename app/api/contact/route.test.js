import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/lib/email/mailgun.js", () => ({
  sendEmail: vi.fn(() => Promise.resolve({ id: "test" })),
  isMailConfigured: vi.fn(() => true),
}));

import { sendEmail, isMailConfigured } from "../../../src/lib/email/mailgun.js";
import { POST } from "./route.js";

const valid = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "555-0100",
  message: "I need help.",
  company: "",
  source: "Contact page",
};

function req(body) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  isMailConfigured.mockReturnValue(true);
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

  it("still succeeds when only the auto-reply fails", async () => {
    sendEmail.mockResolvedValueOnce({ id: "admin" }).mockRejectedValueOnce(new Error("bounce"));
    const res = await POST(req(valid));
    expect(res.status).toBe(200);
  });

  it("returns an error when Mailgun is not configured", async () => {
    isMailConfigured.mockReturnValue(false);
    const res = await POST(req(valid));
    expect(res.status).toBe(500);
  });
});
