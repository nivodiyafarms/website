"""
Single shared Supabase client for backend (Storage, etc.).
Import `supabase` from this module only after env vars are set.
"""

from supabase import create_client

from app.core.config import settings

if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment."
    )

supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)
