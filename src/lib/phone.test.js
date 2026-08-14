import { describe, it, expect } from "vitest";
import { isValidPhone, formatPhone, phoneDigits } from "./phone.js";

describe("isValidPhone", () => {
  it("accepts common North American formats", () => {
    for (const value of [
      "5125550100",
      "512-555-0100",
      "(512) 555-0100",
      "512.555.0100",
      "  512 555 0100  ",
      "1-512-555-0100",
      "+1 512 555 0100",
    ]) {
      expect(isValidPhone(value), value).toBe(true);
    }
  });

  it("accepts explicit international numbers", () => {
    expect(isValidPhone("+44 20 7946 0958")).toBe(true);
    expect(isValidPhone("+61 2 9374 4000")).toBe(true);
  });

  // The reported bug: a three-digit entry submitted successfully.
  it("rejects a too-short number", () => {
    expect(isValidPhone("785")).toBe(false);
    expect(isValidPhone("555-0100")).toBe(false);
    expect(isValidPhone("123456789")).toBe(false);
  });

  it("rejects a too-long number", () => {
    expect(isValidPhone("51255501001234")).toBe(false);
    expect(isValidPhone("+1234567890123456")).toBe(false);
  });

  it("rejects NANP-impossible area and exchange codes", () => {
    expect(isValidPhone("111-111-1111")).toBe(false);
    expect(isValidPhone("000-000-0000")).toBe(false);
    expect(isValidPhone("012-555-0100")).toBe(false);
    expect(isValidPhone("512-155-0100")).toBe(false);
    expect(isValidPhone("+1 111 111 1111")).toBe(false);
  });

  it("rejects an 11-digit number that does not start with 1", () => {
    expect(isValidPhone("25125550100")).toBe(false);
  });

  it("rejects values containing letters or stray symbols", () => {
    expect(isValidPhone("512-555-0100 ext 4")).toBe(false);
    expect(isValidPhone("call me")).toBe(false);
    expect(isValidPhone("512@5550100")).toBe(false);
  });

  it("rejects empty and nullish input", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("   ")).toBe(false);
    expect(isValidPhone(null)).toBe(false);
    expect(isValidPhone(undefined)).toBe(false);
  });
});

describe("formatPhone", () => {
  it("formats a 10-digit number", () => {
    expect(formatPhone("5125550100")).toBe("(512) 555-0100");
  });

  it("drops a leading country code 1", () => {
    expect(formatPhone("1-512-555-0100")).toBe("(512) 555-0100");
  });

  it("passes international numbers through untouched", () => {
    expect(formatPhone("+44 20 7946 0958")).toBe("+44 20 7946 0958");
  });

  it("passes anything it cannot format through untouched", () => {
    expect(formatPhone("785")).toBe("785");
    expect(formatPhone("")).toBe("");
  });
});

describe("phoneDigits", () => {
  it("strips everything that is not a digit", () => {
    expect(phoneDigits("+1 (512) 555-0100")).toBe("15125550100");
    expect(phoneDigits(null)).toBe("");
  });
});
