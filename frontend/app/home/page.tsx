'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden">
      
      <div className="absolute inset-0 -z-10">
        <Image
          src="/image/health-hero.jpg" 
          alt="Health background"
          fill
          priority
          className="object-cover object-center"
        />
        
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/50 to-white/70"
          aria-hidden
        />
      </div>

      
      <header className="w-full px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-md border-b border-white/60">
        <h1 className="text-xl font-bold text-blue-800">SymptoCare</h1>
        <Link href="/login">
          <Button variant="primary" className="px-4 py-2 text-sm font-medium">
            Login
          </Button>
        </Link>
      </header>

      
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-3xl w-full bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-white/60">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-blue-900 tracking-tight mb-4">
            Your AI Wellness Companion
          </h2>
          <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto">
            Track your moods, chat with an AI assistant, and get personalized insights to improve your mental well-being.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button variant="primary" className="text-lg px-6 py-3">
                Start Now
              </Button>
            </Link>
            <a
              href="#learn-more"
              className="text-blue-800 underline underline-offset-4 hover:no-underline"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      
      <section id="learn-more" className="px-6 pb-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow border border-white/60">
            <h3 className="text-lg font-semibold text-blue-900">Daily Mood Tracking</h3>
            <p className="text-gray-700 mt-2">Log how you feel in seconds and watch trends emerge over time.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow border border-white/60">
            <h3 className="text-lg font-semibold text-blue-900">AI Chat Assistant</h3>
            <p className="text-gray-700 mt-2">Reflect with a supportive assistant trained to nudge healthier habits.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow border border-white/60">
            <h3 className="text-lg font-semibold text-blue-900">Personalized Insights</h3>
            <p className="text-gray-700 mt-2">Get weekly summaries and tips tailored to your unique patterns.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
