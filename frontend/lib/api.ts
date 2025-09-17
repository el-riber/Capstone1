import { supabase } from "@/lib/supabaseClient";


export async function fetchMoodEntries(user_id: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("mood_entries")
    .select("mood, emoji, reflection, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: true })
    .limit(7);

  if (error) {
    console.error("Supabase fetch error:", error.message);
    throw new Error("Failed to fetch mood entries.");
  }

  return data ?? [];
}


export async function fetchWeeklySummary(user_id: string): Promise<string> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/insights/summary?user_id=${user_id}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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

export async function fetchWeeklySummaryFromEntries(entries: any[]): Promise<string> {
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