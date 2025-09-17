"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function AuthRedirectWatcher() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        
        if (event === "SIGNED_IN" && session) {
          if (pathname !== "/welcome") router.replace("/welcome");
        }

        
        if (event === "SIGNED_OUT") {
          if (pathname !== "/home") router.replace("/home");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  return null;
}
