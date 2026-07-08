import { describe, it, expect } from "vitest";
import { SERVICES_CONTENT, SERVICE_SLUGS, getService } from "./services.js";

const EXPECTED_SLUGS = [
  "coaching",
  "sober-companion",
  "experiential",
  "family",
  "collaborative",
];

describe("services config", () => {
  it("exposes exactly the 5 expected slugs in order", () => {
    expect(SERVICE_SLUGS).toEqual(EXPECTED_SLUGS);
    expect(SERVICES_CONTENT.map((s) => s.slug)).toEqual(EXPECTED_SLUGS);
  });

  it("every service has all required fields populated", () => {
    for (const s of SERVICES_CONTENT) {
      expect(typeof s.slug).toBe("string");
      expect(s.navLabel).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.accent).toBeTruthy();
      expect(s.tagline).toBeTruthy();
      expect(s.introHeading).toBeTruthy();
      expect(s.introAccent).toBeTruthy();
      expect(Array.isArray(s.intro) && s.intro.length >= 2).toBe(true);
      expect(Array.isArray(s.lookLike) && s.lookLike.length >= 4).toBe(true);
      expect(Array.isArray(s.whoFor) && s.whoFor.length >= 3).toBe(true);
      expect(s.cardBlurb).toBeTruthy();
      expect(typeof s.image).toBe("string");
      expect(s.image.length).toBeGreaterThan(0);
      expect(s.icon).toBeTruthy();
    }
  });

  it("getService returns the matching service or undefined", () => {
    expect(getService("coaching")?.navLabel).toBe(
      "Recovery & Mental Health Coaching"
    );
    expect(getService("nope")).toBeUndefined();
  });
});
