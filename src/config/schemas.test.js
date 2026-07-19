import { describe, it, expect } from "vitest";
import { contactSchema } from "./schemas.js";

const valid = { name: "Jane Doe", email: "jane@example.com", phone: "", message: "I need help.", company: "" };

describe("contactSchema", () => {
  it("accepts a valid submission", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a missing optional phone", () => {
    const { phone, ...noPhone } = valid;
    expect(contactSchema.safeParse(noPhone).success).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects an empty message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "" }).success).toBe(false);
  });

  it("rejects an over-length message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(5001) }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, company: "Acme" }).success).toBe(false);
  });
});
