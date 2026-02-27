// src/lib/supabase.js
// ============================================================
// Single Supabase client instance — import this everywhere.
// Never create a second client. Never put keys in components.
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Create a .env file in your project root with:\n' +
    '  VITE_SUPABASE_URL=your_url\n' +
    '  VITE_SUPABASE_ANON_KEY=your_anon_key'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,         // keeps user logged in across refreshes
    autoRefreshToken: true,       // silently refreshes expired tokens
    detectSessionInUrl: true,     // handles OAuth redirects
  },
});

// ── Auth helpers ──────────────────────────────────────────────

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },   // passed to handle_new_user trigger
  });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
