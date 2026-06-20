"""add_reviewed_by_fk

Revision ID: c1a4e8f02b19
Revises: 9da113b00634
Create Date: 2026-06-20

general_expense.reviewed_by (uuid, nullable, already exists) gets a FK → workers(worker_id).

NOT VALID skips row validation — general_expense table has zero reviewed_by values in
production, but NOT VALID is safer regardless and matches the pattern used for
work_orders.assigned_to in 9da113b00634.

Do NOT add FK for:
  - general_expense.created_by  → references app users, not workers; stays loose uuid
  - sales.created_by             → same reason; real auth lands later
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1a4e8f02b19'
down_revision: Union[str, None] = '9da113b00634'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE general_expense "
        "ADD CONSTRAINT general_expense_reviewed_by_fkey "
        "FOREIGN KEY (reviewed_by) REFERENCES workers(worker_id) NOT VALID"
    ))


def downgrade() -> None:
    op.drop_constraint('general_expense_reviewed_by_fkey', 'general_expense',
                       type_='foreignkey')
