"""add_prep_season_tag

Revision ID: e8b3c1d04f27
Revises: d3f7a2e91c05
Create Date: 2026-06-20

Add two nullable columns to tasks for season-tagging field-prep work orders.

Background
──────────────────────────────────────────────────────────────────────────────
Field-prep tasks (crop_cycle_id IS NULL, field_id set) need to be assigned to
a season at creation time so prep costs can be grouped and reported by season.
The user picks "Kharif 2026" etc. in the prep WO form. This is the PRIMARY
mechanism for prep→season assignment.

The existing prep_cost_allocation table remains for the ADVANCED case: splitting
one prep WO's cost across multiple specific crop cycles. That is not the primary
path — most prep costs will be season-tagged here, not individually allocated.

Consistency invariant (enforced by the create endpoint when built, not by DB):
  A task should have EITHER:
    crop_cycle_id set   → crop task (cost attributed to that cycle's P&L)
  OR:
    prep_season + prep_crop_year set → prep task tagged to a season
  Not both. null prep_season/prep_crop_year = untagged prep (valid interim state).

crop_year convention (LOCKED — see d3f7a2e91c05 docstring):
  UI label: "{season} {prep_crop_year}" e.g. "Kharif 2025", "Zaid 2026".
  prep_crop_year = calendar year of sowing, NOT the harvest year.

Changes
──────────────────────────────────────────────────────────────────────────────
  1. tasks.prep_season    STRING(20) nullable  — 'kharif'/'rabi'/'zaid'
  2. tasks.prep_crop_year INTEGER    nullable  — calendar year of sowing

No backfill — existing prep tasks stay null until tagged via the UI.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e8b3c1d04f27'
down_revision: Union[str, None] = 'd3f7a2e91c05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('prep_season', sa.String(20), nullable=True))
    op.add_column('tasks', sa.Column('prep_crop_year', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'prep_crop_year')
    op.drop_column('tasks', 'prep_season')
