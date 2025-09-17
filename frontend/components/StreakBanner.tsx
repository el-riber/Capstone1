"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function StreakBanner() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const fetchStreak = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data: entries, error } = await supabase
        .from("mood_entries")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!entries || error) return;

      const streak = calculateStreak(entries.map((e) => e.created_at));
      setStreak(streak);
    };

    fetchStreak();
  }, []);

  return (
    <div className="bg-yellow-100 border border-yellow-300 text-yellow-900 p-4 rounded-xl shadow-md mb-6 text-center">
      <h3 className="text-lg font-semibold">🔥 You’re on a {streak}-day streak!</h3>
      <p className="text-sm">Keep up the consistency for better mental wellness!</p>
    </div>
  );
}


function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;

  for (let i = 0; i < dates.length; i++) {
    const entryDate = new Date(dates[i]);
    entryDate.setHours(0, 0, 0, 0);

    const diffDays = (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
