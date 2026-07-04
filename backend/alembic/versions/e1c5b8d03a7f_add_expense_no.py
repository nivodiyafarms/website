"""add expense_no to general_expense (GE0001 human-readable IDs)

Additive nullable column; backfill existing rows.

Revision ID: e1c5b8d03a7f
Revises: d9a2f3b1c8e4
Create Date: 2026-07-04

"""
from typing import Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e1c5b8d03a7f'
down_revision: Union[str, None] = 'd9a2f3b1c8e4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('general_expense',
                  sa.Column('expense_no', sa.String(20), nullable=True))

    # Unique index so GE#### never collides
    op.create_index('ix_general_expense_expense_no', 'general_expense', ['expense_no'], unique=True)

    # Backfill existing rows — assign GE0001, GE0002, … ordered by created_at
    conn = op.get_bind()
    conn.execute(sa.text("""
        WITH ranked AS (
            SELECT general_expense_id,
                   ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, general_expense_id) AS rn
            FROM   general_expense
            WHERE  expense_no IS NULL
        )
        UPDATE general_expense ge
        SET    expense_no = 'GE' || LPAD(ranked.rn::text, 4, '0')
        FROM   ranked
        WHERE  ge.general_expense_id = ranked.general_expense_id
    """))


def downgrade() -> None:
    op.drop_index('ix_general_expense_expense_no', table_name='general_expense')
    op.drop_column('general_expense', 'expense_no')
