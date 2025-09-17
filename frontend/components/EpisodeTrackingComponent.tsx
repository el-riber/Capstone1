'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Plus, Edit2, Trash2, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

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
];

const commonSymptoms = {
  depressive: [
    'Persistent sadness', 'Loss of interest', 'Fatigue', 'Sleep problems',
    'Appetite changes', 'Concentration difficulties', 'Guilt/worthlessness',
    'Hopelessness', 'Suicidal thoughts'
  ],
  manic: [
    'Elevated mood', 'Increased energy', 'Decreased sleep need', 'Racing thoughts',
    'Grandiosity', 'Poor judgment', 'Increased activity', 'Distractibility',
    'Rapid speech', 'Risky behavior'
  ],
  hypomanic: [
    'Elevated mood', 'Increased energy', 'Decreased sleep need', 'More talkative',
    'Increased confidence', 'More social', 'Increased productivity'
  ],
  mixed: [
    'Mood swings', 'Agitation', 'Anxiety', 'Fatigue with restlessness',
    'Racing thoughts with sadness', 'Irritability'
  ]
};

export default function EpisodeTrackingComponent() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<Partial<Episode>>({
    type: 'depressive',
    severity: 'mild',
    start_date: '',
    end_date: '',
    symptoms: [],
    triggers: [],
    notes: '',
    hospitalization: false,
    medication_changes: ''
  });

  useEffect(() => {
    loadEpisodes();
  }, []);

  const loadEpisodes = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (data && !error) {
        setEpisodes(data);
      }
    } catch (error) {
      console.error('Error loading episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEpisode = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) return;

      const episodeData = {
        ...formData,
        user_id: userId,
        end_date: formData.end_date || null
      };

      let error;
      if (editingEpisode?.id) {
        ({ error } = await supabase
          .from('episodes')
          .update(episodeData)
          .eq('id', editingEpisode.id));
      } else {
        ({ error } = await supabase
          .from('episodes')
          .insert([episodeData]));
      }

      if (!error) {
        await loadEpisodes();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving episode:', error);
    }
  };

  const deleteEpisode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    
    try {
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', id);

      if (!error) {
        await loadEpisodes();
      }
    } catch (error) {
      console.error('Error deleting episode:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'depressive',
      severity: 'mild',
      start_date: '',
      end_date: '',
      symptoms: [],
      triggers: [],
      notes: '',
      hospitalization: false,
      medication_changes: ''
    });
    setEditingEpisode(null);
    setShowForm(false);
  };

  const startEdit = (episode: Episode) => {
    setFormData(episode);
    setEditingEpisode(episode);
    setShowForm(true);
  };

  const toggleSymptom = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms?.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...(prev.symptoms || []), symptom]
    }));
  };

  const getEpisodeColor = (type: string) => {
    const episodeType = episodeTypes.find(t => t.value === type);
    return episodeType?.color || 'gray';
  };

  const getEpisodeDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-purple-600" />
          Episode Tracking
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Episode</span>
        </button>
      </div>

      {/* Episode Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingEpisode ? 'Edit Episode' : 'Add New Episode'}
            </h3>

            <div className="space-y-4">
              {/* Episode Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Episode Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {episodeTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                      className={`p-3 rounded-lg border flex items-center space-x-2 ${
                        formData.type === type.value
                          ? `bg-${type.color}-100 border-${type.color}-500`
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {commonSymptoms[formData.type as keyof typeof commonSymptoms]?.map(symptom => (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      className={`p-2 text-sm rounded border ${
                        formData.symptoms?.includes(symptom)
                          ? 'bg-purple-100 border-purple-500'
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Additional details about this episode..."
                />
              </div>

              {/* Hospitalization */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hospitalization"
                  checked={formData.hospitalization}
                  onChange={(e) => setFormData(prev => ({ ...prev, hospitalization: e.target.checked }))}
                  className="w-4 h-4 text-purple-600"
                />
                <label htmlFor="hospitalization" className="text-sm font-medium text-gray-700">
                  Required hospitalization
                </label>
              </div>

              {/* Medication Changes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medication Changes
                </label>
                <input
                  type="text"
                  value={formData.medication_changes}
                  onChange={(e) => setFormData(prev => ({ ...prev, medication_changes: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Any medication adjustments during this episode"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={saveEpisode}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg"
              >
                {editingEpisode ? 'Update Episode' : 'Save Episode'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Episodes List */}
      <div className="space-y-4">
        {episodes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No episodes recorded yet</p>
            <p className="text-sm">Start tracking episodes to identify patterns</p>
          </div>
        ) : (
          episodes.map(episode => {
            const color = getEpisodeColor(episode.type);
            const duration = getEpisodeDuration(episode.start_date, episode.end_date);
            const episodeTypeInfo = episodeTypes.find(t => t.value === episode.type);
            
            return (
              <div key={episode.id} className={`border border-${color}-200 bg-${color}-50 rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {episodeTypeInfo && <episodeTypeInfo.icon className={`w-5 h-5 text-${color}-600`} />}
                    <div>
                      <h4 className={`font-medium text-${color}-900 capitalize`}>
                        {episode.type} Episode ({episode.severity})
                      </h4>
                      <p className={`text-sm text-${color}-700`}>
                        {new Date(episode.start_date).toLocaleDateString()} - 
                        {episode.end_date ? new Date(episode.end_date).toLocaleDateString() : 'Ongoing'}
                        <span className="ml-2">({duration} days)</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(episode)}
                      className={`p-1 text-${color}-600 hover:text-${color}-800`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteEpisode(episode.id!)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {episode.symptoms && episode.symptoms.length > 0 && (
                  <div className="mt-3">
                    <p className={`text-sm font-medium text-${color}-800 mb-1`}>Symptoms:</p>
                    <div className="flex flex-wrap gap-1">
                      {episode.symptoms.slice(0, 5).map(symptom => (
                        <span key={symptom} className={`px-2 py-1 bg-${color}-100 text-${color}-800 text-xs rounded`}>
                          {symptom}
                        </span>
                      ))}
                      {episode.symptoms.length > 5 && (
                        <span className={`px-2 py-1 bg-${color}-100 text-${color}-800 text-xs rounded`}>
                          +{episode.symptoms.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {episode.notes && (
                  <p className={`text-sm text-${color}-700 mt-2`}>{episode.notes}</p>
                )}
                
                {episode.hospitalization && (
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
  );
}