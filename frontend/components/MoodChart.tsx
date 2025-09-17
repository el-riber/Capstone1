"use client";

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { supabase } from '@/lib/supabaseClient';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MoodEntry {
  mood: number;
  created_at: string;
}

export default function MoodChart() {
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoodData();
  }, []);

  const fetchMoodData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;

    if (!user_id) {
      setLoading(false);
      return;
    }

    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('mood_entries')
      .select('mood, created_at')
      .eq('user_id', user_id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (data && !error) {
      setMoodData(data);
    }
    setLoading(false);
  };

  const formatChartData = () => {
    
    const labels = [];
    const chartData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateString = date.toISOString().split('T')[0];
      
      
      const dayEntry = moodData.find(entry => 
        entry.created_at.startsWith(dateString)
      );
      
      labels.push(dayLabel);
      chartData.push(dayEntry ? dayEntry.mood : null);
    }
    
    return { labels, data: chartData };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Your Mood Trend</h3>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const { labels, data } = formatChartData();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Mood Level',
        data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        spanGaps: true, 
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Your Mood Trend',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: '#1e40af',
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const moodLabels = {
              1:'Very Sad',     
              2:'Sad',          
              3:'Angry',        
              4:'Stressed',     
              5:'Neutral',      
              6:'Happy',        
              7:'Excited',      
              8:'Very Happy'    
            };
            return `Mood: ${context.parsed.y} - ${moodLabels[context.parsed.y as keyof typeof moodLabels] || 'Unknown'}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 1,
        max: 8,
        ticks: {
          stepSize: 1,
          callback: function(value: any) {
            const moodLabels = {
              'Very Sad': 1,     
              'Sad': 2,            
              'Angry': 3,        
              'Stressed': 4,     
              'Neutral': 5,      
              'Happy': 6,        
              'Excited': 7,      
              'Very Happy': 8    
            };
            return moodLabels[value as keyof typeof moodLabels] || value;
          },
          color: '#6b7280',
          font: {
            size: 10,
          }
        },
        grid: {
          color: '#f3f4f6',
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'bold' as const,
          }
        },
        grid: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        borderWidth: 3,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {moodData.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Mood Trends</h3>
          <p>No mood data available. Start tracking your mood to see trends!</p>
        </div>
      ) : (
        <div className="h-80">
          <Line data={chartData} options={options} />
        </div>
      )}
      
      {moodData.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Track your mood daily to see patterns and trends over time
        </div>
      )}
    </div>
  );
}