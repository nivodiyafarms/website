"""make tasks.category and subcategory nullable

These were NOT NULL from the legacy "incident" system.
New crop cycle tasks (via CycleDetailPage) don't use these enum
classifications — they have short_description + field_id instead.
Making nullable lets crop cycle tasks be created without forcing
a legacy category.

Revision ID: a1b2c3d4e5f6
Revises: f96a71662e37
Create Date: 2026-06-26

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'e8b3c1d04f27'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('tasks', 'category',
                    existing_type=sa.VARCHAR(),
                    nullable=True)
    op.alter_column('tasks', 'subcategory',
                    existing_type=sa.VARCHAR(),
                    nullable=True)


def downgrade() -> None:
    # Set any NULL values to 'sowing' before re-adding NOT NULL constraint
    op.execute("UPDATE tasks SET category = 'sowing' WHERE category IS NULL")
    op.execute("UPDATE tasks SET subcategory = 'other' WHERE subcategory IS NULL")
    op.alter_column('tasks', 'category',
                    existing_type=sa.VARCHAR(),
                    nullable=False)
    op.alter_column('tasks', 'subcategory',
                    existing_type=sa.VARCHAR(),
                    nullable=False)
