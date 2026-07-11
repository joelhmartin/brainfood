import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

/**
 * Waits for the session that supabase-js builds from an emailed link.
 *
 * Reset-password and invite links carry their token in the URL FRAGMENT
 * (#access_token=...). supabase-js consumes it asynchronously on load, so on first
 * render there is briefly no session even when the link is perfectly valid.
 * Rendering "invalid link" during that gap would be a lie, hence the explicit
 * "checking" state.
 *
 * @returns {"checking" | "ready" | "invalid"}
 */
export function useRecoverySession() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("invalid");
      return;
    }

    let cancelled = false;

    // Fires once supabase-js has parsed the fragment (PASSWORD_RECOVERY / SIGNED_IN).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) setStatus("ready");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setStatus(session ? "ready" : "invalid");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return status;
}
