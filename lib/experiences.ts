// lib/experiences.ts
// All database calls for experiences.
// Web and future React Native app import from here — no Supabase calls scattered in components.

import { supabase } from "./supabase";

export type NewExperience = {
  profile_id:        string;
  category:          string;
  title:             string;
  content:           string;
  pull_quote?:       string;
  language?:         string;
  is_anonymous:      boolean;
  is_live:           boolean;
  is_historical:     boolean;
  historical_source?: string;
  published:         boolean;
  display_name?:     string;
  image_urls?:       string[];
  video_url?:        string;
};

export type PublishResult =
  | { ok: true;  id: string }
  | { ok: false; error: string };

export async function publishExperience(exp: NewExperience): Promise<PublishResult> {
  const { data, error } = await supabase
    .from("experiences")
    .insert({
      profile_id:        exp.profile_id,
      category:          exp.category,
      title:             exp.title,
      content:           exp.content,
      pull_quote:        exp.pull_quote   || null,
      language:          exp.language     || "en",
      is_anonymous:      exp.is_anonymous,
      is_live:           exp.is_live,
      is_historical:     exp.is_historical,
      historical_source: exp.historical_source || null,
      display_name:      exp.display_name || null,
      image_urls:        exp.image_urls   || [],
      video_url:         exp.video_url    || null,
      published:         true,
      carried_forward_count: 0,
      response_count:        0,
      read_time_minutes:     Math.max(1, Math.ceil(exp.content.trim().split(/\s+/).length / 200)),
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function saveDraftToSupabase(exp: NewExperience & { id?: string }): Promise<PublishResult> {
  if (exp.id) {
    const { error } = await supabase
      .from("experiences")
      .update({ ...exp, published: false })
      .eq("id", exp.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: exp.id };
  }

  const { data, error } = await supabase
    .from("experiences")
    .insert({ ...exp, published: false })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

// ─── Feed queries ─────────────────────────────────────────────────────────────
// author_username is joined live from profiles so it always reflects the
// current handle, never a stale snapshot from publish time.
// Giants Way: Twitter/Instagram/Threads always show current handle on posts.
// Long term: no migration needed if someone changes their username.

export type FeedExperience = {
  id:                   string;
  category:             string;
  title:                string;
  content:              string;
  pull_quote:           string | null;
  is_anonymous:         boolean;
  is_live:              boolean;
  is_historical:        boolean;
  carried_forward_count: number;
  response_count:       number;
  read_time_minutes:    number;
  created_at:           string;
  profile_id:           string;
  display_name:         string | null;
  author_username:      string | null; // joined live from profiles
  image_urls:           string[];
  video_url:            string | null;
  is_edited:            boolean;
  edited_at:            string | null;
};

export async function getFeedExperiences(category?: string): Promise<FeedExperience[]> {
  // Join profiles to get username live — never rely on stale snapshot data.
  // Supabase foreign key join: experiences.profile_id → profiles.id
  let query = supabase
    .from("experiences")
    .select(`
      *,
      profiles!experiences_profile_id_fkey (
        username
      )
    `)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (category && category !== "individual") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) return [];

  // Flatten the joined profile data into the experience row
  return (data as any[]).map((row) => ({
    ...row,
    author_username: row.profiles?.username || null,
    profiles: undefined,
  })) as FeedExperience[];
}

export async function getExperienceById(id: string): Promise<FeedExperience | null> {
  const { data, error } = await supabase
    .from("experiences")
    .select(`
      *,
      profiles!experiences_profile_id_fkey (
        username
      )
    `)
    .eq("id", id)
    .eq("published", true)
    .single();

  if (error || !data) return null;

  return {
    ...(data as any),
    author_username: (data as any).profiles?.username || null,
    profiles: undefined,
  } as FeedExperience;
}

// includeAnonymous defaults to false because this function is shared by both
// the owner's own profile and everyone else's public profile. An anonymous
// experience must never appear next to someone's real name and photo on the
// public page — that's the entire point of the anonymous toggle. Only the
// owner's own profile view passes includeAnonymous=true, so a person can see
// the complete list of everything they've written, including what they
// chose to post anonymously.
export async function getExperiencesByProfile(
  profileId: string,
  includeAnonymous = false
): Promise<FeedExperience[]> {
  let query = supabase
    .from("experiences")
    .select(`
      *,
      profiles!experiences_profile_id_fkey (
        username
      )
    `)
    .eq("profile_id", profileId)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (!includeAnonymous) {
    query = query.eq("is_anonymous", false);
  }

  const { data, error } = await query;
  if (error) return [];

  return (data as any[]).map((row) => ({
    ...row,
    author_username: row.profiles?.username || null,
    profiles: undefined,
  })) as FeedExperience[];
}

// ─── Public profiles ───────────────────────────────────────────────────────
// Used by /profile/[id] — guests and other signed-in users viewing someone
// else. Distinct from lib/auth.ts's AnnieUser, which only ever represents
// the currently signed-in person.

export type PublicProfile = {
  id:                     string;
  full_name:              string | null;
  avatar_url:             string | null;
  bio:                    string | null;
  username:               string | null; // added — needed for profile pages and @handle display
  is_verified:            boolean;
  is_guide:               boolean;
  carried_forward_count:  number;
};

export async function getProfileById(profileId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, username, is_verified, is_guide, carried_forward_count")
    .eq("id", profileId)
    .single();

  if (error || !data) return null;
  return data as PublicProfile;
}

export async function carryForward(id: string): Promise<boolean> {
  const { error } = await supabase.rpc("increment_carried_forward", { experience_id: id });
  return !error;
}

// ─── Edit & Delete ─────────────────────────────────────────────────────────────

export type EditableFields = {
  title:      string;
  content:    string;
  pull_quote: string | null;
  image_urls: string[];
  video_url?: string | null;
};

export async function updateExperience(id: string, fields: EditableFields): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("experiences")
    .update({
      title:             fields.title,
      content:           fields.content,
      pull_quote:        fields.pull_quote || null,
      image_urls:        fields.image_urls,
      video_url:         fields.video_url ?? null,
      is_edited:         true,
      edited_at:         new Date().toISOString(),
      read_time_minutes: Math.max(1, Math.ceil(fields.content.trim().split(/\s+/).length / 200)),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteExperience(id: string, imageUrls: string[]): Promise<{ ok: boolean; error?: string }> {
  // Remove images from storage first so they don't linger as orphaned files
  if (imageUrls.length > 0) {
    const paths = imageUrls.map((url) => {
      const parts = url.split("/experience-images/");
      return parts[1] || "";
    }).filter(Boolean);

    if (paths.length > 0) {
      await supabase.storage.from("experience-images").remove(paths);
    }
  }

  const { error } = await supabase.from("experiences").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Image upload ─────────────────────────────────────────────────────────────
// Free accounts get up to 3 photos per experience. Plus will raise this once
// Plus actually exists — no point gating a tier that isn't real yet.

export const FREE_PHOTO_LIMIT = 3;

export type ImageUploadResult =
  | { ok: true;  url: string }
  | { ok: false; error: string };

export async function uploadExperienceImage(file: File, userId: string): Promise<ImageUploadResult> {
  const ext  = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("experience-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from("experience-images").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

// ─── Video link parsing ─────────────────────────────────────────────────────
// "Video link" (paste a YouTube/Vimeo URL) is a real, working feature — no
// storage, no transcoding, just an oEmbed-style ID extraction. This is
// distinct from "video upload," which is not built yet and shown as a
// disabled, honest "coming soon" control in the editor.

export type ParsedVideo =
  | { platform: "youtube"; id: string; embedUrl: string; thumbnailUrl: string }
  | { platform: "vimeo";   id: string; embedUrl: string; thumbnailUrl: string };

export function parseVideoUrl(rawUrl: string): ParsedVideo | null {
  const url = rawUrl.trim();
  if (!url) return null;

  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of ytPatterns) {
    const match = url.match(pattern);
    if (match) {
      const id = match[1];
      return {
        platform: "youtube",
        id,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      };
    }
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      platform: "vimeo",
      id,
      embedUrl: `https://player.vimeo.com/video/${id}`,
      thumbnailUrl: "",
    };
  }

  return null;
}