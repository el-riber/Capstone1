'use client';

import { useState, useEffect, SetStateAction } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  TrendingUp, 
  Calendar, 
  Activity, 
  Brain,
  AlertCircle,
  Moon,
  Pill,
  Users,
  Zap
} from 'lucide-react';

interface EnhancedMoodEntry {
  id: string;
  mood: number;
  sleep_hours: number;
  sleep_quality: number;
  medication_taken: boolean;
  energy_level: number;
  social_interaction: number;
  triggers: string[];
  created_at: string;
  reflection: string;
}

interface MoodStabilityMetrics {
  volatilityScore: number;
  stabilityTrend: 'improving' | 'declining' | 'stable';
  averageMood: number;
  moodRange: number;
  consecutiveLowDays: number;
  consecutiveHighDays: number;
}

interface CorrelationAnalysis {
  sleepMoodCorrelation: number;
  energyMoodCorrelation: number;
  socialMoodCorrelation: number;
  medicationComplianceRate: number;
}

export default function ClinicalAnalyticsDashboard() {
  const [entries, setEntries] = useState<EnhancedMoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30); // days
  const [stabilityMetrics, setStabilityMetrics] = useState<MoodStabilityMetrics | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationAnalysis | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);

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

      const { data, error } = await supabase
        .from('enhanced_mood_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (data && !error) {
        setEntries(data);
        calculateStabilityMetrics(data);
        calculateCorrelations(data);
        detectEpisodes(data);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStabilityMetrics = (data: EnhancedMoodEntry[]): void => {
    if (data.length < 2) return;

    const moods = data.map(entry => entry.mood);
    const averageMood = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;
    const moodRange = Math.max(...moods) - Math.min(...moods);

    // Calculate volatility (standard deviation of mood changes)
    let volatilitySum = 0;
    for (let i = 1; i < moods.length; i++) {
      volatilitySum += Math.pow(moods[i] - moods[i-1], 2);
    }
    const volatilityScore = Math.sqrt(volatilitySum / (moods.length - 1));

    // Detect consecutive patterns
    let consecutiveLowDays = 0;
    let consecutiveHighDays = 0;
    let currentLowStreak = 0;
    let currentHighStreak = 0;

    moods.forEach(mood => {
      if (mood <= 2) {
        currentLowStreak++;
        currentHighStreak = 0;
        consecutiveLowDays = Math.max(consecutiveLowDays, currentLowStreak);
      } else if (mood >= 4) {
        currentHighStreak++;
        currentLowStreak = 0;
        consecutiveHighDays = Math.max(consecutiveHighDays, currentHighStreak);
      } else {
        currentLowStreak = 0;
        currentHighStreak = 0;
      }
    });

    // Determine stability trend
    const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
    const secondHalf = moods.slice(Math.floor(moods.length / 2));
    const firstHalfVolatility = calculateVolatility(firstHalf);
    const secondHalfVolatility = calculateVolatility(secondHalf);
    
    let stabilityTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (firstHalfVolatility - secondHalfVolatility > 0.3) {
      stabilityTrend = 'improving';
    } else if (secondHalfVolatility - firstHalfVolatility > 0.3) {
      stabilityTrend = 'declining';
    }

    setStabilityMetrics({
      volatilityScore,
      stabilityTrend,
      averageMood,
      moodRange,
      consecutiveLowDays,
      consecutiveHighDays
    });
  };

  const calculateVolatility = (moods: number[]): number => {
    if (moods.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < moods.length; i++) {
      sum += Math.pow(moods[i] - moods[i-1], 2);
    }
    return Math.sqrt(sum / (moods.length - 1));
  };

  const calculateCorrelations = (data: EnhancedMoodEntry[]): void => {
    if (data.length < 3) return;

    const sleepMoodCorrelation = calculatePearsonCorrelation(
      data.map(e => e.sleep_hours || 0),
      data.map(e => e.mood)
    );

    const energyMoodCorrelation = calculatePearsonCorrelation(
      data.map(e => e.energy_level),
      data.map(e => e.mood)
    );

    const socialMoodCorrelation = calculatePearsonCorrelation(
      data.map(e => e.social_interaction),
      data.map(e => e.mood)
    );

    const medicationEntries = data.filter(e => e.medication_taken !== null);
    const medicationComplianceRate = medicationEntries.length > 0
      ? medicationEntries.filter(e => e.medication_taken).length / medicationEntries.length
      : 0;

    setCorrelations({
      sleepMoodCorrelation,
      energyMoodCorrelation,
      socialMoodCorrelation,
      medicationComplianceRate
    });
  };

  const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    if (n !== y.length || n < 2) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const detectEpisodes = (data: EnhancedMoodEntry[]): void => {
    const episodes: SetStateAction<any[]> = [];
    let currentEpisode: { type: any; endDate: any; entries: any; startDate?: string; severity?: string; } | null = null;
    
    data.forEach((entry, index) => {
      const isDepressive = entry.mood <= 2 && entry.energy_level <= 2;
      const isManic = entry.mood >= 4 && entry.energy_level >= 4;
      
      if (isDepressive && (!currentEpisode || currentEpisode.type !== 'depressive')) {
        if (currentEpisode) episodes.push(currentEpisode);
        currentEpisode = {
          type: 'depressive',
          startDate: entry.created_at,
          endDate: entry.created_at,
          severity: 'mild',
          entries: [entry]
        };
      } else if (isManic && (!currentEpisode || currentEpisode.type !== 'manic')) {
        if (currentEpisode) episodes.push(currentEpisode);
        currentEpisode = {
          type: 'manic',
          startDate: entry.created_at,
          endDate: entry.created_at,
          severity: 'mild',
          entries: [entry]
        };
      } else if (currentEpisode && (isDepressive || isManic)) {
        currentEpisode.endDate = entry.created_at;
        currentEpisode.entries.push(entry);
      } else if (currentEpisode) {
        episodes.push(currentEpisode);
        currentEpisode = null;
      }
    });
    
    if (currentEpisode) episodes.push(currentEpisode);
    setEpisodes(episodes);
  };

  const getMostCommonTriggers = (): { trigger: string; count: number }[] => {
    const triggerCounts: { [key: string]: number } = {};
    
    entries.forEach(entry => {
      entry.triggers?.forEach(trigger => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    });

    return Object.entries(triggerCounts)
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const commonTriggers = getMostCommonTriggers();

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
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

      {/* Mood Stability Metrics */}
      {stabilityMetrics && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Mood Stability Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Volatility Score</div>
              <div className="text-2xl font-bold text-blue-900">
                {stabilityMetrics.volatilityScore.toFixed(2)}
              </div>
              <div className="text-xs text-blue-700">
                {stabilityMetrics.volatilityScore < 1 ? 'Very Stable' :
                 stabilityMetrics.volatilityScore < 2 ? 'Stable' :
                 stabilityMetrics.volatilityScore < 3 ? 'Moderate' : 'Highly Variable'}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Stability Trend</div>
              <div className="text-2xl font-bold text-green-900 capitalize">
                {stabilityMetrics.stabilityTrend}
              </div>
              <div className="text-xs text-green-700">
                Over last {timeRange} days
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Average Mood</div>
              <div className="text-2xl font-bold text-purple-900">
                {stabilityMetrics.averageMood.toFixed(1)}/5
              </div>
              <div className="text-xs text-purple-700">
                Range: {stabilityMetrics.moodRange.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correlation Analysis */}
      {correlations && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-orange-600" />
            Factor Correlations with Mood
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Moon className="w-4 h-4 mr-2 text-indigo-600" />
                <span className="text-sm text-indigo-600 font-medium">Sleep & Mood</span>
              </div>
              <div className="text-xl font-bold text-indigo-900">
                {(correlations.sleepMoodCorrelation * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-indigo-700">
                {Math.abs(correlations.sleepMoodCorrelation) > 0.3 ? 'Strong' : 
                 Math.abs(correlations.sleepMoodCorrelation) > 0.1 ? 'Moderate' : 'Weak'} correlation
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                <span className="text-sm text-yellow-600 font-medium">Energy & Mood</span>
              </div>
              <div className="text-xl font-bold text-yellow-900">
                {(correlations.energyMoodCorrelation * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-yellow-700">
                {Math.abs(correlations.energyMoodCorrelation) > 0.3 ? 'Strong' : 
                 Math.abs(correlations.energyMoodCorrelation) > 0.1 ? 'Moderate' : 'Weak'} correlation
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Users className="w-4 h-4 mr-2 text-purple-600" />
                <span className="text-sm text-purple-600 font-medium">Social & Mood</span>
              </div>
              <div className="text-xl font-bold text-purple-900">
                {(correlations.socialMoodCorrelation * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-purple-700">
                {Math.abs(correlations.socialMoodCorrelation) > 0.3 ? 'Strong' : 
                 Math.abs(correlations.socialMoodCorrelation) > 0.1 ? 'Moderate' : 'Weak'} correlation
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Pill className="w-4 h-4 mr-2 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Med Compliance</span>
              </div>
              <div className="text-xl font-bold text-green-900">
                {(correlations.medicationComplianceRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-green-700">
                Adherence rate
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Episode Detection */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
          Episode Detection
        </h3>
        {episodes.length > 0 ? (
          <div className="space-y-3">
            {episodes.map((episode, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  episode.type === 'depressive' 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      episode.type === 'depressive' ? 'bg-blue-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="font-medium capitalize">{episode.type} Episode</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {episode.entries.length} day{episode.entries.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {new Date(episode.startDate).toLocaleDateString()} - {new Date(episode.endDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No episodes detected in the selected time period</p>
            <p className="text-sm">This indicates good mood stability</p>
          </div>
        )}
      </div>

      {/* Common Triggers */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Triggers</h3>
        {commonTriggers.length > 0 ? (
          <div className="space-y-2">
            {commonTriggers.map((trigger, index) => (
              <div key={trigger.trigger} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{trigger.trigger}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{trigger.count} times</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(trigger.count / Math.max(...commonTriggers.map(t => t.count))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p>No triggers recorded yet</p>
          </div>
        )}
      </div>

      {/* Alert Conditions */}
      {stabilityMetrics && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Alerts</h3>
          <div className="space-y-3">
            {stabilityMetrics.consecutiveLowDays >= 5 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="font-medium text-red-800">
                    Extended low mood period: {stabilityMetrics.consecutiveLowDays} consecutive days
                  </span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Consider reaching out to your healthcare provider
                </p>
              </div>
            )}
            
            {stabilityMetrics.volatilityScore > 2.5 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                  <span className="font-medium text-orange-800">
                    High mood volatility detected
                  </span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Rapid mood changes may benefit from professional evaluation
                </p>
              </div>
            )}
            
            {correlations && correlations.medicationComplianceRate < 0.8 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Pill className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="font-medium text-yellow-800">
                    Low medication compliance: {(correlations.medicationComplianceRate * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Consistent medication adherence is important for mood stability
                </p>
              </div>
            )}
            
            {stabilityMetrics.consecutiveLowDays < 3 && stabilityMetrics.volatilityScore < 1.5 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                  <span className="font-medium text-green-800">
                    Good mood stability maintained
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Continue current wellness practices
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}