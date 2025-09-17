
import os
from functools import lru_cache
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client


load_dotenv()

@lru_cache(maxsize=1)
def _env() -> dict:
    """
    Cached environment loader so we don't repeatedly read os.environ.
    Returns dict with 'url', 'anon', and 'service' keys.
    """
    url = (os.getenv("SUPABASE_URL") or "").strip()
  
    anon = (os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY") or "").strip()
    service = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()

    if not url:
        raise RuntimeError("Missing SUPABASE_URL in backend environment.")
    if not anon and not service:
        raise RuntimeError(
            "Missing SUPABASE_ANON_KEY (or SUPABASE_KEY) or SUPABASE_SERVICE_ROLE_KEY in backend environment."
        )
    return {"url": url, "anon": anon, "service": service}


def get_user_client(user_jwt: Optional[str]) -> Client:
    """
    Create a fresh Supabase client for a specific request and attach the user's JWT
    so PostgREST sees auth.uid() and your RLS policies pass.

    Use this in request handlers when you want inserts/updates to obey RLS
    under the authenticated user.
    """
    env = _env()
   
    key = env["anon"] or env["service"]
    client: Client = create_client(env["url"], key)

    if user_jwt:
       
        client.postgrest.auth(user_jwt)

    return client


@lru_cache(maxsize=1)
def get_service_client() -> Client:
    """
    Cached service-role client for privileged operations (bypasses RLS).
    NEVER expose this key to the browser.
    """
    env = _env()
    if not env["service"]:
        raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY for service client.")
    return create_client(env["url"], env["service"])


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """
    Legacy/base client (anon or service). No per-request JWT attached.
    Only safe for public reads or admin tasks w/ service key (not user-scoped).
    """
    env = _env()
    key = env["anon"] or env["service"]
    return create_client(env["url"], key)



class _SupabaseProxy:
    def __getattr__(self, name):
        return getattr(get_supabase(), name)


supabase = _SupabaseProxy()
