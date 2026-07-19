"use client";

import { useCallback, useState } from "react";

/**
 * Submits a public form to an API route.
 *
 * Both the contact page and the sidebar MiniForm use this — before, each faked a
 * success with setTimeout and discarded the submission entirely. The success state
 * here is driven only by a real 2xx from the server.
 */
export function useFormSubmit({ endpoint }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  const submit = useCallback(
    async (values) => {
      setState("sending");
      setError(null);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(payload.error || "Something went wrong. Please try again.");
          setState("error");
          return false;
        }

        setState("success");
        return true;
      } catch {
        setError("Could not reach the server. Please try again.");
        setState("error");
        return false;
      }
    },
    [endpoint],
  );

  return { submit, state, error, reset };
}
