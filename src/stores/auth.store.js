import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

/**
 * Auth state, backed by Supabase.
 *
 * Passwords are verified by Postgres, never by this file. The previous version
 * compared the typed password against a string literal that shipped in the public
 * JS bundle — anyone could read it in devtools. Session storage and token refresh
 * are handled by supabase-js.
 *
 * `user` merges the Supabase auth user with their `profiles` row, so `user.role`
 * is available for permission checks.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /** Resolves the current session on boot and subscribes to auth changes. */
  init: async () => {
    if (!isSupabaseConfigured) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    await get().loadProfile(session);

    supabase.auth.onAuthStateChange((_event, nextSession) => {
      get().loadProfile(nextSession);
    });
  },

  /** Joins the auth user to their profile row. No session → logged out. */
  loadProfile: async (session) => {
    if (!session?.user) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, name, role")
      .eq("id", session.user.id)
      .single();

    if (error || !profile) {
      // An auth user with no profile row cannot be authorized for anything.
      // Fail closed rather than assuming a role.
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    set({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.email,
        role: profile.role,
      },
      isAuthenticated: true,
      isLoading: false,
    });
  },

  login: async ({ email, password }) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    await get().loadProfile(data.session);

    if (!get().isAuthenticated) {
      await supabase.auth.signOut();
      throw new Error("This account is not set up for dashboard access.");
    }
    return get().user;
  },

  logout: async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  /** Sends a password-reset email. */
  requestPasswordReset: async (email) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Sets a new password for the current session. Backs both the reset-password
   * page and the accept-invite page — Supabase drops the user into a valid
   * session via the emailed link in both cases.
   */
  setPassword: async (password) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    await get().loadProfile(session);
  },

  /** Updates the signed-in admin's display name. */
  updateName: async (name) => {
    const { user } = get();
    if (!user) throw new Error("Not signed in.");

    const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);
    if (error) throw new Error(error.message);

    set({ user: { ...user, name } });
  },
}));
