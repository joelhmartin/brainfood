import { describe, it, expect } from "vitest";
import { adminNotification, autoReply, escapeHtml } from "./templates.js";
import { BUSINESS } from "../../config/site.js";

const submission = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "555-0100",
  message: "I need help for my brother.",
  source: "Contact page",
};

describe("escapeHtml", () => {
  it("escapes characters that would inject markup", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).not.toContain("<script>");
  });

  it("escapes ampersands and quotes", () => {
    expect(escapeHtml(`Tom & "Jerry"`)).toBe("Tom &amp; &quot;Jerry&quot;");
  });
});

describe("adminNotification", () => {
  it("includes every submitted value", () => {
    const { html, text } = adminNotification(submission);
    for (const value of [submission.name, submission.email, submission.phone, submission.message]) {
      expect(html).toContain(value);
      expect(text).toContain(value);
    }
  });

  it("names the source so the recipient knows which form was used", () => {
    expect(adminNotification(submission).html).toContain("Contact page");
  });

  it("escapes submitted HTML rather than rendering it", () => {
    const evil = { ...submission, message: `<img src=x onerror="alert(1)">` };
    expect(adminNotification(evil).html).not.toContain("onerror=");
  });

  it("returns a subject, html, and text", () => {
    const out = adminNotification(submission);
    expect(out.subject).toBeTruthy();
    expect(out.html).toBeTruthy();
    expect(out.text).toBeTruthy();
  });
});

describe("autoReply", () => {
  it("greets the submitter by name", () => {
    expect(autoReply(submission).html).toContain("Jane Doe");
  });

  it("is branded with the business name from config", () => {
    expect(autoReply(submission).html).toContain(BUSINESS.name);
  });

  it("returns a subject, html, and text", () => {
    const out = autoReply(submission);
    expect(out.subject).toBeTruthy();
    expect(out.html).toBeTruthy();
    expect(out.text).toBeTruthy();
  });
});
