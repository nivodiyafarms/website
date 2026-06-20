"""add_crop_year

Revision ID: d3f7a2e91c05
Revises: c1a4e8f02b19
Create Date: 2026-06-20

──────────────────────────────────────────────────────────────────────────────
CROP_YEAR CONVENTION (LOCKED — do not change without owner decision)
──────────────────────────────────────────────────────────────────────────────

  crop_year = the CALENDAR YEAR OF SOWING.

  UI label is ALWAYS "{season} {crop_year}":
    Kharif 2025   (sown mid-2025)
    Rabi 2025     (sown late 2025)
    Zaid 2026     (sown early 2026)

  crop_year alone is NOT unique across seasons.
  Cycle identity = season + crop_year + crop_name + seed_category (variety).

Backfill rule (owner-confirmed — all 98 cycles are the single 2025-26 ag year):
    kharif → 2025
    rabi   → 2025
    zaid   → 2026

This rule is permanent for this dataset. Future cycles must set crop_year at
creation time; they must never be NULL in the app layer.

──────────────────────────────────────────────────────────────────────────────
Changes
──────────────────────────────────────────────────────────────────────────────
  1. ADD COLUMN crop_cycles.crop_year INTEGER (nullable)
  2. BACKFILL the 98 existing cycles via the season → year rule above
  3. Guard: raise RuntimeError if any row remains NULL after backfill
     (covers unknown season values — would surface a data issue early)

  NOT NULL is intentionally deferred to a later migration once the
  create-cycle endpoint always supplies crop_year. Adding it now would
  break new inserts on the live app.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3f7a2e91c05'
down_revision: Union[str, None] = 'c1a4e8f02b19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Add column (nullable — backfill comes next) ─────────────────────────
    op.add_column('crop_cycles', sa.Column('crop_year', sa.Integer(), nullable=True))

    # ── 2. Backfill (owner-confirmed mapping for the 2025-26 ag year) ──────────
    conn.execute(sa.text("""
        UPDATE crop_cycles
        SET    crop_year = CASE season
                 WHEN 'kharif' THEN 2025
                 WHEN 'rabi'   THEN 2025
                 WHEN 'zaid'   THEN 2026
               END
        WHERE  crop_year IS NULL
    """))

    # ── 3. Guard: every existing row must now have a value ─────────────────────
    # Catches unknown season values that the CASE above would leave NULL.
    # NOT NULL constraint is deferred — new inserts may legitimately have NULL
    # until the create-cycle path is updated to supply crop_year.
    null_count = conn.execute(
        sa.text("SELECT COUNT(*) FROM crop_cycles WHERE crop_year IS NULL")
    ).scalar()
    if null_count:
        raise RuntimeError(
            f"STOP: {null_count} crop_cycle(s) still have NULL crop_year after backfill. "
            "Check for unknown season values: "
            "SELECT DISTINCT season FROM crop_cycles WHERE crop_year IS NULL"
        )


def downgrade() -> None:
    op.drop_column('crop_cycles', 'crop_year')
