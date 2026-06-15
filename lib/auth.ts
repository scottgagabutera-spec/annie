// lib/auth.ts
// All auth logic lives here — web and future React Native app both import from this file.
// Never import directly from supabase in components; always go through these functions.

import { supabase } from "./supabase";

export type AnnieUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

function sessionToUser(session: any): AnnieUser | null {
  const u = session?.user;
  if (!u) return null;
  return {
    id: u.id,
    name: u.user_metadata?.full_name || u.email?.split("@")[0] || "You",
    email: u.email || "",
    avatar: u.user_metadata?.avatar_url || "",
  };
}

export async function getCurrentUser(): Promise<AnnieUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return sessionToUser(session);
}

export function onAuthChange(callback: (user: AnnieUser | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(sessionToUser(session));
  });
  return () => subscription.unsubscribe();
}

export async function signInWithGoogle(redirectOrigin: string) {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${redirectOrigin}/auth/callback` },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
}