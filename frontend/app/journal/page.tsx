'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

type MoodEntry = {
  id: string;
  mood: number;
  emoji: string;
  reflection: string;
  created_at: string;
};

export default function JournalPage() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData?.user?.id;

      if (!user_id) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (!error && data) setEntries(data);
      setLoading(false);
    };

    fetchEntries();
  }, []);

  return (
    <>
      <NavBar />

      
      <main className="min-h-[calc(100vh-160px)] bg-blue-50 p-6 pt-24">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-blue-800 mb-4">📝 Your Mood Journal</h1>

          {loading ? (
            <p>Loading...</p>
          ) : entries.length === 0 ? (
            <p>No entries yet.</p>
          ) : (
            <ul className="space-y-4">
              {entries.map((entry) => (
                <li key={entry.id} className="border-b pb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-2xl">{entry.emoji}</span>
                    <span className="text-gray-500 text-sm">
                      {format(new Date(entry.created_at), 'PPPp')}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">Mood Score: {entry.mood}/8</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{entry.reflection}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
