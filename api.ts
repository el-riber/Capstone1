// lib/api.ts
import { supabase } from "@/lib/supabaseClient";

export interface MoodEntryDTO {
  mood: number;
  emoji: string;        
  reflection: string;
  created_at: string;
}


export async function fetchMoodEntries(user_id: string, days = 7): Promise<MoodEntryDTO[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);


  const { data: enhanced, error: enhErr } = await supabase
    .from("enhanced_mood_entries")
    .select("mood, mood_emoji, reflection, created_at")
    .eq("user_id", user_id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (enhErr) {
    console.error("Supabase enhanced fetch error:", enhErr.message);
  }

  if (enhanced && enhanced.length) {
    return enhanced.map((row: any) => ({
      mood: row.mood,
      emoji: row.mood_emoji ?? "",
      reflection: row.reflection ?? "",
      created_at: row.created_at,
    }));
  }

 
  const { data: legacy, error: legacyErr } = await supabase
    .from("mood_entries")
    .select("mood, emoji, reflection, created_at")
    .eq("user_id", user_id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (legacyErr) {
    console.error("Supabase legacy fetch error:", legacyErr.message);
    throw new Error("Failed to fetch mood entries.");
  }

  return (legacy ?? []).map((row: any) => ({
    mood: row.mood,
    emoji: row.emoji ?? "",
    reflection: row.reflection ?? "",
    created_at: row.created_at,
  }));
}

export async function fetchWeeklySummary(user_id: string): Promise<string> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/insights/summary?user_id=${user_id}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Weekly summary fetch error:", errorText);
    throw new Error("Failed to generate weekly summary.");
  }
  const data = await res.json();
  return data.summary ?? "No summary generated.";
}

export async function fetchWeeklySummaryFromEntries(entries: MoodEntryDTO[]): Promise<string> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/weekly-summary`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    }
  );
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Weekly summary fetch error:", errorText);
    throw new Error("Failed to generate weekly summary.");
  }
  const data = await res.json();
  return data.summary ?? "No summary generated.";
}
