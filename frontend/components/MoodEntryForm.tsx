'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const moodOptions = [
  { label: "Angry",       value: 1, emoji: "😡" }, 
  { label: "Stressed",    value: 2, emoji: "😫" },
  { label: "Very Sad",    value: 3, emoji: "😭" },
  { label: "Sad",         value: 4, emoji: "😢" },
  { label: "Neutral",     value: 5, emoji: "😐" },
  { label: "Happy",       value: 6, emoji: "😊" },
  { label: "Very Happy",  value: 7, emoji: "😁" },
  { label: "Excited",     value: 8, emoji: "🤩" }, 
];



export default function MoodEntryForm() {
  const [selectedMood, setSelectedMood] = useState(moodOptions[3]);
  const [reflection, setReflection] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;

    if (!user_id) {
      setErrorMsg("User not authenticated.");
      return;
    }

    const { error } = await supabase.from('mood_entries').insert({
      user_id,
      mood: selectedMood.value,
      emoji: selectedMood.emoji,
      reflection,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase insert error:", error);
      setErrorMsg("Failed to save entry. Please try again.");
    } else {
      setSuccess(true);
      setSelectedMood(moodOptions[3]);
      setReflection('');
      setErrorMsg('');
    }
  };

  return (
    <div className="bg-white border shadow-lg p-6 rounded-xl max-w-lg mx-auto mt-8">
      <h2 className="text-xl font-bold text-blue-800 mb-4">How are you feeling today?</h2>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {moodOptions.map((mood) => (
          <button
            key={mood.value}
            onClick={() => setSelectedMood(mood)}
            className={`p-3 text-2xl rounded-full border transition ${
              selectedMood.value === mood.value
                ? 'bg-blue-100 border-blue-500'
                : 'bg-gray-100 border-transparent'
            }`}
            title={mood.label}
          >
            {mood.emoji}
          </button>
        ))}
      </div>

      <Textarea
        rows={4}
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="Write about your day..."
        className="mb-4 bg-white text-black border border-gray-300 rounded-md"
      />

      <Button onClick={handleSubmit} className="w-full">
        Save Entry
      </Button>

      {success && <p className="text-green-600 mt-4">✅ Entry saved!</p>}
      {errorMsg && <p className="text-red-600 mt-4">❌ {errorMsg}</p>}
    </div>
  );
}
