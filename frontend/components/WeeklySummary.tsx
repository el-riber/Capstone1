"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchWeeklySummary, fetchMoodEntries } from '@/lib/api';
import { CrisisDetectionService } from '../lib/crisisDetection';
import { WellnessAlert } from '../components/WellnessAlert';
import {
  Brain,
  TrendingUp,
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  Download
} from 'lucide-react';

interface MoodEntry {
  mood: number;
  emoji: string;
  reflection: string;
  created_at: string; 
}


interface CrisisFlag {
  type: 'extended_low' | 'rapid_cycling' | 'concerning_text' | 'missing_entries';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  entries_affected?: any[]; 
}

export default function WeeklySummary() {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [user, setUser] = useState<any>(null);
  const [crisisFlags, setCrisisFlags] = useState<CrisisFlag[]>([]);
  const [dismissedFlags, setDismissedFlags] = useState<Set<string>>(new Set());

  useEffect(() => {
    const getUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData);
    };
    getUser();
    generateSummary();
  }, []);

  useEffect(() => {
    if (moodEntries.length > 0) {
      const flags = CrisisDetectionService.analyzeMoodPatterns(moodEntries);
      const activeFlags = flags.filter(flag => !dismissedFlags.has(flag.type));
      setCrisisFlags(activeFlags);
    }
  }, [moodEntries, dismissedFlags]);

  const generateSummary = async () => {
    setLoading(true);
    setError('');

    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;

    if (!user_id) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    try {
      const entries = await fetchMoodEntries(user_id);
      setMoodEntries(entries);

      if (entries.length === 0) {
        setSummary('No mood entries found for the past week. Start tracking your mood daily to get personalized insights!');
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }

      const summaryText = await fetchWeeklySummary(user_id);
      setSummary(summaryText);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate weekly summary');
    } finally {
      setLoading(false);
    }
  };

  const getAverageMood = (): number => {
    if (moodEntries.length === 0) return 0;
    const sum = moodEntries.reduce((acc, entry) => acc + entry.mood, 0);
    return Math.round((sum / moodEntries.length) * 10) / 10;
  };

  const getMoodTrend = (): 'up' | 'down' | 'stable' => {
    if (moodEntries.length < 2) return 'stable';
    const recent = moodEntries.slice(0, 3).reduce((acc, entry) => acc + entry.mood, 0) / 3;
    const older = moodEntries.slice(-3).reduce((acc, entry) => acc + entry.mood, 0) / 3;

    if (recent > older + 0.3) return 'up';
    if (recent < older - 0.3) return 'down';
    return 'stable';
  };

  const formatLastUpdated = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const exportToPDF = () => {
    
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Mental Wellness Summary</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { border-bottom: 3px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
          .title { color: #1E40AF; font-size: 28px; font-weight: bold; margin: 0; }
          .subtitle { color: #6B7280; font-size: 14px; margin-top: 5px; }
          .stats { display: flex; gap: 20px; margin: 30px 0; }
          .stat-box { background: #F8FAFC; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
          .stat-label { color: #6B7280; font-size: 12px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1F2937; }
          .section { margin: 30px 0; }
          .section-title { font-size: 18px; font-weight: bold; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; }
          .content { line-height: 1.6; margin: 15px 0; }
          .entry { margin: 10px 0; padding: 10px; background: #F9FAFB; border-radius: 6px; }
          .entry-date { font-size: 11px; color: #6B7280; font-weight: bold; }
          .disclaimer { background: #FEF3C7; padding: 15px; border-radius: 8px; margin-top: 30px; }
          .disclaimer-text { font-size: 11px; color: #92400E; text-align: center; font-style: italic; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 15px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Mental Wellness Summary</h1>
          <p class="subtitle">${user?.user?.email || 'Personal Report'} - Generated on ${new Date().toLocaleDateString()}</p>
          <p class="subtitle">Period: Last 7 days</p>
        </div>

        <div class="section">
          <h2 class="section-title">Wellness Overview</h2>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Average Mood</div>
              <div class="stat-value">${getAverageMood()}/8</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Entries Recorded</div>
              <div class="stat-value">${moodEntries.length}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Trend</div>
              <div class="stat-value">${getMoodTrend() === 'up' ? 'Improving' : getMoodTrend() === 'down' ? 'Declining' : 'Stable'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">AI Wellness Analysis</h2>
          <div class="content">${summary}</div>
        </div>

        <div class="section">
          <h2 class="section-title">Recent Mood Entries</h2>
          ${moodEntries.slice(0, 5).map(entry => `
            <div class="entry">
              <div class="entry-date">${new Date(entry.created_at).toLocaleDateString()} ${entry.emoji}</div>
              <div>${entry.reflection}</div>
            </div>
          `).join('')}
        </div>

        <div class="disclaimer">
          <p class="disclaimer-text">
            This report is generated for personal reflection purposes only. It is not a substitute for professional mental health advice, diagnosis, or treatment. If you're experiencing persistent mental health concerns, please consult with a qualified healthcare provider.
          </p>
        </div>

        <div class="footer">
          Generated by SymptoCare - Your Personal Wellness Companion
        </div>
      </body>
      </html>
    `;

    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      printWindow.focus();
      
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="bg-blue-500 rounded-full p-3">
            <Brain className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-blue-900">AI is analyzing your week...</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-white/60 rounded-lg p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-blue-200 rounded w-3/4"></div>
              <div className="h-4 bg-blue-200 rounded w-1/2"></div>
              <div className="h-4 bg-blue-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-2xl p-8 border border-red-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-red-500 rounded-full p-3">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-red-900">Unable to Generate Summary</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={generateSummary}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Crisis Detection Alerts */}
      <WellnessAlert 
        flags={crisisFlags}
        onDismiss={(flagType) => setDismissedFlags(prev => new Set([...prev, flagType]))}
      />
      
      {/* Existing WeeklySummary content */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-3 shadow-md">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-900">AI Weekly Insights</h3>
              <p className="text-blue-600 text-sm">Powered by AI mood analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={generateSummary}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            {summary && moodEntries.length > 0 && (
              <button
                onClick={exportToPDF}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-full p-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Mood</p>
                <p className="text-2xl font-bold text-gray-900">{getAverageMood()}/8</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Entries This Week</p>
                <p className="text-2xl font-bold text-gray-900">{moodEntries.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-full p-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Trend</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getMoodTrend() === 'up' && '📈'}
                  {getMoodTrend() === 'down' && '📉'}
                  {getMoodTrend() === 'stable' && '➡️'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h4 className="text-lg font-semibold text-gray-900">Personalized Analysis</h4>
          </div>
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
          </div>
          {lastUpdated && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-500">
                Last updated: {formatLastUpdated(lastUpdated)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-blue-600">
            💡 Keep tracking your mood daily for deeper insights and wellness advice!
          </p>
        </div>
      </div>
    </div>
  );
}