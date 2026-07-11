import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import { eventFromRow, eventToRow } from "../lib/mappers.js";
import { requestRebuild } from "../lib/rebuild.js";

/**
 * Events, backed by Supabase.
 *
 * `status` is deliberately explicit — "idle" | "loading" | "ready" | "error".
 * The pages need to distinguish "no events" from "events not fetched yet";
 * conflating the two makes a detail page redirect away before its fetch resolves.
 *
 * Row Level Security decides what comes back: anonymous visitors receive only
 * published rows, admins receive drafts too. That is why the read query has no
 * `published` filter — the database applies it.
 */
export const useEventsStore = create((set, get) => ({
  events: [],
  status: "idle",
  error: null,

  fetchEvents: async () => {
    if (!isSupabaseConfigured) {
      set({ status: "error", error: "Supabase is not configured.", events: [] });
      return;
    }

    set({ status: "loading", error: null });

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      set({ status: "error", error: error.message, events: [] });
      return;
    }

    set({ events: data.map(eventFromRow), status: "ready", error: null });
  },

  getPublished: () =>
    get()
      .events.filter((e) => e.published)
      .sort((a, b) => new Date(a.date) - new Date(b.date)),

  getBySlug: (slug) => get().events.find((e) => e.slug === slug),

  getById: (id) => get().events.find((e) => e.id === id),

  createEvent: async (input) => {
    const { data, error } = await supabase
      .from("events")
      .insert(eventToRow(input))
      .select()
      .single();
    if (error) throw new Error(friendly(error));

    const event = eventFromRow(data);
    set((s) => ({ events: [...s.events, event] }));
    if (event.published) requestRebuild();
    return event;
  },

  updateEvent: async (id, input) => {
    const current = get().getById(id);
    const wasPublished = current?.published;

    // Merged, not replaced. Callers legitimately pass a partial patch — the publish
    // toggle sends just `{ published }` — and mapping that alone would write a row
    // with an empty title and a blanked slug.
    const merged = { ...current, ...input };

    const { data, error } = await supabase
      .from("events")
      .update(eventToRow(merged))
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(friendly(error));

    const event = eventFromRow(data);
    set((s) => ({ events: s.events.map((e) => (e.id === id ? event : e)) }));
    // Either a change to a live page, or a page entering/leaving the public site.
    if (event.published || wasPublished) requestRebuild();
    return event;
  },

  deleteEvent: async (id) => {
    const wasPublished = get().getById(id)?.published;

    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) throw new Error(friendly(error));

    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
    if (wasPublished) requestRebuild();
  },
}));

/** Postgres error codes are not user-facing copy. */
function friendly(error) {
  if (error.code === "23505") return "An event with that URL slug already exists.";
  if (error.code === "42501") return "You do not have permission to do that.";
  return error.message;
}
