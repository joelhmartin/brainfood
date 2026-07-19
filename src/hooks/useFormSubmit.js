"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Posts a submission to `endpoint` and interprets the response.
 *
 * Extracted as a standalone, exported async function (rather than inlined in
 * the hook) so it can be unit-tested directly with a mocked `fetch` — this repo
 * has no React Testing Library, so hook-internal logic is otherwise untestable.
 * This is the exact logic that used to be faked with a `setTimeout`; the one
 * invariant that matters is that `ok: true` can only ever come from a real 2xx.
 *
 * @returns {Promise<{ ok: boolean, error: string|null }>}
 */
export async function postSubmission(endpoint, values) {
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    return {
      ok: false,
      error: payload.error || "Something went wrong. Please try again.",
    };
  }

  return { ok: true, error: null };
}

/**
 * Submits a public form to an API route.
 *
 * Both the contact page and the sidebar MiniForm use this — before, each faked a
 * success with setTimeout and discarded the submission entirely. The success state
 * here is driven only by a real 2xx from the server (see `postSubmission`).
 */
export function useFormSubmit({ endpoint }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState(null);
  // Plain ref, not state: a double-click or Enter-mash can fire `submit` twice
  // before React re-renders with the "sending" state, so the button's
  // `disabled` prop alone doesn't stop a second concurrent request (and a
  // second real email). This ref is checked and set synchronously.
  const inFlightRef = useRef(false);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  const submit = useCallback(
    async (values) => {
      if (inFlightRef.current) return false;
      inFlightRef.current = true;
      setState("sending");
      setError(null);

      const result = await postSubmission(endpoint, values);

      inFlightRef.current = false;

      if (!result.ok) {
        setError(result.error);
        setState("error");
        return false;
      }

      setState("success");
      return true;
    },
    [endpoint],
  );

  return { submit, state, error, reset };
}
