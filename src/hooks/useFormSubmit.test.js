import { describe, it, expect, vi, beforeEach } from "vitest";
import { postSubmission } from "./useFormSubmit.js";

const endpoint = "/api/contact";
const values = { name: "Jane Doe", email: "jane@example.com", message: "Help." };

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("postSubmission", () => {
  it("returns ok: true for a 2xx response", async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(200, { success: true }));

    const result = await postSubmission(endpoint, values);

    expect(result).toEqual({ ok: true, error: null });
  });

  it("surfaces the server's error message for a non-2xx JSON response", async () => {
    global.fetch.mockResolvedValueOnce(
      jsonResponse(400, { error: "Email is required." }),
    );

    const result = await postSubmission(endpoint, values);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Email is required.");
  });

  it("falls back to a sensible message for a non-2xx response with a garbage/non-JSON body", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new SyntaxError("Unexpected token < in JSON")),
    });

    const result = await postSubmission(endpoint, values);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
  });

  it("returns ok: false with a sensible message when fetch itself throws (network failure)", async () => {
    global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await postSubmission(endpoint, values);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Could not reach the server. Please try again.");
  });

  it("CRITICAL: a non-2xx response can never produce ok: true, across a range of statuses and bodies", async () => {
    const cases = [
      jsonResponse(400, { error: "Bad request" }),
      jsonResponse(401, {}),
      jsonResponse(404, { error: "" }),
      jsonResponse(429, { error: "Too many requests" }),
      jsonResponse(500, { error: "Server error" }),
      {
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error("not json")),
      },
    ];

    for (const response of cases) {
      global.fetch.mockResolvedValueOnce(response);
      // eslint-disable-next-line no-await-in-loop
      const result = await postSubmission(endpoint, values);
      expect(result.ok).toBe(false);
    }
  });

  it("sends the submitted values as the JSON body", async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(200, {}));

    await postSubmission(endpoint, values);

    expect(global.fetch).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }),
    );
  });
});
