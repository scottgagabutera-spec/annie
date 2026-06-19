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

// ─── Update display name ──────────────────────────────────────────────────────

export async function updateDisplayName(name: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({
    data: { full_name: name.trim() },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

export type AvatarUploadResult =
  | { ok: true;  url: string }
  | { ok: false; error: string };

export async function uploadAvatar(file: File, userId: string): Promise<AvatarUploadResult> {
  const ext  = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);

  // Store the new URL in auth metadata so it persists across sessions
  const { error: metaError } = await supabase.auth.updateUser({
    data: { avatar_url: data.publicUrl },
  });

  if (metaError) return { ok: false, error: metaError.message };
  return { ok: true, url: data.publicUrl };
}

// ─── Delete account ───────────────────────────────────────────────────────────
// Cleans up all experiences and images first, then calls the server-side
// API route at /api/delete-account which uses the service-role key to
// remove the auth user. The service-role key must never touch the browser.

export async function deleteAccount(userId: string): Promise<{ ok: boolean; error?: string }> {
  // 1. Get all experiences for this user
  const { data: experiences } = await supabase
    .from("experiences")
    .select("id, image_urls")
    .eq("profile_id", userId);

  if (experiences && experiences.length > 0) {
    // 2. Collect all image storage paths
    const imagePaths: string[] = [];
    for (const exp of experiences) {
      if (exp.image_urls?.length) {
        for (const url of exp.image_urls) {
          const parts = url.split("/experience-images/");
          if (parts[1]) imagePaths.push(parts[1]);
        }
      }
    }

    // 3. Delete experience images from storage
    if (imagePaths.length > 0) {
      await supabase.storage.from("experience-images").remove(imagePaths);
    }

    // 4. Delete all experiences from DB
    const { error: expError } = await supabase
      .from("experiences")
      .delete()
      .eq("profile_id", userId);

    if (expError) return { ok: false, error: expError.message };
  }

  // 5. Delete avatar files from storage
  const { data: avatarList } = await supabase.storage
    .from("avatars")
    .list(userId);

  if (avatarList && avatarList.length > 0) {
    const avatarPaths = avatarList.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from("avatars").remove(avatarPaths);
  }

  // 6. Call the server-side API route to delete the auth user
  // (requires SUPABASE_SERVICE_ROLE_KEY in .env.local — server only)
  try {
    const res  = await fetch("/api/delete-account", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.error || "Account deletion failed." };
  } catch {
    return { ok: false, error: "Could not reach the server. Try again." };
  }

  return { ok: true };
}