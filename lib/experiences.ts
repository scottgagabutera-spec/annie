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