'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md border-b">
      <h1 className="text-xl font-bold text-blue-700">SymptoCare</h1>
      <button
        onClick={handleLogout}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Sign Out
      </button>
    </header>
  );
}
