'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

type Entry = {
  id: string;
  mood: number;
  emoji: string | null;
  reflection: string | null;
  created_at: string;
};

const moodToEmoji = (mood: number) => {
  
  const map: Record<number, string> = {
    1: '😡', // Angry
    2: '😫', // Stressed
    3: '😭', // Very Sad
    4: '😢', // Sad
    5: '😐', // Neutral
    6: '😊', // Happy
    7: '😁', // Very Happy
    8: '🤩', // Excited
  };
  return map[mood] ?? '🙂';
};

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>('');

  // keep user id for realtime subscription
  const [userId, setUserId] = useState<string | null>(null);

  const mapEnhanced = (rows: any[]): Entry[] =>
    rows.map((r) => ({
      id: r.id,
      mood: Number(r.mood),
      emoji: r.mood_emoji ?? moodToEmoji(Number(r.mood)),
      reflection: r.reflection ?? '',
      created_at: r.created_at,
    }));

  const mapLegacy = (rows: any[]): Entry[] =>
    rows.map((r) => ({
      id: r.id,
      mood: Number(r.mood),
      emoji: r.emoji ?? moodToEmoji(Number(r.mood)),
      reflection: r.reflection ?? '',
      created_at: r.created_at,
    }));

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setLoadError('');
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const uid = userData?.user?.id;
        setUserId(uid ?? null);

        if (!uid) {
          setEntries([]);
          setLoading(false);
          return;
        }

      
        const { data: enhData, error: enhErr } = await supabase
          .from('enhanced_mood_entries')
          .select('id, mood, mood_emoji, reflection, created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false });

        if (!enhErr && enhData && enhData.length) {
          setEntries(mapEnhanced(enhData));
        } else {
         
          const { data: legacyData, error: legacyErr } = await supabase
            .from('mood_entries')
            .select('id, mood, emoji, reflection, created_at')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

          if (legacyErr) throw legacyErr;
          setEntries(mapLegacy(legacyData ?? []));
        }
      } catch (e: any) {
        console.error('Load journal error:', e);
        setLoadError(e?.message || 'Failed to load entries.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);


  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('journal-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'enhanced_mood_entries',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const e = payload.new as any;
          setEntries((prev) => [
            {
              id: e.id,
              mood: Number(e.mood),
              emoji: e.mood_emoji ?? moodToEmoji(Number(e.mood)),
              reflection: e.reflection ?? '',
              created_at: e.created_at,
            },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <>
      <NavBar />
      <main className="min-h-[calc(100vh-160px)] bg-blue-50 p-6 pt-24">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-blue-800 mb-4">📝 Your Mood Journal</h1>

          {loading ? (
            <p>Loading...</p>
          ) : loadError ? (
            <p className="text-red-600">Error: {loadError}</p>
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
                  <p className="text-gray-800 whitespace-pre-wrap">{entry.reflection || ''}</p>
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
