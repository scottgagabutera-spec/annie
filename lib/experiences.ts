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
};

export async function getFeedExperiences(category?: string): Promise<FeedExperience[]> {
  let query = supabase
    .from("experiences")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (category && category !== "individual") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) return [];
  return data as FeedExperience[];
}

export async function getExperienceById(id: string): Promise<FeedExperience | null> {
  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .single();

  if (error || !data) return null;
  return data as FeedExperience;
}

export async function carryForward(id: string): Promise<boolean> {
  const { error } = await supabase.rpc("increment_carried_forward", { experience_id: id });
  return !error;
}