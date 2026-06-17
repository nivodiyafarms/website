"""phase2_variety_model

Revision ID: b5bfd10f7185
Revises: fd17cc9b8dad
Create Date: 2026-06-17 16:08:05.782793

Changes (all additive — no existing columns/tables dropped):
  - NEW TABLE  crop_cycle_fields  (crop_cycle_id PK/FK, field_id PK/FK, allocated_acres)
  - NEW COLUMN tasks.field_id     (nullable String FK → fields.field_id)
  - ALTER      tasks.crop_cycle_id NOT NULL → nullable  (enables field-prep tasks)
  - DATA       populate crop_cycle_fields from crop_cycles.field_code (skip unmatched)
  - DATA       backfill tasks.field_id from parent crop_cycle's field_code

crop_cycles.field_code is intentionally kept as a safety net; dropped in a later migration.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = 'b5bfd10f7185'
down_revision: Union[str, None] = 'fd17cc9b8dad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. New junction table ─────────────────────────────────────────────────
    op.create_table(
        'crop_cycle_fields',
        sa.Column('crop_cycle_id', sa.UUID(), nullable=False),
        sa.Column('field_id', sa.String(), nullable=False),
        sa.Column('allocated_acres', sa.Numeric(), nullable=True),
        sa.ForeignKeyConstraint(
            ['crop_cycle_id'], ['crop_cycles.crop_cycle_id'],
            name='crop_cycle_fields_crop_cycle_id_fkey',
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['field_id'], ['fields.field_id'],
            name='crop_cycle_fields_field_id_fkey',
            ondelete='RESTRICT',
        ),
        sa.PrimaryKeyConstraint('crop_cycle_id', 'field_id'),
    )

    # ── 2. Add field tag column to tasks ──────────────────────────────────────
    op.add_column('tasks', sa.Column('field_id', sa.String(), nullable=True))
    op.create_foreign_key(
        'tasks_field_id_fkey', 'tasks', 'fields', ['field_id'], ['field_id'],
    )

    # ── 3. Relax tasks.crop_cycle_id to nullable ──────────────────────────────
    # Allows field-prep tasks (ploughing, leveling, soil rebuild) with no crop cycle.
    op.alter_column(
        'tasks', 'crop_cycle_id',
        existing_type=sa.UUID(),
        existing_nullable=False,
        nullable=True,
    )

    # ── 4. Data migration ─────────────────────────────────────────────────────
    conn = op.get_bind()

    # 4a. Warn about crop_cycles whose field_code has no matching fields row.
    #     These are skipped (not failed) so the migration never blocks on bad data.
    unmatched = conn.execute(sa.text("""
        SELECT incident_no, field_code
        FROM   crop_cycles
        WHERE  field_code IS NOT NULL
          AND  field_code NOT IN (SELECT field_id FROM fields)
        ORDER  BY incident_no
    """)).fetchall()
    if unmatched:
        import sys
        print(
            f"\n  WARNING: {len(unmatched)} crop_cycle(s) have a field_code that does"
            " not match any fields.field_id — skipped (crop_cycle_fields NOT populated"
            " for these):",
            file=sys.stderr,
        )
        for row in unmatched:
            print(f"    incident_no={row.incident_no}  field_code='{row.field_code}'",
                  file=sys.stderr)

    # 4b. Populate crop_cycle_fields from crop_cycles.field_code.
    #     One row per crop_cycle that has a valid field_code.
    result = conn.execute(sa.text("""
        INSERT INTO crop_cycle_fields (crop_cycle_id, field_id)
        SELECT cc.crop_cycle_id, f.field_id
        FROM   crop_cycles cc
        JOIN   fields f ON f.field_id = cc.field_code
        WHERE  cc.field_code IS NOT NULL
        ON CONFLICT (crop_cycle_id, field_id) DO NOTHING
    """))
    print(f"\n  crop_cycle_fields: {result.rowcount} row(s) inserted")

    # 4c. Backfill tasks.field_id from the task's parent crop_cycle.
    #     Only sets field_id when the crop_cycle's field_code maps to a real field.
    result = conn.execute(sa.text("""
        UPDATE tasks t
        SET    field_id = cc.field_code
        FROM   crop_cycles cc
        JOIN   fields f ON f.field_id = cc.field_code
        WHERE  t.crop_cycle_id = cc.crop_cycle_id
          AND  t.field_id IS NULL
    """))
    print(f"  tasks.field_id:    {result.rowcount} row(s) backfilled\n")


def downgrade() -> None:
    conn = op.get_bind()

    # Safety guard: cannot restore NOT NULL on crop_cycle_id if any task has NULL.
    # Field-prep tasks created after the upgrade would block this downgrade.
    null_count = conn.execute(
        sa.text("SELECT COUNT(*) FROM tasks WHERE crop_cycle_id IS NULL")
    ).scalar()
    if null_count:
        raise RuntimeError(
            f"Cannot downgrade: {null_count} task(s) have crop_cycle_id = NULL "
            "(field-prep tasks created after Phase 2 upgrade). "
            "Delete or reassign them before downgrading."
        )

    # ── Reverse DDL in dependency-safe order ──────────────────────────────────

    # 1. Drop FK and column on tasks.field_id
    op.drop_constraint('tasks_field_id_fkey', 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'field_id')

    # 2. Restore crop_cycle_id to NOT NULL
    op.alter_column(
        'tasks', 'crop_cycle_id',
        existing_type=sa.UUID(),
        existing_nullable=True,
        nullable=False,
    )

    # 3. Drop the junction table (CASCADE removes its FK constraints too)
    op.drop_table('crop_cycle_fields')
