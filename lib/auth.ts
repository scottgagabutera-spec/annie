// lib/auth.ts
// All auth logic lives here — web and future React Native app both import from this file.
// Never import directly from supabase in components; always go through these functions.

import { supabase } from "./supabase";

export type AnnieUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: string;
  username: string;
  usernameChangedAt: string | null;
  hasSeenWelcome: boolean;
  hasCompletedProfile: boolean;
  newsletterOptedIn: boolean;
};

function sessionToUser(session: any, profile?: any): AnnieUser | null {
  const u = session?.user;
  if (!u) return null;
  return {
    id: u.id,
    name: u.user_metadata?.full_name || u.email?.split("@")[0] || "You",
    email: u.email || "",
    avatar: u.user_metadata?.avatar_url || "",
    provider: u.app_metadata?.provider || "unknown",
    username: profile?.username || "",
    usernameChangedAt: profile?.username_changed_at || null,
    hasSeenWelcome: profile?.has_seen_welcome ?? true,
    hasCompletedProfile: profile?.has_completed_profile ?? false,
    newsletterOptedIn: profile?.newsletter_opted_in ?? false,
  };
}

export async function getCurrentUser(): Promise<AnnieUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, username_changed_at, has_seen_welcome, has_completed_profile, newsletter_opted_in")
    .eq("id", session.user.id)
    .single();

  return sessionToUser(session, profile);
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

// ─── Username Management ──────────────────────────────────────────────────────
// Username validation: 3-20 chars, lowercase, alphanumeric + underscore only,
// cannot start with number. 14-day cooldown on changes. Enforced at DB level.
// Screening: Giants Way (14 days = Instagram/TikTok standard), User friendly
// (real-time availability check), Long term (DB constraint prevents abuse).

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  // Validate format before checking availability
  if (!isValidUsernameFormat(username)) return false;
  
  const { data } = await supabase
    .from("profiles")
    .select("id", { count: "exact" })
    .eq("username", username.toLowerCase());
  
  return !data || data.length === 0;
}

export function generateUsernameFromName(name: string): string {
  // Slugify: lowercase, remove spaces/special chars, keep alphanumeric + underscore
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  
  // Ensure doesn't start with number
  if (/^[0-9]/.test(slug)) {
    slug = "user_" + slug;
  }
  
  // Ensure minimum length
  if (slug.length < 3) {
    slug = slug + "_" + Math.random().toString(36).slice(2, 6);
  }
  
  // Ensure maximum length
  return slug.slice(0, 20);
}

function isValidUsernameFormat(username: string): boolean {
  // 3-20 chars, lowercase, alphanumeric + underscore, cannot start with number
  const pattern = /^[a-z_][a-z0-9_]{2,19}$/;
  return pattern.test(username.toLowerCase());
}

export async function getCanChangeUsernameAt(userId: string): Promise<Date | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("username_changed_at")
    .eq("id", userId)
    .single();
  
  if (!profile?.username_changed_at) return null;
  
  const lastChanged = new Date(profile.username_changed_at);
  const canChangeAt = new Date(lastChanged.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
  
  return canChangeAt > new Date() ? canChangeAt : null;
}

export async function updateUsername(
  userId: string,
  newUsername: string
): Promise<{ ok: boolean; error?: string }> {
  // Validate format
  if (!isValidUsernameFormat(newUsername)) {
    return { ok: false, error: "3–20 characters, letters, numbers, underscore only" };
  }
  
  // Check cooldown
  const canChangeAt = await getCanChangeUsernameAt(userId);
  if (canChangeAt) {
    return {
      ok: false,
      error: `You can change again on ${canChangeAt.toLocaleDateString()}`,
    };
  }
  
  // Check availability
  const available = await checkUsernameAvailable(newUsername);
  if (!available) {
    return { ok: false, error: "That username is taken" };
  }
  
  // Update
  const { error } = await supabase
    .from("profiles")
    .update({
      username: newUsername.toLowerCase(),
      username_changed_at: new Date().toISOString(),
    })
    .eq("id", userId);
  
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function completeProfile(
  userId: string,
  displayName: string,
  username: string,
  newsletterOptedIn: boolean
): Promise<{ ok: boolean; error?: string }> {
  // Validate username format
  if (!isValidUsernameFormat(username)) {
    return { ok: false, error: "Invalid username format" };
  }
  
  // Check availability
  const available = await checkUsernameAvailable(username);
  if (!available) {
    return { ok: false, error: "That username is taken" };
  }
  
  // Update auth metadata (display name)
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: displayName.trim() },
  });
  
  if (authError) return { ok: false, error: authError.message };
  
  // Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username: username.toLowerCase(),
      has_completed_profile: true,
      has_seen_welcome: true,
      newsletter_opted_in: newsletterOptedIn,
    })
    .eq("id", userId);
  
  if (profileError) return { ok: false, error: profileError.message };
  return { ok: true };
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

  const { error: metaError } = await supabase.auth.updateUser({
    data: { avatar_url: data.publicUrl },
  });

  if (metaError) return { ok: false, error: metaError.message };
  return { ok: true, url: data.publicUrl };
}

// ─── Mark welcome modal as seen ───────────────────────────────────────────────

export async function markWelcomeSeen(userId: string, newsletterOptedIn: boolean): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("profiles")
    .update({
      has_seen_welcome: true,
      newsletter_opted_in: newsletterOptedIn,
    })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Delete account ───────────────────────────────────────────────────────────

export async function deleteAccount(userId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: experiences } = await supabase
    .from("experiences")
    .select("id, image_urls")
    .eq("profile_id", userId);

  if (experiences && experiences.length > 0) {
    const imagePaths: string[] = [];
    for (const exp of experiences) {
      if (exp.image_urls?.length) {
        for (const url of exp.image_urls) {
          const parts = url.split("/experience-images/");
          if (parts[1]) imagePaths.push(parts[1]);
        }
      }
    }

    if (imagePaths.length > 0) {
      await supabase.storage.from("experience-images").remove(imagePaths);
    }

    const { error: expError } = await supabase
      .from("experiences")
      .delete()
      .eq("profile_id", userId);

    if (expError) return { ok: false, error: expError.message };
  }

  const { data: avatarList } = await supabase.storage
    .from("avatars")
    .list(userId);

  if (avatarList && avatarList.length > 0) {
    const avatarPaths = avatarList.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from("avatars").remove(avatarPaths);
  }

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