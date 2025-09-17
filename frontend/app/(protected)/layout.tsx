'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Header() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      
    } finally {
      
      router.replace('/home');
      
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data?.user?.email ?? null);
    });
  }, []);

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white shadow-sm border-b">
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold text-blue-700">SymptoCare</div>
        {email && <span className="text-sm text-gray-500 hidden sm:inline">Hi, {email}</span>}
      </div>
      <button
        onClick={handleSignOut}
        className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Sign Out
      </button>
    </header>
  );
}
