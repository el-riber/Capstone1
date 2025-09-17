'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Moon, Pill, Zap, Users, Tag, Clock, Check, X } from 'lucide-react';

type MoodOption = { label: string; value: number; emoji: string };

const moodOptions: MoodOption[] = [
  { label: "Angry",       value: 1, emoji: "😡" }, 
  { label: "Stressed",    value: 2, emoji: "😫" },
  { label: "Very Sad",    value: 3, emoji: "😭" },
  { label: "Sad",         value: 4, emoji: "😢" },
  { label: "Neutral",     value: 5, emoji: "😐" },
  { label: "Happy",       value: 6, emoji: "😊" },
  { label: "Very Happy",  value: 7, emoji: "😁" },
  { label: "Excited",     value: 8, emoji: "🤩" }, 
];

const sleepQualityOptions = [
  { label: 'Terrible', value: 1, description: 'No sleep/very disturbed' },
  { label: 'Poor', value: 2, description: 'Restless, frequent waking' },
  { label: 'Fair', value: 3, description: 'Some sleep issues' },
  { label: 'Good', value: 4, description: 'Mostly restful' },
  { label: 'Excellent', value: 5, description: 'Deep, refreshing sleep' },
];

const energyLevelOptions = [
  { label: 'Exhausted', value: 1, emoji: '😴' },
  { label: 'Low', value: 2, emoji: '😑' },
  { label: 'Moderate', value: 3, emoji: '🙂' },
  { label: 'High', value: 4, emoji: '😊' },
  { label: 'Very High', value: 5, emoji: '⚡' },
];

const socialInteractionOptions = [
  { label: 'Complete isolation', value: 1 },
  { label: 'Minimal contact', value: 2 },
  { label: 'Some interaction', value: 3 },
  { label: 'Good social contact', value: 4 },
  { label: 'Very social/active', value: 5 },
];

const commonTriggers = [
  'Work stress','Relationship issues','Financial worry','Weather change',
  'Sleep disruption','Medication change','Social conflict','Health concern',
  'Family issues','Academic pressure','Travel','Hormonal changes',
];

export default function EnhancedMoodEntryForm() {
  const router = useRouter();

  const defaultMood = useMemo(() => moodOptions[2], []);
  const [selectedMood, setSelectedMood] = useState<MoodOption>(defaultMood);
  const [reflection, setReflection] = useState('');
  const [sleepHours, setSleepHours] = useState<string>('');
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [medicationTaken, setMedicationTaken] = useState<boolean | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [socialInteraction, setSocialInteraction] = useState<number>(3);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [customTrigger, setCustomTrigger] = useState('');

  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev =>
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const addCustomTrigger = () => {
    const t = customTrigger.trim();
    if (!t) return;
    setSelectedTriggers(prev => Array.from(new Set([...prev, t])));
    setCustomTrigger('');
  };

  const resetForm = () => {
    setSelectedMood(defaultMood);
    setReflection('');
    setSleepHours('');
    setSleepQuality(3);
    setMedicationTaken(null);
    setEnergyLevel(3);
    setSocialInteraction(3);
    setSelectedTriggers([]);
    setCustomTrigger('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccess(false);
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData?.user?.id;
      if (!user_id) {
        setErrorMsg('User not authenticated.');
        setLoading(false);
        return;
      }

      const parsedSleep =
        sleepHours.trim() === '' ? null : Math.max(0, Math.min(24, parseFloat(sleepHours)));

      const payload = {
        user_id,
        mood: selectedMood.value,
        mood_emoji: selectedMood.emoji,
        reflection: reflection.trim() || null,
        sleep_hours: parsedSleep,
        sleep_quality: Number.isFinite(sleepQuality) ? sleepQuality : null,
        medication_taken: medicationTaken,
        energy_level: Number.isFinite(energyLevel) ? energyLevel : null,
        social_interaction: Number.isFinite(socialInteraction) ? socialInteraction : null,
        triggers: selectedTriggers.length ? selectedTriggers : [],
      };

      const { error } = await supabase.from('enhanced_mood_entries').insert([payload]);

      if (error) {
        console.error('Supabase insert error:', error);
        setErrorMsg(error.message || 'Failed to save entry. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      resetForm();

      
      router.refresh();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving entry:', err);
      setErrorMsg(err?.message || 'Failed to save entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border shadow-lg p-6 rounded-xl max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-blue-800 mb-6">Daily Wellness Check-in</h2>

      {/* Mood */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">How are you feeling today?</h3>
        <div className="grid grid-cols-5 gap-2">
          {moodOptions.map(mood => (
            <button
              type="button"
              key={mood.value}
              onClick={() => setSelectedMood(mood)}
              className={`p-3 text-2xl rounded-lg border transition ${
                selectedMood.value === mood.value ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
              }`}
              title={mood.label}
            >
              {mood.emoji}
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">{selectedMood.label}</p>
      </div>

      {/* Sleep */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center"><Moon className="w-5 h-5 mr-2 text-indigo-600" />Sleep</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hours of sleep</label>
            <input
              type="number" step="0.5" min={0} max={24} value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="e.g., 7.5"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sleep quality</label>
            <select
              value={sleepQuality}
              onChange={(e) => setSleepQuality(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {sleepQualityOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label} - {o.description}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Medication */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center"><Pill className="w-5 h-5 mr-2 text-green-600" />Medication</h3>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setMedicationTaken(true)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition ${
              medicationTaken === true ? 'bg-green-100 border-green-500 text-green-800' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
            }`}
          >
            <Check className="w-4 h-4" /><span>Taken as prescribed</span>
          </button>
          <button
            type="button"
            onClick={() => setMedicationTaken(false)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition ${
              medicationTaken === false ? 'bg-red-100 border-red-500 text-red-800' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
            }`}
          >
            <X className="w-4 h-4" /><span>Missed/Skipped</span>
          </button>
        </div>
      </div>

      {/* Energy */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center"><Zap className="w-5 h-5 mr-2 text-yellow-600" />Energy Level</h3>
        <div className="grid grid-cols-5 gap-2">
          {energyLevelOptions.map(level => (
            <button
              type="button"
              key={level.value}
              onClick={() => setEnergyLevel(level.value)}
              className={`p-3 text-xl rounded-lg border transition ${
                energyLevel === level.value ? 'bg-yellow-100 border-yellow-500' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
              }`}
              title={level.label}
            >
              {level.emoji}
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
          {energyLevelOptions.find(l => l.value === energyLevel)?.label}
        </p>
      </div>

      {/* Social */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center"><Users className="w-5 h-5 mr-2 text-purple-600" />Social Interaction</h3>
        <select
          value={socialInteraction}
          onChange={(e) => setSocialInteraction(parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          {socialInteractionOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Triggers */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center"><Tag className="w-5 h-5 mr-2 text-red-600" />Potential Triggers</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          {commonTriggers.map(trigger => (
            <button
              type="button"
              key={trigger}
              onClick={() => toggleTrigger(trigger)}
              className={`p-2 text-sm rounded-lg border transition ${
                selectedTriggers.includes(trigger) ? 'bg-red-100 border-red-500 text-red-800' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {trigger}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={customTrigger}
            onChange={(e) => setCustomTrigger(e.target.value)}
            placeholder="Add custom trigger..."
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomTrigger();
              }
            }}
          />
          <Button type="button" onClick={addCustomTrigger} disabled={!customTrigger.trim()}>
            Add
          </Button>
        </div>
        {selectedTriggers.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-1">Selected triggers:</p>
            <div className="flex flex-wrap gap-1">
              {selectedTriggers.map(trigger => (
                <span key={trigger} className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  {trigger}
                  <button
                    type="button"
                    onClick={() => toggleTrigger(trigger)}
                    className="ml-1 hover:text-red-600"
                    aria-label={`Remove ${trigger}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reflection */}
      <div className="mb-6">
        <label className="block text-lg font-semibold text-gray-700 mb-3">Reflection & Notes</label>
        <Textarea
          rows={4}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="How was your day? Any patterns you noticed?"
          className="w-full bg-white text-black border border-gray-300 rounded-md"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full flex items-center justify-center space-x-2">
        <Clock className="w-4 h-4" />
        <span>{loading ? 'Saving...' : 'Save Daily Entry'}</span>
      </Button>

      {success && <p className="text-green-600 mt-4 text-center">✅ Entry saved successfully!</p>}
      {errorMsg && <p className="text-red-600 mt-4 text-center">❌ {errorMsg}</p>}
    </form>
  );
}
