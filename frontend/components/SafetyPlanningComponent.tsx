import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Save, Phone, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface SafetyPlan {
  id?: string;
  user_id: string;
  warning_signs: string[];
  coping_strategies: string[];
  support_contacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  safe_environment_steps: string[];
  reasons_to_live: string[];
  professional_contacts: Array<{
    name: string;
    phone: string;
    type: string; 
  }>;
  created_at?: string;
  updated_at?: string;
}

const SafetyPlanningComponent: React.FC = () => {
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

      setSafetyPlan(prev => ({ ...prev, user_id: userId }));

      const { data, error } = await supabase
        .from('safety_plans')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setSafetyPlan(data);
      }
    } catch (error) {
      console.error('Error loading safety plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSafetyPlan = async () => {
    setSaving(true);
    try {
      const planData = {
        ...safetyPlan,
        updated_at: new Date().toISOString()
      };

      const { error } = safetyPlan.id
        ? await supabase
            .from('safety_plans')
            .update(planData)
            .eq('id', safetyPlan.id)
        : await supabase
            .from('safety_plans')
            .insert([{ ...planData, created_at: new Date().toISOString() }]);

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
    setSafetyPlan(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), defaultValue]
    }));
  };

  const updateListItem = (field: keyof SafetyPlan, index: number, value: any) => {
    setSafetyPlan(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map((item, i) => i === index ? value : item)
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 rounded-full p-3">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Safety Plan</h2>
            <p className="text-gray-600 text-sm">Create a plan to help during difficult times</p>
          </div>
        </div>
        
        <button
          onClick={saveSafetyPlan}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Plan'}</span>
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* Warning Signs */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Warning Signs</h3>
          <p className="text-gray-600 text-sm mb-4">
            Recognize the thoughts, feelings, or behaviors that indicate you might be entering a crisis
          </p>
          {safetyPlan.warning_signs.map((sign, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={sign}
                onChange={(e) => updateListItem('warning_signs', index, e.target.value)}
                placeholder="e.g., feeling hopeless, sleeping too much, isolating from friends"
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => removeListItem('warning_signs', index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => addListItem('warning_signs', '')}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add warning sign</span>
          </button>
        </section>

        {/* Coping Strategies */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Coping Strategies</h3>
          <p className="text-gray-600 text-sm mb-4">
            Activities you can do on your own to feel better or distract yourself
          </p>
          {safetyPlan.coping_strategies.map((strategy, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={strategy}
                onChange={(e) => updateListItem('coping_strategies', index, e.target.value)}
                placeholder="e.g., listen to music, take a warm bath, go for a walk, call someone"
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => removeListItem('coping_strategies', index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => addListItem('coping_strategies', '')}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add coping strategy</span>
          </button>
        </section>

        {/* Support Contacts */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Support People</h3>
          <p className="text-gray-600 text-sm mb-4">
            People you can reach out to for support (friends, family, trusted individuals)
          </p>
          {safetyPlan.support_contacts.map((contact, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 p-3 bg-gray-50 rounded">
              <input
                type="text"
                value={contact.name}
                onChange={(e) => updateListItem('support_contacts', index, { ...contact, name: e.target.value })}
                placeholder="Name"
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => updateListItem('support_contacts', index, { ...contact, phone: e.target.value })}
                placeholder="Phone number"
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={contact.relationship}
                  onChange={(e) => updateListItem('support_contacts', index, { ...contact, relationship: e.target.value })}
                  placeholder="Relationship"
                  className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => removeListItem('support_contacts', index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => addListItem('support_contacts', { name: '', phone: '', relationship: '' })}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add support person</span>
          </button>
        </section>

        {/* Professional Contacts */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Professional Contacts</h3>
          <p className="text-gray-600 text-sm mb-4">
            Mental health professionals and crisis resources
          </p>
          {safetyPlan.professional_contacts.map((contact, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 p-3 bg-blue-50 rounded">
              <input
                type="text"
                value={contact.name}
                onChange={(e) => updateListItem('professional_contacts', index, { ...contact, name: e.target.value })}
                placeholder="Name/Organization"
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => updateListItem('professional_contacts', index, { ...contact, phone: e.target.value })}
                placeholder="Phone number"
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <select
                  value={contact.type}
                  onChange={(e) => updateListItem('professional_contacts', index, { ...contact, type: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="therapist">Therapist</option>
                  <option value="psychiatrist">Psychiatrist</option>
                  <option value="doctor">Doctor</option>
                  <option value="crisis_center">Crisis Center</option>
                  <option value="hospital">Hospital</option>
                </select>
                <button
                  onClick={() => removeListItem('professional_contacts', index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => addListItem('professional_contacts', { name: '', phone: '', type: 'therapist' })}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add professional contact</span>
          </button>
        </section>

        {/* Reasons to Live */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Heart className="w-5 h-5 text-red-500 mr-2" />
            5. Reasons to Live
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            What makes life worth living? What are you grateful for?
          </p>
          {safetyPlan.reasons_to_live.map((reason, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={reason}
                onChange={(e) => updateListItem('reasons_to_live', index, e.target.value)}
                placeholder="e.g., my children, my pet, future goals, people who care about me"
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => removeListItem('reasons_to_live', index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => addListItem('reasons_to_live', '')}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add reason to live</span>
          </button>
        </section>

        {/* Safe Environment Steps */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Making Environment Safe</h3>
          <p className="text-gray-600 text-sm mb-4">
            Steps to remove or limit access to lethal means during a crisis
          </p>
          {safetyPlan.safe_environment_steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={step}
                onChange={(e) => updateListItem('safe_environment_steps', index, e.target.value)}
                placeholder="e.g., remove weapons, give medications to trusted person, stay with family"
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => removeListItem('safe_environment_steps', index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => addListItem('safe_environment_steps', '')}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add safety step</span>
          </button>
        </section>
      </div>

      {/* Emergency Numbers */}
      <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h4 className="font-semibold text-red-900 mb-3 flex items-center">
          <Phone className="w-4 h-4 mr-2" />
          Emergency Crisis Resources
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-red-800">National Suicide Prevention Lifeline</div>
            <div className="text-red-700">
              <a href="tel:988" className="hover:underline font-mono">988</a>
              <div className="text-xs">24/7 free and confidential support</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-red-800">Crisis Text Line</div>
            <div className="text-red-700">
              <span className="font-mono">Text HOME to 741741</span>
              <div className="text-xs">24/7 crisis support via text</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-red-800">Emergency Services</div>
            <div className="text-red-700">
              <a href="tel:911" className="hover:underline font-mono">911</a>
              <div className="text-xs">For immediate life-threatening emergencies</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-red-800">International Crisis Lines</div>
            <div className="text-red-700">
              <a 
                href="https://www.iasp.info/resources/Crisis_Centres/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline text-xs"
              >
                Find local crisis centers worldwide
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Important Disclaimer */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-sm text-yellow-800">
          <strong>Important:</strong> This safety plan is a personal tool to help during difficult times. 
          It should be used alongside professional mental health care, not as a replacement. If you're 
          having thoughts of self-harm or suicide, please reach out for help immediately using the 
          crisis resources above.
        </div>
      </div>

      {/* Save button at bottom */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={saveSafetyPlan}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 font-medium"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving Safety Plan...' : 'Save Safety Plan'}</span>
        </button>
      </div>
    </div>
  );
};

export default SafetyPlanningComponent;