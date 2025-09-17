'use client';

import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

import EnhancedMoodEntryForm from '@/components/EnhancedMoodEntryForm';
import MoodChart from '@/components/MoodChart';
import StreakBanner from '@/components/StreakBanner';
import WeeklySummary from '@/components/WeeklySummary';

export default function DashboardPage() {
  return (
    <>
      
      <NavBar />

      
      <main className="min-h-[calc(100vh-160px)] bg-sky-100 px-4 py-10 pt-24">
        <div className="max-w-6xl mx-auto space-y-10">

          
          <header className="bg-white rounded-2xl shadow-md p-6 sm:p-8 text-slate-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  Welcome to SymptoCare
                </h1>
                <p className="text-slate-700 text-base sm:text-lg mt-2">
                  Track your emotional health, sleep, energy, and more — then see clinical-grade insights.
                </p>
              </div>
            </div>

            {/* Streak */}
            <div className="mt-6">
              <div className="bg-sky-100 rounded-xl p-4 sm:p-5 border border-sky-200 text-slate-900">
                <StreakBanner />
              </div>
            </div>
          </header>

          {/* Check-in (Enhanced form) */}
          <section id="check-in" className="bg-white rounded-2xl shadow-md p-6 text-slate-800">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Daily Wellness Check-in
            </h2>
            <p className="text-slate-700 mb-6 text-sm">
              Track mood, sleep quality, energy, social interaction, medication, and triggers.
            </p>
            <EnhancedMoodEntryForm />
          </section>

          {/* Insights: Chart + Weekly Summary */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-md p-6 text-slate-800">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                Mood Trends
              </h2>
              <MoodChart />
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 text-slate-800">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                AI Weekly Summary
              </h2>
              <WeeklySummary />
            </div>
          </section>
        </div>
      </main>

      
      <Footer />
    </>
  );
}
