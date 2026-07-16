import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import { settingsFromRow, settingsToRow } from "../lib/mappers.js";
import { revalidateContent } from "../lib/adminApi.js";
import { FALLBACK_SETTINGS } from "../config/site.js";

/**
 * Site-wide settings: contact details, socials, SEO defaults, and the master
 * search-indexing switch.
 *
 * Seeded from FALLBACK_SETTINGS rather than starting empty. The marketing footer,
 * contact page, and <head> tags all read from here, and they render during
 * prerendering and on first paint — before any fetch resolves. Starting empty would
 * flash a blank phone number and an empty <title> into the prerendered HTML.
 */
export const useSettingsStore = create((set, get) => ({
  settings: FALLBACK_SETTINGS,
  status: "idle",
  error: null,

  fetchSettings: async () => {
    if (!isSupabaseConfigured) {
      set({ status: "ready" }); // Fall back to the compiled-in defaults.
      return;
    }

    set({ status: "loading", error: null });

    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();

    if (error || !data) {
      set({ status: "error", error: error?.message ?? "No settings row." });
      return;
    }

    set({ settings: settingsFromRow(data), status: "ready", error: null });
  },

  saveSettings: async (next) => {
    const { error } = await supabase
      .from("site_settings")
      .update(settingsToRow(next))
      .eq("id", 1);

    if (error) {
      throw new Error(
        error.code === "42501" ? "You do not have permission to change settings." : error.message,
      );
    }

    set({ settings: { ...get().settings, ...next } });
    // Settings feed <title>, meta tags, JSON-LD, robots.txt and sitemap.xml. Those
    // pages are cached by ISR, so a save must ask the server to refresh them.
    await revalidateContent("settings");
  },
}));
