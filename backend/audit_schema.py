"""
Read-only live DB schema audit.
Connects to Supabase, introspects every table/column/enum/trigger,
and prints a structured report for comparison against SQLAlchemy models.
"""
import psycopg2
import psycopg2.extras

DATABASE_URL = (
    "postgresql://postgres.ijprpnnireqodvzcujdr:Nivodiya2025"
    "@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
)

conn = psycopg2.connect(DATABASE_URL)
conn.set_session(readonly=True)
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# ── 1. All user tables ──────────────────────────────────────────────────────
cur.execute("""
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
""")
tables = [r["table_name"] for r in cur.fetchall()]
print("=" * 70)
print("TABLES IN LIVE DB")
print("=" * 70)
for t in tables:
    print(" ", t)

# ── 2. Columns for every table ──────────────────────────────────────────────
print("\n" + "=" * 70)
print("COLUMNS (table · column · data_type · nullable · default)")
print("=" * 70)
cur.execute("""
    SELECT
        table_name,
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
""")
rows = cur.fetchall()
current_table = None
for r in rows:
    if r["table_name"] != current_table:
        current_table = r["table_name"]
        print(f"\n  [{current_table}]")
    typ = r["udt_name"] if r["data_type"] == "USER-DEFINED" else r["data_type"]
    if r["character_maximum_length"]:
        typ += f"({r['character_maximum_length']})"
    elif r["numeric_precision"] and r["data_type"] in ("numeric", "decimal"):
        typ += f"({r['numeric_precision']},{r['numeric_scale']})"
    nullable = "NULL" if r["is_nullable"] == "YES" else "NOT NULL"
    default = f"  default={r['column_default']}" if r["column_default"] else ""
    print(f"    {r['column_name']:<35} {typ:<30} {nullable}{default}")

# ── 3. All enums and their values ───────────────────────────────────────────
print("\n" + "=" * 70)
print("ENUM TYPES")
print("=" * 70)
cur.execute("""
    SELECT t.typname AS enum_name, e.enumlabel AS enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder;
""")
enum_rows = cur.fetchall()
current_enum = None
for r in enum_rows:
    if r["enum_name"] != current_enum:
        current_enum = r["enum_name"]
        print(f"\n  {current_enum}:")
    print(f"    {r['enum_value']}")

# ── 4. Triggers (especially on work_orders) ─────────────────────────────────
print("\n" + "=" * 70)
print("TRIGGERS")
print("=" * 70)
cur.execute("""
    SELECT trigger_name, event_object_table, event_manipulation,
           action_timing, action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
""")
triggers = cur.fetchall()
if not triggers:
    print("  (none found)")
for r in triggers:
    print(f"  [{r['event_object_table']}] {r['trigger_name']}")
    print(f"    {r['action_timing']} {r['event_manipulation']}")
    print(f"    {r['action_statement']}")

# ── 5. Foreign keys ─────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("FOREIGN KEYS")
print("=" * 70)
cur.execute("""
    SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column,
        rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON rc.unique_constraint_name = ccu.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
""")
for r in cur.fetchall():
    print(f"  {r['table_name']}.{r['column_name']} → "
          f"{r['foreign_table']}.{r['foreign_column']}  "
          f"(ON DELETE {r['delete_rule']})")

# ── 6. Unique constraints ────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("UNIQUE CONSTRAINTS")
print("=" * 70)
cur.execute("""
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
""")
for r in cur.fetchall():
    print(f"  {r['table_name']}.{r['column_name']}")

# ── 7. Row counts for key tables ─────────────────────────────────────────────
print("\n" + "=" * 70)
print("ROW COUNTS (key tables)")
print("=" * 70)
for t in tables:
    cur.execute(f"SELECT COUNT(*) AS n FROM {t};")  # table names from DB, safe
    n = cur.fetchone()["n"]
    print(f"  {t:<40} {n:>6} rows")

cur.close()
conn.close()
print("\nAudit complete.")
