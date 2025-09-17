'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';


export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000); 

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-4">Welcome to SymptoCare 🎉</h1>
        <p className="text-gray-600 text-lg">We’re setting up your dashboard...</p>
      </div>
    </div>
  );
}
