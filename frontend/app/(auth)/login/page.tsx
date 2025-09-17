'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl border p-8">
        
        <div className="flex justify-center mb-6">
          <img src="/image/logo.png" alt="SymptoCare Logo" className="h-12 w-auto" />
        </div>

        
        <h1 className="text-2xl font-semibold text-center text-blue-700 mb-6">
          Welcome to SymptoCare
        </h1>

        
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={[]}
          redirectTo="/dashboard"
          localization={{
            variables: {
              sign_in: {
                email_label: 'Your email',
                password_label: 'Your password',
                button_label: 'Log In',
                link_text: 'Already have an account?',
              },
              sign_up: {
                email_label: 'Your email',
                password_label: 'Choose a password',
                button_label: 'Create Account',
                link_text: 'Need to register?',
              },
            },
          }}
        />
      </div>
    </main>
  );
}
