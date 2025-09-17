'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Save, Phone, Heart, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

interface SafetyPlan {
  id?: string;
  user_id: string;
  warning_signs: string[];
  coping_strategies: string[];
  support_contacts: Array<{ name: string; phone: string; relationship: string }>;
  safe_environment_steps: string[];
  reasons_to_live: string[];
  professional_contacts: Array<{ name: string; phone: string; type: string }>;
  created_at?: string;
  updated_at?: string;
}

export default function SafetyPlanPage() {
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan>({
    user_id: '',
    warning_signs: [''],
    coping_strategies: [''],
    support_contacts: [{ name: '', phone: '', relationship: '' }],
    safe_environment_steps: [''],
    reasons_to_live: [''],
    professional_contacts: [{ name: '', phone: '', type: 'therapist' }]
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadSafetyPlan();
    
  }, []);

  const loadSafetyPlan = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        setLoading(false);
        return;
      }

      setUser(userData.user);
      setSafetyPlan(prev => ({ ...prev, user_id: userId }));

      const { data, error } = await supabase
        .from('safety_plans')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) setSafetyPlan(data);
    } catch (error) {
      console.error('Error loading safety plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSafetyPlan = async () => {
    setSaving(true);
    try {
      const planData = { ...safetyPlan, updated_at: new Date().toISOString() };

      const { error } = safetyPlan.id
        ? await supabase.from('safety_plans').update(planData).eq('id', safetyPlan.id)
        : await supabase.from('safety_plans').insert([{ ...planData, created_at: new Date().toISOString() }]);

      if (error) throw error;

      setMessage('Safety plan saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving safety plan:', error);
      setMessage('Error saving safety plan');
    } finally {
      setSaving(false);
    }
  };

  const addListItem = (field: keyof SafetyPlan, defaultValue: any) => {
    setSafetyPlan(prev => ({ ...prev, [field]: [...(prev[field] as any[]), defaultValue] }));
  };

  const updateListItem = (field: keyof SafetyPlan, index: number, value: any) => {
    setSafetyPlan(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map((item, i) => (i === index ? value : item))
    }));
  };

  const removeListItem = (field: keyof SafetyPlan, index: number) => {
    setSafetyPlan(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <main className="min-h-[calc(100vh-160px)] bg-gray-50 pt-24">
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      
      <main className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-blue-50 to-indigo-100 pt-24">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 rounded-full p-3">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Personal Safety Plan</h1>
                  <p className="text-gray-600">Create a plan to help during difficult times</p>
                </div>
              </div>

              <button
                onClick={saveSafetyPlan}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 font-medium transition-colors duration-200"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save Plan'}</span>
              </button>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.includes('Error')
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-green-50 border border-green-200 text-green-800'
                }`}
              >
                {message}
              </div>
            )}
          </div>

        
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Important Information</h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  This safety plan is a personal tool to help you stay safe during crisis situations. It should be used
                  alongside professional mental health care. If you're having thoughts of self-harm or suicide, please
                  reach out for immediate help using the crisis resources below.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Section 1: Warning Signs */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  1
                </span>
                Warning Signs
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Recognize the thoughts, feelings, or behaviors that indicate you might be entering a crisis
              </p>
              {safetyPlan.warning_signs.map((sign, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={sign}
                    onChange={(e) => updateListItem('warning_signs', index, e.target.value)}
                    placeholder="e.g., feeling hopeless, sleeping too much, isolating from friends"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {safetyPlan.warning_signs.length > 1 && (
                    <button onClick={() => removeListItem('warning_signs', index)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addListItem('warning_signs', '')}
                className="text-red-600 hover:text-red-700 flex items-center space-x-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add warning sign</span>
              </button>
            </section>

            {/* Section 2: Coping Strategies */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  2
                </span>
                Coping Strategies
              </h2>
              <p className="text-gray-600 text-sm mb-4">Activities you can do on your own to feel better or distract yourself</p>
              {safetyPlan.coping_strategies.map((strategy, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={strategy}
                    onChange={(e) => updateListItem('coping_strategies', index, e.target.value)}
                    placeholder="e.g., listen to music, take a warm bath, go for a walk, call someone"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {safetyPlan.coping_strategies.length > 1 && (
                    <button onClick={() => removeListItem('coping_strategies', index)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addListItem('coping_strategies', '')}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add coping strategy</span>
              </button>
            </section>

            {/* Section 3: Support Contacts */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  3
                </span>
                Support People
              </h2>
              <p className="text-gray-600 text-sm mb-4">People you can reach out to for support (friends, family, trusted individuals)</p>
              {safetyPlan.support_contacts.map((contact, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateListItem('support_contacts', index, { ...contact, name: e.target.value })}
                    placeholder="Name"
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateListItem('support_contacts', index, { ...contact, phone: e.target.value })}
                    placeholder="Phone number"
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={contact.relationship}
                      onChange={(e) => updateListItem('support_contacts', index, { ...contact, relationship: e.target.value })}
                      placeholder="Relationship"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {safetyPlan.support_contacts.length > 1 && (
                      <button onClick={() => removeListItem('support_contacts', index)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => addListItem('support_contacts', { name: '', phone: '', relationship: '' })}
                className="text-green-600 hover:text-green-700 flex items-center space-x-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add support person</span>
              </button>
            </section>

            {/* Section 4: Professional Contacts */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  4
                </span>
                Professional Contacts
              </h2>
              <p className="text-gray-600 text-sm mb-4">Mental health professionals and crisis resources</p>
              {safetyPlan.professional_contacts.map((contact, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-4 bg-blue-50 rounded-lg">
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateListItem('professional_contacts', index, { ...contact, name: e.target.value })}
                    placeholder="Name/Organization"
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateListItem('professional_contacts', index, { ...contact, phone: e.target.value })}
                    placeholder="Phone number"
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="flex items-center space-x-2">
                    <select
                      value={contact.type}
                      onChange={(e) => updateListItem('professional_contacts', index, { ...contact, type: e.target.value })}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="therapist">Therapist</option>
                      <option value="psychiatrist">Psychiatrist</option>
                      <option value="doctor">Doctor</option>
                      <option value="crisis_center">Crisis Center</option>
                      <option value="hospital">Hospital</option>
                    </select>
                    {safetyPlan.professional_contacts.length > 1 && (
                      <button onClick={() => removeListItem('professional_contacts', index)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => addListItem('professional_contacts', { name: '', phone: '', type: 'therapist' })}
                className="text-purple-600 hover:text-purple-700 flex items-center space-x-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add professional contact</span>
              </button>
            </section>

            {/* Section 5: Reasons to Live */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-pink-100 text-pink-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  5
                </span>
                <Heart className="w-6 h-6 text-red-500 mr-2" />
                Reasons to Live
              </h2>
              <p className="text-gray-600 text-sm mb-4">What makes life worth living? What are you grateful for?</p>
              {safetyPlan.reasons_to_live.map((reason, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => updateListItem('reasons_to_live', index, e.target.value)}
                    placeholder="e.g., my children, my pet, future goals, people who care about me"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  {safetyPlan.reasons_to_live.length > 1 && (
                    <button onClick={() => removeListItem('reasons_to_live', index)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addListItem('reasons_to_live', '')}
                className="text-pink-600 hover:text-pink-700 flex items-center space-x-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add reason to live</span>
              </button>
            </section>

            {/* Section 6: Safe Environment Steps */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-orange-100 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                  6
                </span>
                Making Environment Safe
              </h2>
              <p className="text-gray-600 text-sm mb-4">Steps to remove or limit access to lethal means during a crisis</p>
              {safetyPlan.safe_environment_steps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => updateListItem('safe_environment_steps', index, e.target.value)}
                    placeholder="e.g., remove weapons, give medications to trusted person, stay with family"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {safetyPlan.safe_environment_steps.length > 1 && (
                    <button onClick={() => removeListItem('safe_environment_steps', index)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addListItem('safe_environment_steps', '')}
                className="text-orange-600 hover:text-orange-700 flex items-center space-x-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add safety step</span>
              </button>
            </section>
          </div>

          {/* Emergency Resources */}
          <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="font-semibold text-red-900 mb-4 flex items-center text-lg">
              <Phone className="w-5 h-5 mr-2" />
              Emergency Crisis Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="bg-white p-4 rounded-lg">
                <div className="font-semibold text-red-800 mb-1">National Suicide Prevention Lifeline</div>
                <div className="text-red-700 mb-1">
                  <a href="tel:988" className="hover:underline font-mono text-lg">
                    988
                  </a>
                </div>
                <div className="text-red-600 text-xs">24/7 free and confidential support</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="font-semibold text-red-800 mb-1">Crisis Text Line</div>
                <div className="text-red-700 mb-1">
                  <span className="font-mono">Text HOME to 741741</span>
                </div>
                <div className="text-red-600 text-xs">24/7 crisis support via text</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="font-semibold text-red-800 mb-1">Emergency Services</div>
                <div className="text-red-700 mb-1">
                  <a href="tel:911" className="hover:underline font-mono text-lg">
                    911
                  </a>
                </div>
                <div className="text-red-600 text-xs">For immediate life-threatening emergencies</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="font-semibold text-red-800 mb-1">International Crisis Lines</div>
                <div className="text-red-700 mb-1">
                  <a
                    href="https://www.iasp.info/resources/Crisis_Centres/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-sm flex items-center"
                  >
                    Find local crisis centers <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
                <div className="text-red-600 text-xs">Worldwide crisis support resources</div>
              </div>
            </div>
          </div>

          {/* Final Save Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={saveSafetyPlan}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl flex items-center space-x-3 font-semibold text-lg shadow-lg transition-colors duration-200"
            >
              <Save className="w-6 h-6" />
              <span>{saving ? 'Saving Safety Plan...' : 'Save Safety Plan'}</span>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
