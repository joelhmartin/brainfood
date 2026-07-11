import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import { postFromRow, postToRow } from "../lib/mappers.js";
import { requestRebuild } from "../lib/rebuild.js";

/**
 * Blog posts, backed by Supabase. Mirrors events.store.js — see it for the
 * reasoning behind the explicit `status` field and the absent `published` filter.
 */
export const usePostsStore = create((set, get) => ({
  posts: [],
  status: "idle",
  error: null,

  fetchPosts: async () => {
    if (!isSupabaseConfigured) {
      set({ status: "error", error: "Supabase is not configured.", posts: [] });
      return;
    }

    set({ status: "loading", error: null });

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      set({ status: "error", error: error.message, posts: [] });
      return;
    }

    set({ posts: data.map(postFromRow), status: "ready", error: null });
  },

  getPublished: () =>
    get()
      .posts.filter((p) => p.published)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),

  getBySlug: (slug) => get().posts.find((p) => p.slug === slug),

  getById: (id) => get().posts.find((p) => p.id === id),

  createPost: async (input) => {
    const { data, error } = await supabase
      .from("posts")
      .insert(postToRow(input))
      .select()
      .single();
    if (error) throw new Error(friendly(error));

    const post = postFromRow(data);
    set((s) => ({ posts: [...s.posts, post] }));
    if (post.published) requestRebuild();
    return post;
  },

  updatePost: async (id, input) => {
    const current = get().getById(id);
    const wasPublished = current?.published;

    // Merged, not replaced — see events.store.js. The publish/feature toggles send a
    // partial patch, and mapping that alone would blank the rest of the row.
    const merged = { ...current, ...input };

    const { data, error } = await supabase
      .from("posts")
      .update(postToRow(merged))
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(friendly(error));

    const post = postFromRow(data);
    set((s) => ({ posts: s.posts.map((p) => (p.id === id ? post : p)) }));
    if (post.published || wasPublished) requestRebuild();
    return post;
  },

  deletePost: async (id) => {
    const wasPublished = get().getById(id)?.published;

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw new Error(friendly(error));

    set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
    if (wasPublished) requestRebuild();
  },
}));

function friendly(error) {
  if (error.code === "23505") return "A post with that URL slug already exists.";
  if (error.code === "42501") return "You do not have permission to do that.";
  return error.message;
}
