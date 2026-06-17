import os
import sys
from logging.config import fileConfig
from pathlib import Path

# Put backend/ on sys.path so `app.*` imports resolve
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Alembic config ────────────────────────────────────────────────────────────
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Import ALL models so every table registers with Base.metadata ─────────────
import app.models  # noqa: F401  (side-effect: populates Base.metadata)
from app.database import Base

target_metadata = Base.metadata


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_url() -> str:
    """DATABASE_URL must be passed as an environment variable — never hard-coded."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set.\n"
            "Run: DATABASE_URL='...' SECRET_KEY='x' alembic ..."
        )
    return url


# Tables that exist in the live DB but have no SQLAlchemy model.
# Alembic must never touch them.
_UNMANAGED_TABLES = {"master_options"}

# FK constraints owned by Supabase's auth system (auth.users.id).
# They cross into a schema we don't manage and must never be dropped by Alembic.
_SUPABASE_AUTH_FKS = {
    "general_expense_created_by_fkey",  # general_expense.created_by → auth.users.id
    "notes_author_id_fkey",             # notes.author_id → auth.users.id
}


def include_object(obj, name, type_, reflected, compare_to):
    if type_ == "table" and name in _UNMANAGED_TABLES:
        return False
    if type_ == "foreign_key_constraint" and name in _SUPABASE_AUTH_FKS:
        return False
    return True


# ── Offline mode ──────────────────────────────────────────────────────────────

def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
        compare_type=False,
        compare_server_defaults=False,
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online mode ───────────────────────────────────────────────────────────────

def run_migrations_online() -> None:
    cfg = config.get_section(config.config_ini_section, {})
    # Override the placeholder in alembic.ini with the real URL from the env var.
    cfg["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        cfg,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
            compare_type=False,
            compare_server_defaults=False,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
