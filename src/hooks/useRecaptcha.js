"use client";

import { useCallback, useEffect } from "react";
import { RECAPTCHA_SITE_KEY } from "../config/recaptcha.js";

/**
 * Loads reCAPTCHA Enterprise and mints a token for a form submission.
 *
 * The script is fetched lazily and exactly once per page, memoised on `window`
 * rather than in component state so the contact page and the sidebar MiniForm
 * share a single load even when both are mounted.
 *
 * Failure is deliberately quiet HERE and loud on the SERVER: every failure path
 * resolves to an empty string, and `POST /api/contact` decides what an absent
 * token means. That keeps the policy in one place instead of splitting it
 * between a browser that an attacker controls and a route that they do not.
 */

const SCRIPT_ID = "recaptcha-enterprise";
const PROMISE_KEY = "__recaptchaEnterpriseLoader";

function loadRecaptcha() {
  if (typeof window === "undefined" || !RECAPTCHA_SITE_KEY) return Promise.resolve(null);
  if (window[PROMISE_KEY]) return window[PROMISE_KEY];

  window[PROMISE_KEY] = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      if (window.grecaptcha?.enterprise) {
        resolve(window.grecaptcha);
        return;
      }
      existing.addEventListener("load", () => resolve(window.grecaptcha), { once: true });
      existing.addEventListener("error", () => reject(new Error("reCAPTCHA failed to load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = () => {
      // Let a later submit retry rather than caching the rejection forever —
      // a transient network blip should not disable the form for the session.
      delete window[PROMISE_KEY];
      reject(new Error("reCAPTCHA failed to load."));
    };
    document.head.appendChild(script);
  });

  return window[PROMISE_KEY];
}

/**
 * @param {string} action — the reCAPTCHA action name, asserted again server-side.
 * @returns {() => Promise<string>} resolves to a token, or "" if one cannot be obtained.
 */
export function useRecaptcha(action) {
  // Warm the script on mount so the first submit does not also pay for the
  // network round-trip that fetches it.
  useEffect(() => {
    loadRecaptcha().catch(() => {});
  }, []);

  return useCallback(async () => {
    if (!RECAPTCHA_SITE_KEY) return "";
    try {
      const grecaptcha = await loadRecaptcha();
      if (!grecaptcha?.enterprise) return "";
      await new Promise((resolve) => grecaptcha.enterprise.ready(resolve));
      const token = await grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action });
      return typeof token === "string" ? token : "";
    } catch {
      return "";
    }
  }, [action]);
}
