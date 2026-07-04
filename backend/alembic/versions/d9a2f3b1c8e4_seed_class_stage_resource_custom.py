"""seed_class, seed_stage + _custom cols; resource_type_custom

Additive nullable columns only — safe against live data.

Revision ID: d9a2f3b1c8e4
Revises: c7e2f91a4b38
Create Date: 2026-07-04

"""
from typing import Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd9a2f3b1c8e4'
down_revision: Union[str, None] = 'c7e2f91a4b38'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── crop_cycles: seed class + stage (with custom free-text companions) ──
    op.add_column('crop_cycles', sa.Column('seed_class',        sa.String(50),  nullable=True))
    op.add_column('crop_cycles', sa.Column('seed_class_custom', sa.String(200), nullable=True))
    op.add_column('crop_cycles', sa.Column('seed_stage',        sa.String(50),  nullable=True))
    op.add_column('crop_cycles', sa.Column('seed_stage_custom', sa.String(200), nullable=True))

    # ── work_order_resources: free-text companion for resource_type ─────────
    op.add_column('work_order_resources',
                  sa.Column('resource_type_custom', sa.String(200), nullable=True))


def downgrade() -> None:
    op.drop_column('work_order_resources', 'resource_type_custom')
    op.drop_column('crop_cycles', 'seed_stage_custom')
    op.drop_column('crop_cycles', 'seed_stage')
    op.drop_column('crop_cycles', 'seed_class_custom')
    op.drop_column('crop_cycles', 'seed_class')
