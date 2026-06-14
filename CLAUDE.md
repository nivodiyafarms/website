CLAUDE.md — Nivodiya Farms ERP
This file is the canonical project spec. .cursorrules references this file. Keep them in sync: edit here, and let .cursorrules point to this as the source of truth.


What this project is
Full-stack farm ERP for Nivodiya Farms (Sagar district, MP). Stack:

Backend: FastAPI + SQLAlchemy 2.0 + psycopg2 → Supabase PostgreSQL, on Render
Frontend: React 18 / Vite, Tailwind, on Vercel
Storage: Supabase Storage (voice notes, images) via supabase-py (service role)
STT: Sarvam AI saaras:v3 (Hindi, hi-IN) — already wired in app/routes/whatsapp.py
Messaging: Twilio WhatsApp (sandbox for now)
Agent brain: Claude via function calling (to be added)

Bilingual UI: Hindi (worker/family-facing) + English (technical). Bundelkhand/Sagar informal Hindi for operational labels.

Motto baked into product behavior: पहले प्रमाण, फिर बिक्री (prove first, sell later). Golden rule: "Not entered in computer = work not valid."


THE DATA MODEL (this is the redesign — build toward this, not the legacy shape)
Target hierarchy
Crop (e.g. Soybean)                      ← rollup; for now = crop_cycles.crop_name string (GROUP BY)

  └── Crop Cycle = variety + season       ← THE P&L UNIT (e.g. "JS 335 — Kharif 2026")

        ├── spans MANY fields              ← via crop_cycle_fields junction (NOT the old field_code string)

        ├── Task   (has field_id tag; crop_cycle_id is NULLABLE)

        │     └── Work Order → Work Order Resources (cost lives here)

        ├── Sales line items               ← variety level, many buyers/dates

        └── Yield records                  ← crop_cycle + optional field
Two kinds of cost — do not conflate
Crop-attributable: task has a crop_cycle_id → rolls into that variety's P&L.
Field-overhead (field prep): task has crop_cycle_id = NULL but field_id set → ploughing, leveling, erosion control, off-season fertilizer, soil OC rebuild. Starts UNATTRIBUTED in a per-field overhead ledger, NOT in any variety P&L.
Flexible split-attribution (manual, never automatic): a field-prep cost can later be allocated to one OR MANY crop cycles in shares the user specifies. Default = leave unattributed (esp. multi-year soil-rebuild). User may attribute 100% to one cycle, or split (e.g. 60% JS 335 / 40% chana) across several. The user always specifies the shares; the system never guesses.
Allocation model: a prep_cost_allocation table links a prep work-order/task → crop_cycle_id with an amount (or %). 0 rows = unattributed; 1 row @100% = fully attributed; many rows = split. Enforce shares sum to ≤ the prep cost (no over-allocation, no double-count). A variety's cost = its own WO resources + any prep allocations pointing to it. Field-overhead ledger shows the UNALLOCATED remainder.
Field is a TAG, not a hierarchy level
tasks.field_id (nullable FK → fields.field_id). Work orders inherit field from their task.
A crop task: crop_cycle_id set + field_id set. A prep task: crop_cycle_id NULL + field_id set.
What's NEW vs current schema
Change
Detail
crop_cycle_fields junction (NEW)
(crop_cycle_id FK, field_id FK, allocated_acres) — replaces the single field_code string
tasks.field_id (NEW column)
nullable FK → fields.field_id
tasks.crop_cycle_id → NULLABLE
currently NOT NULL; relax it (keep FK + RESTRICT) to allow field-prep tasks
sales (NEW table)
sale_id, crop_cycle_id FK, sale_date, quantity, unit, rate, total_amount, buyer, channel ENUM(mandi/society/private/seed_lot), notes, created_by, created_at
yields (NEW table)
yield_id, crop_cycle_id FK, field_id FK nullable, harvest_date, quantity, unit, quality_grade, notes, created_at
P&L
DERIVED (view or endpoint), not hand-maintained columns. revenue = SUM(sales); cost = SUM(WO resources under cycle's tasks) + SUM(prep_cost_allocation amounts pointing to this cycle); profit = revenue − cost
prep_cost_allocation (NEW table)
links a field-prep task/WO → crop_cycle_id with amount or %. 0/1/many rows. Shares must not exceed the prep cost. Enables manual split of prep across multiple cycles.
workers (NEW table)
worker_id, name, whatsapp_number (personal data — DB only), role/permission (worker/supervisor/owner — drives Q&A authorization), active. Foundation for WhatsApp assignment loop + fixes notes.author_id null bug + basis for future Flutter app.
work_orders.assigned_to (NEW column)
FK → workers.worker_id (assignment may be loose text today — confirm and migrate).
Workers admin screen (frontend)
Add/edit/DEACTIVATE workers (deactivate, don't delete — preserves history). Fields: name, whatsapp_number (validate/normalize to international format, e.g. +91), role. Screen visible to supervisor/owner roles ONLY (it exposes personal data + controls Q&A financial access). One role/permission model shared by this screen and the Q&A authorization.
WO status: add Pending Review
new status between worker-submitted-completion and supervisor-close.

Migration of existing data (don't lose anything)
For each existing cycle: read its field_code string → create one crop_cycle_fields row.
Keep field_code column as a safety net until verified; drop in a LATER cleanup migration.
Backfill tasks.field_id from the cycle's (currently single) field where known.


MIGRATIONS — Alembic discipline (NON-NEGOTIABLE)
There was NO migration system; schema was hand-edited in Supabase. We are fixing that.

Every schema change is an Alembic migration file, committed to git, reviewed before apply. No more dashboard hand-edits.
First task: alembic init, point env.py at the project Base.metadata and DATABASE_URL (read from config), generate a BASELINE migration capturing current schema as-is. alembic upgrade head on baseline must be a no-op against the live DB.
Enum gotcha: existing enums use create_type=False (types pre-exist in Supabase). Alembic autogenerate will try to CREATE/DROP these and fail. Configure env.py / include_object to ignore enum type creation, or guard with IF NOT EXISTS. Always review autogenerated migrations for spurious enum ops before applying.
Test every migration against a branch/copy before the real DB. Provide a downgrade for each.
HOW TABLES GET CREATED (and how the existing DB is protected) — READ BEFORE ANY SCHEMA WORK
Tables are NEVER created by hand in the Supabase dashboard. They are created by Alembic migration files that are reviewed, then applied with alembic upgrade head. Code → review → apply.
All planned changes are ADDITIVE. New tables (sales, yields, crop_cycle_fields) and a new nullable column (tasks.field_id). Adding a table cannot break existing tables. The only change to an existing column — tasks.crop_cycle_id NOT NULL → NULLABLE — is safe because relaxing a constraint never invalidates existing rows.
NOTHING that holds data is dropped or renamed in the structural phase. field_code is KEPT as a safety net and only dropped in a much later cleanup migration after the new structure is verified.
The baseline migration MUST be a no-op. Step 0 generates a baseline capturing the DB exactly as it is today; alembic upgrade head on it must change nothing. If it is not a clean no-op, STOP and fix that before any further migration. This is the safety gate.
Apply to a Supabase copy/branch first, confirm data intact, then apply to production.
If any migration would DROP or RENAME a column/table that may hold data, STOP and ask the user first.


AGENT / WHATSAPP (Phase 4 — build on the existing webhook)
The webhook in app/routes/whatsapp.py already: receives Twilio form-data, downloads media, uploads to Supabase Storage, transcribes via Sarvam. It currently only print()s the transcript — DO NOT leave it there.

After transcription (or for text msgs), pass message to Claude with function calling.
Claude may ONLY call a fixed tool set (NEVER raw SQL). These map to backend endpoints: update_work_order(number, status, notes), create_task(field, crop_cycle?, description), log_expense(...), record_sale(crop_cycle, qty, rate, buyer), query_expenses(start_date, end_date, category?), query_pnl(variety_or_crop), field_prep_cost(field, period).
This fixed-tool boundary IS the safety layer.
Threading: use short codes (WO-142, TSK-88) in outbound alerts; match replies on the code. IDs are already human-typeable (WO0001, TSK0001).
Persist the transcript as a note on the affected record (currently thrown away).
Harden: add Twilio signature validation (currently none). Return proper TwiML.
Twilio sandbox now; production needs Meta-approved sender + template messages, 24-hour reply window applies.
Optional: wrap endpoints as a custom MCP server so the same tools serve agent + dev + future Flutter. NEVER expose Supabase directly via a public MCP — only behind validated endpoints.
WORKER ASSIGNMENT → COMPLETION → SUPERVISOR REVIEW LOOP
Prerequisite: a workers table (see data model) + work_orders.assigned_to FK → workers. Flow:

Supervisor assigns a work order to a worker → worker gets a WhatsApp alert with the WO short code.
Worker replies with photos + comment + "done" (voice or text; voice → Sarvam transcribe).
System matches the short code, saves photos (already uploaded to Supabase Storage) + comment as a NOTE on that work order. Note author = the worker, resolved from the sender's WhatsApp number.
Work order status flips to "Pending Review" (NEW status) — worker CANNOT close it himself.
Supervisor gets a WhatsApp ping ("Worker X submitted completion on WO-XXXX, review in app").
Supervisor reviews evidence in the app and closes the WO (or reopens / sends back). Principle: worker proposes completion, supervisor disposes. Two distinct, auditable steps. The agent role here is light (match code → attach note → flag review) — NOT AI judgment; do not over-engineer. Privacy: worker phone numbers are personal data — store in DB only, never in URLs or brand-facing site.
AGENT CAPABILITIES — staged by trust/risk (build #1 and #3 fully; stage #2)
#1 Completeness-check (LOW risk — build now). On worker completion submission, the agent checks the work order for missing required fields (quantity, area covered, photo, etc.) and asks the worker for them on WhatsApp before accepting ("you haven't shared X"). This is checklist-with-a-conversational-face, NOT judgment. The agent knows the required-field set per WO type and asks for gaps.

#2 Review/close — OUT OF SCOPE THIS PHASE. The supervisor closes work orders — full stop. The agent does NOT close, recommend-to-close, or judge work-order quality in this phase. (Future consideration only, never to be added without explicit owner decision and a season of evidence: closing is a QUALITY judgment an AI cannot reliably make — it can confirm a photo exists, not that the work is good. Do NOT build any agent-close path now.)

#3 WhatsApp Q&A chatbot (LOW risk, HIGH value — build now). Authorized people (you, supervisor, family) ask in Hindi/English ("JS 335 का पिछले साल का खर्चा कितना था, पूरा split बताओ") → agent queries via fixed tools → replies in WhatsApp with the breakdown (cost split, sales, P&L).

AUTHORIZATION IS MANDATORY: the agent resolves WHO is asking from their WhatsApp number (tied to workers/users table with a role/permission). Financial data (cost, revenue, P&L) returns ONLY to authorized roles. A field worker may ask "is my task done"; he may NOT get farm profit. Never return financial data to an unrecognized number.

#4 General expense via WhatsApp (SEPARATE LEDGER — build now). General expense is the INDEPENDENT sibling ledger (no parent crop cycle / work order) — standalone farm spend (diesel, repairs, misc). Family/supervisor can log it from the field: "₹2000 diesel ke liye" → agent calls log_expense → creates a general_expense row → saved. This is its OWN WhatsApp path, distinct from the work-order completion flow.

Authorization: only recognized family/supervisor numbers may create expenses (same role system).
Completeness-check applies: if amount or purpose is missing, agent asks ("किस लिए?") before saving. Minimum = amount + purpose/category; date defaults to today.
Review model = POSTED BUT FLAGGED (verify-after, NOT a gate). The expense saves immediately and DOES count in the ledger in real time (the money is already spent — gating it would understate true spend and give wrong answers to the Q&A bot). It is marked unreviewed. Supervisor has a "Pending verification" filtered view and works through entries: VERIFY (mark reviewed), EDIT (fix category/amount), or REJECT (mark void + reason — stops counting, stays as audit trail; NEVER hard- deleted). This is deliberately DIFFERENT from work-order "Pending Review": a WO is gated because the WORK is in question until verified; an expense already happened, so it posts and is verified after.
Add general_expense.review_status (unreviewed / verified / void) + reviewed_by + void_reason.
Supervisor notification: ping on each logged expense OR a daily digest — make it a SETTING (high-frequency small expenses → digest avoids notification fatigue).
Sets general_expense.created_by from the sender (also fixes the hardcoded-None bug).

Architecture note: #1, #3, #4 are the SAME agent + SAME fixed-tool set, pointed at different jobs. (#2 is not built this phase.)
MAP — NO CHANGES NEEDED
The map plots crop cycles by location. The data-model redesign (variety-anchored cycles, field-as-tag) does NOT change what a crop cycle is on the map — it still pins to location; field is a tag, not the thing mapped. Leave the map as-is. Preserve existing behavior: resolved cycles do NOT show as active on the map. Do not "improve" or refactor the map as part of this work.


RULES CARRIED FORWARD (from existing .cursorrules — never reintroduce these bugs)
Hierarchy integrity: Crop Cycle → Task → Work Order → Resources. General Expense is an INDEPENDENT sibling ledger (no parent), optional polymorphic related_type/related_id.
Task cost (total_expense) = SUM of all WO resource costs under the task. Recompute on every resource change. Never double-count task vs WO.
task_number MUST appear in API responses.
Field-name mappings (Hindi↔English) that previously broke — keep correct: short_description ↔ tipanni (टिप्पणी), description ↔ varnan (वर्णन). (Note: this was historically reversed and caused bugs — short_description is the SHORT one = tipanni; description is the LONG one = varnan.)
seed_category (variety) is NEVER auto-translated.
Resolved cycles: show "Reopen", never appear as active on the map. resolved_date set server-side.
Resolve gating enforced on backend: cannot resolve a cycle while any task is unresolved/uncancelled.
WO number generation: pick ONE mechanism (DB trigger set_work_order_no() OR Python generate_work_order_id) — not both. Reconcile against the live DB and document the choice. (Current code does it in Python; confirm no conflicting trigger.)
Sequential IDs (CC####/TSK####/WO####) currently MAX+1 in Python with no locking → race risk. Move to DB sequences when touched.
Minimal-diff change policy: smallest change that works; report risk level and affected files per change.
NAMING / LANGUAGE
incident_no (CC0001) is LEGACY naming from when cycles were "incidents." NEVER surface "incident" to family/workers — say फसल चक्र / "crop cycle". The column stays for now; the language does not.
Brand/sourcing: NF-to-farmer narrative; never name upstream seed suppliers in any user-facing content.
KNOWN GAPS TO FIX (flagged, do in passing where safe)
Login ignores passwords (DEMO MODE) — wire real auth before real money/sales data goes live.
notes.author_id always written NULL → notes delete always 403s (latent bug). FIXED once workers table exists: WhatsApp notes get author from sender's number; app notes from logged-in user.
general_expense.created_by hardcoded None. FIXED: WhatsApp expense path sets it from sender; app sets it from logged-in user.
Dead client code: frontend cropAPI/materialAPI/equipmentAPI hit nonexistent routes — remove.
Stale docs: README / ERP_CONTRACT.md reference removed chatbot routes, PostGIS, seed_data.py — reconcile.
Legacy crop_cycle_incidents table + CropCycleNote alias — confirm empty, then drop via migration.


DATA VIEWING / EXPORT — division of labor
The app = operational views only. Lists, crop-cycle detail with a P&L panel, sales/yield entry, field-overhead per field. Live and transactional. Do NOT build analytics dashboards or cross-season charting into the app — that is Power BI's job.
Power BI = analytics. Connects directly to Supabase via PostgreSQL (?sslmode=require, already set up). Owns trend analysis, variety-vs-variety P&L comparison, soil-rebuild overhead tracking. The NEW sales/yields tables are what it was missing — once they exist, revenue/P&L dashboards become possible for the first time.
Export: a lightweight CSV/Excel export button on app list views is worth adding (family may want a spreadsheet to share/print). Keep it simple — not a substitute for Power BI.
BUILD ORDER (slices — build, test, confirm, next)
Alembic setup + baseline migration (no-op against live DB)
crop_cycle_fields junction; tasks.field_id; crop_cycle_id nullable; migrate field_code data
sales + yields tables; P&L view/endpoint; sales & yield CRUD endpoints; workers table + work_orders.assigned_to + "Pending Review" status (foundation for the assignment loop)
Frontend: two tabs (Crops + Fields); task form gets Field picker + optional "field prep / no crop"; sales & yield entry UI; prep-cost allocation screen (pick cycles, enter shares to split/attribute prep cost, or leave unattributed); worker assignment UI + supervisor review/close screen; Workers admin screen (add/edit/deactivate workers, supervisor/owner only, validate +91 phone format); general-expense "Pending verification" view (supervisor verify/edit/void, void keeps audit trail)
WhatsApp agent loop: intent → fixed tools; threading via short codes; persist transcript; harden webhook; worker assignment → completion → supervisor review loop; agent completeness-check (#1, ask worker for missing info); authorized Q&A chatbot (#3 — role-gated financial answers); general expense via WhatsApp (#4 — separate ledger, family logs spend from field, saves directly). NOTE: agent does NOT close work orders (#2 out of scope). Map: no changes.
Harden: real auth, ID race fix, doc reconciliation

Prove each slice (sandbox / test data) before moving on.

