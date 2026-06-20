"""add_pending_review_enum

Revision ID: f96a71662e37
Revises: b5bfd10f7185
Create Date: 2026-06-17 18:52:29.250595

ALTER TYPE ... ADD VALUE cannot run inside a transaction block in PostgreSQL.
Isolated here so it runs via autocommit_block() without bundling table DDL.

Downgrade: PostgreSQL has no DROP VALUE. 'pending_review' stays in the type
definition but will be unused. See downgrade() for the manual removal procedure
if ever needed.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f96a71662e37'
down_revision: Union[str, None] = 'b5bfd10f7185'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # EXIT the implicit transaction before ALTER TYPE ADD VALUE (PG requirement).
    with op.get_context().autocommit_block():
        op.execute(sa.text(
            "ALTER TYPE work_order_status_enum "
            "ADD VALUE IF NOT EXISTS 'pending_review' AFTER 'completed'"
        ))


def downgrade() -> None:
    # PostgreSQL has no DROP VALUE on an enum type. 'pending_review' remains in the
    # type definition but is unused by the application — this is harmless.
    #
    # Hard removal procedure (run manually; never automate on a live column):
    #   1. Confirm no rows use it:
    #      SELECT COUNT(*) FROM work_orders WHERE status = 'pending_review';
    #   2. CREATE TYPE work_order_status_enum_new AS ENUM
    #         ('open','in_progress','on_hold','completed','partial','closed','cancelled');
    #   3. ALTER TABLE work_orders
    #         ALTER COLUMN status TYPE work_order_status_enum_new
    #         USING status::text::work_order_status_enum_new;
    #   4. DROP TYPE work_order_status_enum;
    #   5. ALTER TYPE work_order_status_enum_new RENAME TO work_order_status_enum;
    pass
