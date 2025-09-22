"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function StreakBanner() {
  const [streak, setStreak] = useState<number>(0);

  const fmtLocalYMD = (d: Date) => {
    
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const addDays = (d: Date, delta: number) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + delta);
    nd.setHours(0, 0, 0, 0);
    return nd;
  };

  const calculateStreak = (dateStrings: string[]) => {
    if (!dateStrings.length) return 0;

    
    const set = new Set(dateStrings);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    
    let cursor = set.has(fmtLocalYMD(today)) ? today : addDays(today, -1);
    if (!set.has(fmtLocalYMD(cursor))) return 0;

    let s = 0;
    while (set.has(fmtLocalYMD(cursor))) {
      s += 1;
      cursor = addDays(cursor, -1);
    }
    return s;
  };

  const fetchStreak = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setStreak(0);
      return;
    }

    
    const since = new Date();
    since.setDate(since.getDate() - 90);

   
    const { data: enhanced } = await supabase
      .from("enhanced_mood_entries")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    
    const { data: legacy } = await supabase
      .from("mood_entries")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    const all = [...(enhanced || []), ...(legacy || [])];

   
    const dayStrings = Array.from(
      new Set(
        all.map((e: any) => {
          const d = new Date(e.created_at);
          d.setHours(0, 0, 0, 0);
          return fmtLocalYMD(d);
        })
      )
    );

    setStreak(calculateStreak(dayStrings));
  }, []);

  useEffect(() => {
    fetchStreak();

    
    const onSaved = () => fetchStreak();
    window.addEventListener("mood-saved", onSaved);
    return () => window.removeEventListener("mood-saved", onSaved);
  }, [fetchStreak]);

  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl shadow-sm text-center">
      {streak > 0 ? (
        <>
          <h3 className="text-lg font-semibold">🔥 You’re on a {streak}-day streak!</h3>
          <p className="text-sm">Keep up the consistency for better mental wellness!</p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold">Let’s start your streak ✨</h3>
          <p className="text-sm">Check in today to begin building momentum.</p>
        </>
      )}
    </div>
  );
}
