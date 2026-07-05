"""add payment_mode to general_expense

Revision ID: a7f3e2d1c904
Revises: e1c5b8d03a7f
Create Date: 2026-07-05

Additive nullable columns — safe against existing rows.
"""
from typing import Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a7f3e2d1c904'
down_revision: Union[str, None] = 'e1c5b8d03a7f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('general_expense',
                  sa.Column('payment_mode', sa.String(50), nullable=True))
    op.add_column('general_expense',
                  sa.Column('payment_mode_custom', sa.String(200), nullable=True))


def downgrade() -> None:
    op.drop_column('general_expense', 'payment_mode_custom')
    op.drop_column('general_expense', 'payment_mode')
