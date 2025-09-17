// app/layout.tsx
'use client';

import './globals.css';
import { useState } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import AuthRedirectWatcher from '@/components/AuthRedirectWatcher';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createPagesBrowserClient());

  return (
    <html lang="en">
      <body className="bg-sky-50 text-gray-900">
        <SessionContextProvider supabaseClient={supabase}>
          <AuthRedirectWatcher />
          {children}
        </SessionContextProvider>
      </body>
    </html>
  );
}
