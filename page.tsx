'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

import {
  BarChart3,
  Calendar,
  TrendingUp,
  Activity,
  Brain,
  AlertCircle,
  Moon,
  Pill,
  Users,
  Zap,
  TrendingDown,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';

interface EnhancedMoodEntry {
  id: string;
  mood: number;
  sleep_hours: number;
  sleep_quality: number;
  medication_taken: boolean | null;
  energy_level: number;
  social_interaction: number;
  triggers: string[];
  created_at: string;
  reflection: string;
}

interface Episode {
  id?: string;
  user_id: string;
  type: 'manic' | 'hypomanic' | 'depressive' | 'mixed';
  severity: 'mild' | 'moderate' | 'severe';
  start_date: string;
  end_date: string | null;
  symptoms: string[];
  triggers: string[];
  notes: string;
  hospitalization: boolean;
  medication_changes: string;
  created_at?: string;
}

const episodeTypes = [
  { value: 'depressive', label: 'Depressive', color: 'blue', icon: TrendingDown },
  { value: 'manic', label: 'Manic', color: 'red', icon: TrendingUp },
  { value: 'hypomanic', label: 'Hypomanic', color: 'orange', icon: TrendingUp },
  { value: 'mixed', label: 'Mixed', color: 'purple', icon: AlertCircle },
] as const;

const commonSymptoms = {
  depressive: [
    'Persistent sadness',
    'Loss of interest',
    'Fatigue',
    'Sleep problems',
    'Appetite changes',
    'Concentration difficulties',
    'Guilt/worthlessness',
    'Hopelessness',
    'Suicidal thoughts',
  ],
  manic: [
    'Elevated mood',
    'Increased energy',
    'Decreased sleep need',
    'Racing thoughts',
    'Grandiosity',
    'Poor judgment',
    'Increased activity',
    'Distractibility',
    'Rapid speech',
    'Risky behavior',
  ],
  hypomanic: [
    'Elevated mood',
    'Increased energy',
    'Decreased sleep need',
    'More talkative',
    'Increased confidence',
    'More social',
    'Increased productivity',
  ],
  mixed: [
    'Mood swings',
    'Agitation',
    'Anxiety',
    'Fatigue with restlessness',
    'Racing thoughts with sadness',
    'Irritability',
  ],
} as const;

const styleByColor = {
  blue: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    subtle: 'text-blue-700',
    chipBg: 'bg-blue-100',
    chipText: 'text-blue-800',
    icon: 'text-blue-600',
  },
  red: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    text: 'text-red-900',
    subtle: 'text-red-700',
    chipBg: 'bg-red-100',
    chipText: 'text-red-800',
    icon: 'text-red-600',
  },
  orange: {
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    text: 'text-orange-900',
    subtle: 'text-orange-700',
    chipBg: 'bg-orange-100',
    chipText: 'text-orange-800',
    icon: 'text-orange-600',
  },
  purple: {
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    subtle: 'text-purple-700',
    chipBg: 'bg-purple-100',
    chipText: 'text-purple-800',
    icon: 'text-purple-600',
  },
} as const;

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] =
    useState<'analytics' | 'episodes' | 'trends'>('analytics');
  const [entries, setEntries] = useState<EnhancedMoodEntry[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [episodeFormData, setEpisodeFormData] = useState<Partial<Episode>>({
    type: 'depressive',
    severity: 'mild',
    start_date: '',
    end_date: '',
    symptoms: [],
    triggers: [],
    notes: '',
    hospitalization: false,
    medication_changes: '',
  });
  const [newTrigger, setNewTrigger] = useState('');

  const tabs = [
    {
      id: 'analytics',
      label: 'Clinical Analytics',
      icon: BarChart3,
      description: 'Mood stability & correlations',
    },
    {
      id: 'episodes',
      label: 'Episode Tracking',
      icon: Calendar,
      description: 'Manic & depressive episodes',
    },
    {
      id: 'trends',
      label: 'Long-term Trends',
      icon: TrendingUp,
      description: 'Seasonal & cyclical patterns',
    },
  ] as const;

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      let entriesData: any[] | null = null;
      try {
        const { data } = await supabase
          .from('enhanced_mood_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });
        entriesData = data;
      } catch {
        const { data } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });
        entriesData = data;
      }

      let episodesData: any[] = [];
      try {
        const { data } = await supabase
          .from('episodes')
          .select('*')
          .eq('user_id', userId)
          .order('start_date', { ascending: false });
        episodesData = data || [];
      } catch {
        episodesData = [];
      }

      if (entriesData) setEntries(entriesData as EnhancedMoodEntry[]);
      if (episodesData) setEpisodes(episodesData as Episode[]);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStabilityMetrics = () => {
    if (entries.length < 2) return null;
    const moods = entries.map((e) => Number(e.mood ?? 0));
    const averageMood = moods.reduce((sum, m) => sum + m, 0) / moods.length;
    const moodRange = Math.max(...moods) - Math.min(...moods);

    let volatilitySum = 0;
    for (let i = 1; i < moods.length; i++) {
      const diff = moods[i] - moods[i - 1];
      volatilitySum += diff * diff;
    }
    const volatilityScore = Math.sqrt(volatilitySum / (moods.length - 1));
    return { volatilityScore, averageMood, moodRange, entryCount: entries.length };
  };

  const calculateCorrelations = () => {
    if (entries.length < 3) return null;

    const pearson = (x: number[], y: number[]): number => {
      const n = x.length;
      if (n !== y.length || n < 2) return 0;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
      const sumXX = x.reduce((s, xi) => s + xi * xi, 0);
      const sumYY = y.reduce((s, yi) => s + yi * yi, 0);
      const num = n * sumXY - sumX * sumY;
      const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
      return den === 0 ? 0 : num / den;
    };

    const moods = entries.map((e) => Number(e.mood ?? 0));
    const sleepHours = entries.filter((e) => (e.sleep_hours ?? 0) > 0).map((e) => Number(e.sleep_hours ?? 0));
    const sleepMoods = entries.filter((e) => (e.sleep_hours ?? 0) > 0).map((e) => Number(e.mood ?? 0));
    const energy = entries.map((e) => Number((e as any).energy_level ?? e.mood ?? 0));
    const social = entries.map((e) => Number((e as any).social_interaction ?? 3));

    return {
      sleepMoodCorrelation: sleepHours.length > 2 ? pearson(sleepHours, sleepMoods) : 0,
      energyMoodCorrelation: pearson(energy, moods),
      socialMoodCorrelation: pearson(social, moods),
      medicationComplianceRate:
        entries.filter((e) => e.medication_taken !== null).length > 0
          ? entries.filter((e) => e.medication_taken === true).length /
            entries.filter((e) => e.medication_taken !== null).length
          : 0,
    };
  };

  const getMostCommonTriggers = () => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => e.triggers?.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts)
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const saveEpisode = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const episodeData = {
        ...episodeFormData,
        user_id: userId,
        end_date: episodeFormData.end_date || null,
        symptoms: episodeFormData.symptoms || [],
        triggers: episodeFormData.triggers || [],
        notes: episodeFormData.notes || '',
        medication_changes: episodeFormData.medication_changes || '',
        hospitalization: !!episodeFormData.hospitalization,
      };

      const result = editingEpisode?.id
        ? await supabase.from('episodes').update(episodeData).eq('id', editingEpisode.id)
        : await supabase.from('episodes').insert([episodeData]);

      if ((result as any).error) throw (result as any).error;

      await loadAnalyticsData();
      resetEpisodeForm();
    } catch (error) {
      console.error('Error saving episode:', error);
    }
  };

  const deleteEpisode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    try {
      const { error } = await supabase.from('episodes').delete().eq('id', id);
      if (error) throw error;
      await loadAnalyticsData();
    } catch (error) {
      console.error('Error deleting episode:', error);
    }
  };

  const resetEpisodeForm = () => {
    setEpisodeFormData({
      type: 'depressive',
      severity: 'mild',
      start_date: '',
      end_date: '',
      symptoms: [],
      triggers: [],
      notes: '',
      hospitalization: false,
      medication_changes: '',
    });
    setNewTrigger('');
    setEditingEpisode(null);
    setShowEpisodeForm(false);
  };

  const startEditEpisode = (ep: Episode) => {
    setEpisodeFormData({
      ...ep,
      end_date: ep.end_date ?? '',
    });
    setEditingEpisode(ep);
    setShowEpisodeForm(true);
  };

  const addTrigger = () => {
    const t = newTrigger.trim();
    if (!t) return;
    setEpisodeFormData((prev) => ({
      ...prev,
      triggers: [...(prev.triggers || []), t],
    }));
    setNewTrigger('');
  };

  const removeTrigger = (t: string) => {
    setEpisodeFormData((prev) => ({
      ...prev,
      triggers: (prev.triggers || []).filter((x) => x !== t),
    }));
  };

  const getEpisodeDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const monthlyAverages = (() => {
    if (entries.length === 0) return [];
    const buckets: Record<string, { sum: number; count: number; label: string }> = {};
    entries.forEach((e) => {
      const d = new Date(e.created_at);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const label = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
      if (!buckets[key]) buckets[key] = { sum: 0, count: 0, label };
      buckets[key].sum += Number(e.mood ?? 0);
      buckets[key].count += 1;
    });
    return Object.values(buckets)
      .map((b) => ({ label: b.label, avg: b.sum / b.count }))
      .sort((a, b) => {
        const ay = Number(a.label.slice(-4));
        const by = Number(b.label.slice(-4));
        if (ay !== by) return ay - by;
        const mi = (m: string) =>
          ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(m);
        return mi(a.label.slice(0, 3)) - mi(b.label.slice(0, 3));
      });
  })();

  const stabilityMetrics = calculateStabilityMetrics();
  const correlations = calculateCorrelations();

  return (
    <>
      <NavBar />
      <main className="min-h-[calc(100vh-160px)] bg-sky-100 px-4 py-10 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-blue-900 mb-2">Clinical Analytics</h1>
            <p className="text-gray-800">
              Comprehensive mood analysis and pattern recognition for better mental health insights
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        active
                          ? 'border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-800 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <div className="text-left">
                        <div>{tab.label}</div>
                        <div className="text-xs text-gray-700">{tab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* ---------- Clinical Analytics Tab ---------- */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Time Range Selector */}
              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-blue-900 flex items-center">
                    <Brain className="w-6 h-6 mr-2 text-blue-600" />
                    Clinical Analytics Dashboard
                  </h2>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 3 months</option>
                    <option value={180}>Last 6 months</option>
                  </select>
                </div>
              </div>

              {/* Stability Metrics */}
              {stabilityMetrics && (
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Mood Stability Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-700 font-medium">Volatility Score</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {stabilityMetrics.volatilityScore.toFixed(2)}
                      </div>
                      <div className="text-xs text-blue-700">
                        {stabilityMetrics.volatilityScore < 1
                          ? 'Very Stable'
                          : stabilityMetrics.volatilityScore < 2
                          ? 'Stable'
                          : stabilityMetrics.volatilityScore < 3
                          ? 'Moderate'
                          : 'Highly Variable'}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-700 font-medium">Average Mood</div>
                      <div className="text-2xl font-bold text-green-900">
                        {stabilityMetrics.averageMood.toFixed(1)}/8
                      </div>
                      <div className="text-xs text-green-700">Over last {timeRange} days</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-purple-700 font-medium">Entries Count</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {stabilityMetrics.entryCount}
                      </div>
                      <div className="text-xs text-purple-700">
                        Range: {stabilityMetrics.moodRange.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Correlations */}
              {correlations && (
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-orange-600" />
                    Factor Correlations with Mood
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Moon className="w-4 h-4 mr-2 text-indigo-600" />
                        <span className="text-sm text-indigo-700 font-medium">Sleep & Mood</span>
                      </div>
                      <div className="text-xl font-bold text-indigo-900">
                        {(correlations.sleepMoodCorrelation * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-indigo-700">
                        {Math.abs(correlations.sleepMoodCorrelation) > 0.3
                          ? 'Strong'
                          : Math.abs(correlations.sleepMoodCorrelation) > 0.1
                          ? 'Moderate'
                          : 'Weak'}{' '}
                        correlation
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                        <span className="text-sm text-yellow-700 font-medium">Energy & Mood</span>
                      </div>
                      <div className="text-xl font-bold text-yellow-900">
                        {(correlations.energyMoodCorrelation * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-yellow-700">
                        {Math.abs(correlations.energyMoodCorrelation) > 0.3
                          ? 'Strong'
                          : Math.abs(correlations.energyMoodCorrelation) > 0.1
                          ? 'Moderate'
                          : 'Weak'}{' '}
                        correlation
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Users className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="text-sm text-purple-700 font-medium">Social & Mood</span>
                      </div>
                      <div className="text-xl font-bold text-purple-900">
                        {(correlations.socialMoodCorrelation * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-purple-700">
                        {Math.abs(correlations.socialMoodCorrelation) > 0.3
                          ? 'Strong'
                          : Math.abs(correlations.socialMoodCorrelation) > 0.1
                          ? 'Moderate'
                          : 'Weak'}{' '}
                        correlation
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Pill className="w-4 h-4 mr-2 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">Med Compliance</span>
                      </div>
                      <div className="text-xl font-bold text-green-900">
                        {(correlations.medicationComplianceRate * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-green-700">Adherence rate</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Triggers */}
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Triggers</h3>
                {getMostCommonTriggers().length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      const data = getMostCommonTriggers();
                      const max = Math.max(...data.map((x) => x.count));
                      return data.map((t) => {
                        const width = max ? Math.round((t.count / max) * 100) : 0;
                        return (
                          <div
                            key={t.trigger}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="font-medium text-gray-900">{t.trigger}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-700">{t.count} times</span>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center text-gray-800 py-4">
                    <p>No triggers recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------- Episode Tracking Tab ---------- */}
          {activeTab === 'episodes' && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-purple-600" />
                  Episode Tracking
                </h2>
                <button
                  onClick={() => setShowEpisodeForm(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Episode</span>
                </button>
              </div>

              {/* Episodes List */}
              <div className="space-y-4">
                {episodes.length === 0 ? (
                  <div className="text-center text-gray-800 py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No episodes recorded yet</p>
                    <p className="text-sm">Start tracking episodes to identify patterns</p>
                  </div>
                ) : (
                  episodes.map((ep) => {
                    const typeInfo = episodeTypes.find((t) => t.value === ep.type) || episodeTypes[0];
                    const styles = styleByColor[typeInfo.color as keyof typeof styleByColor];
                    const duration = getEpisodeDuration(ep.start_date, ep.end_date);
                    const Icon = typeInfo.icon;
                    return (
                      <div key={ep.id} className={`border ${styles.border} ${styles.bg} rounded-lg p-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon className={`w-5 h-5 ${styles.icon}`} />
                            <div>
                              <h4 className={`font-medium capitalize ${styles.text}`}>
                                {ep.type} Episode ({ep.severity})
                              </h4>
                              <p className={`text-sm ${styles.subtle}`}>
                                {new Date(ep.start_date).toLocaleDateString()} –{' '}
                                {ep.end_date ? new Date(ep.end_date).toLocaleDateString() : 'Ongoing'}
                                <span className="ml-2">({duration} days)</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => startEditEpisode(ep)} className={`p-1 ${styles.icon} hover:opacity-90`}>
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteEpisode(ep.id!)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {ep.symptoms?.length > 0 && (
                          <div className="mt-3">
                            <p className={`text-sm font-medium ${styles.subtle} mb-1`}>Symptoms:</p>
                            <div className="flex flex-wrap gap-1">
                              {ep.symptoms.slice(0, 5).map((s) => (
                                <span
                                  key={s}
                                  className={`px-2 py-1 ${styles.chipBg} ${styles.chipText} text-xs rounded`}
                                >
                                  {s}
                                </span>
                              ))}
                              {ep.symptoms.length > 5 && (
                                <span className={`px-2 py-1 ${styles.chipBg} ${styles.chipText} text-xs rounded`}>
                                  +{ep.symptoms.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {ep.notes && <p className={`text-sm ${styles.subtle} mt-2`}>{ep.notes}</p>}

                        {ep.hospitalization && (
                          <div className="mt-2 flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-700 font-medium">Required hospitalization</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ---------- Long-term Trends Tab ---------- */}
          {activeTab === 'trends' && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Long-term Trends Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly averages */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3">Monthly Mood Averages</h4>
                  {monthlyAverages.length > 0 ? (
                    <div className="space-y-2">
                      {(() => {
                        const maxAvg = Math.max(...monthlyAverages.map((m) => m.avg));
                        return monthlyAverages.map((m) => (
                          <div key={m.label} className="flex items-center justify-between">
                            <span className="text-sm text-blue-700 w-28">{m.label}</span>
                            <div className="flex-1 mx-3 h-2 bg-blue-200 rounded-full">
                              <div
                                className="h-2 bg-blue-600 rounded-full"
                                style={{ width: `${(m.avg / (maxAvg || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-blue-900">{m.avg.toFixed(1)}/8</span>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-blue-800">Not enough data yet</p>
                  )}
                </div>

                {/* Episode overview */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-3">Episodes Overview</h4>
                  {episodes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {episodeTypes.map((t) => {
                        const count = episodes.filter((e) => e.type === t.value).length;
                        return (
                          <div
                            key={t.value}
                            className="bg-white rounded-md p-3 shadow-sm border border-purple-100 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <t.icon className="w-4 h-4 text-purple-600" />
                              <span className="text-sm text-purple-800">{t.label}</span>
                            </div>
                            <span className="text-sm font-semibold text-purple-900">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-purple-800">No episodes logged yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Episode Form Modal */}
        {showEpisodeForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingEpisode ? 'Edit Episode' : 'Add Episode'}
                </h3>
                <button onClick={resetEpisodeForm} className="p-2 rounded hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Type & Severity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Type</label>
                    <select
                      value={episodeFormData.type}
                      onChange={(e) =>
                        setEpisodeFormData((f) => ({
                          ...f,
                          type: e.target.value as Episode['type'],
                          symptoms: [],
                        }))
                      }
                      className="w-full border rounded-md px-3 py-2"
                    >
                      {episodeTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Severity</label>
                    <select
                      value={episodeFormData.severity}
                      onChange={(e) =>
                        setEpisodeFormData((f) => ({
                          ...f,
                          severity: e.target.value as Episode['severity'],
                        }))
                      }
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={episodeFormData.start_date || ''}
                      onChange={(e) => setEpisodeFormData((f) => ({ ...f, start_date: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">End Date (optional)</label>
                    <input
                      type="date"
                      value={episodeFormData.end_date || ''}
                      onChange={(e) => setEpisodeFormData((f) => ({ ...f, end_date: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                {/* Symptoms */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Symptoms</label>
                  <div className="flex flex-wrap gap-2">
                    {commonSymptoms[
                      (episodeFormData.type || 'depressive') as keyof typeof commonSymptoms
                    ].map((sym) => {
                      const active = episodeFormData.symptoms?.includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => {
                            const has = episodeFormData.symptoms?.includes(sym);
                            setEpisodeFormData((prev) => ({
                              ...prev,
                              symptoms: has
                                ? (prev.symptoms || []).filter((s) => s !== sym)
                                : [...(prev.symptoms || []), sym],
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm border transition ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {active ? (
                            <span className="inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              {sym}
                            </span>
                          ) : (
                            sym
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Triggers */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Triggers</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTrigger}
                      onChange={(e) => setNewTrigger(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTrigger();
                        }
                      }}
                      placeholder="Type a trigger and press Enter"
                      className="flex-1 border rounded-md px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={addTrigger}
                      className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-black"
                    >
                      Add
                    </button>
                  </div>
                  {episodeFormData.triggers && episodeFormData.triggers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {episodeFormData.triggers.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-800 border border-gray-200"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => removeTrigger(t)}
                            className="text-gray-700 hover:text-gray-900"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes / Hospitalization / Med changes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Notes</label>
                    <textarea
                      value={episodeFormData.notes || ''}
                      onChange={(e) => setEpisodeFormData((f) => ({ ...f, notes: e.target.value }))}
                      rows={3}
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="Any context you want to remember..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="hosp"
                      type="checkbox"
                      checked={!!episodeFormData.hospitalization}
                      onChange={(e) =>
                        setEpisodeFormData((f) => ({ ...f, hospitalization: e.target.checked }))
                      }
                      className="h-4 w-4"
                    />
                    <label htmlFor="hosp" className="text-sm text-gray-900">
                      Required hospitalization
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Medication changes
                    </label>
                    <input
                      type="text"
                      value={episodeFormData.medication_changes || ''}
                      onChange={(e) =>
                        setEpisodeFormData((f) => ({ ...f, medication_changes: e.target.value }))
                      }
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="e.g., dosage increase, new medication"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={resetEpisodeForm}
                  className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEpisode}
                  className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
                >
                   {editingEpisode ? "Save Changes" : "Save Episode"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      
      <Footer />
    </>
  );
}