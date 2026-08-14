import { describe, it, expect } from "vitest";
import { contactSchema, contactPageSchema, CONTACT_INQUIRY_OPTIONS } from "./schemas.js";

const valid = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "",
  message: "I need help with recovery coaching.",
  company: "",
};

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

  it("normalises email casing and surrounding whitespace", () => {
    const result = contactSchema.safeParse({ ...valid, email: "  Jane@Example.COM " });
    expect(result.success).toBe(true);
    expect(result.data.email).toBe("jane@example.com");
  });

  it("rejects an over-length email", () => {
    const long = `${"a".repeat(250)}@example.com`;
    expect(contactSchema.safeParse({ ...valid, email: long }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects a single-character name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "J" }).success).toBe(false);
  });

  it("rejects a name with no letters in it", () => {
    expect(contactSchema.safeParse({ ...valid, name: "12345" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, name: "...." }).success).toBe(false);
  });

  it("accepts a non-Latin name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "李雷" }).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, name: "Sørensen" }).success).toBe(true);
  });

  // The reported bug: this submitted successfully.
  it("rejects a three-digit phone number", () => {
    const result = contactSchema.safeParse({ ...valid, phone: "785" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/valid phone number/i);
  });

  it("accepts a real phone number in any common format", () => {
    for (const phone of ["5125550100", "(512) 555-0100", "+1 512 555 0100", "+44 20 7946 0958"]) {
      expect(contactSchema.safeParse({ ...valid, phone }).success, phone).toBe(true);
    }
  });

  it("rejects an empty message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "" }).success).toBe(false);
  });

  it("rejects a message too short to be a real enquiry", () => {
    expect(contactSchema.safeParse({ ...valid, message: "Test" }).success).toBe(false);
  });

  it("rejects a message that is only whitespace", () => {
    expect(contactSchema.safeParse({ ...valid, message: "                " }).success).toBe(false);
  });

  it("rejects an over-length message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(5001) }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, company: "Acme" }).success).toBe(false);
  });

  it("treats inquiry as optional but constrained", () => {
    expect(contactSchema.safeParse({ ...valid, inquiry: "" }).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, inquiry: "General Question" }).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, inquiry: "Anything else" }).success).toBe(false);
  });

  it("rejects an absurdly long reCAPTCHA token", () => {
    expect(contactSchema.safeParse({ ...valid, recaptchaToken: "x".repeat(4097) }).success).toBe(
      false,
    );
  });
});

describe("contactPageSchema", () => {
  const page = { ...valid, inquiry: "Recovery Coaching for Myself" };

  it("accepts every offered option", () => {
    for (const inquiry of CONTACT_INQUIRY_OPTIONS) {
      expect(contactPageSchema.safeParse({ ...page, inquiry }).success, inquiry).toBe(true);
    }
  });

  it("requires an inquiry, unlike the shared base schema", () => {
    const { inquiry, ...noInquiry } = page;
    expect(contactSchema.safeParse(noInquiry).success).toBe(true);
    expect(contactPageSchema.safeParse(noInquiry).success).toBe(false);
    expect(contactPageSchema.safeParse({ ...page, inquiry: "" }).success).toBe(false);
  });

  it("still enforces every rule it inherits", () => {
    expect(contactPageSchema.safeParse({ ...page, phone: "785" }).success).toBe(false);
    expect(contactPageSchema.safeParse({ ...page, email: "nope" }).success).toBe(false);
  });
});
