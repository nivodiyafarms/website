/**
 * PrepAllocPage — /fields/:field_id/prep/:work_order_id/allocate
 *
 * Distribute a field-prep WO's cost across same-season crop cycles.
 * Navigation state (from FieldDetailPage):
 *   { prepWO: PrepWorkOrderItem }  — carries wo details so we know season/year/cost
 *
 * Backend:
 *   GET  /work-orders/{woId}/prep-allocation-summary  → { wo_cost, allocated_total, unallocated_remainder, allocations[] }
 *   GET  /crop-cycles/                                → all cycles (we filter client-side by season+year)
 *   POST /prep-cost-allocations                       → { work_order_id, crop_cycle_id, amount }
 *   DELETE /prep-cost-allocations/{allocId}           → 200
 *
 * Over-allocation prevention:
 *   UI caps per-cycle save button when amount > available.
 *   Backend is the backstop (400 on over-allocation).
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { prepAllocAPI } from '../services/api';
import api from '../services/api';
import { formatMoney } from '../utils/money';
import { SEASONS, PREP_ALLOC as S } from '../strings/hi';

function fmt(n) {
  return formatMoney(n).formatted;
}

// ── Remaining bar ─────────────────────────────────────────────────────────────

function RemainingBar({ woCost, allocated, localPending }) {
  const totalUsed = allocated + localPending;
  const remaining = woCost - totalUsed;
  const isOver    = remaining < -0.005;
  const isDone    = !isOver && remaining < 0.005 && totalUsed > 0;
  const pct       = Math.min(100, woCost > 0 ? (totalUsed / woCost) * 100 : 0);

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm px-5 py-4 mb-5">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{S.woCost}</span>
        <span className="text-lg font-bold text-gray-900 tabular-nums">{fmt(woCost)}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-gray-100 mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-200 ${isOver ? 'bg-red-500' : 'bg-orange-400'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{S.remaining}</span>
        <span className={`text-xl font-bold tabular-nums ${
          isOver ? 'text-red-600' : isDone ? 'text-green-600' : 'text-orange-600'
        }`}>
          {isOver
            ? S.overAlloc(Math.round(Math.abs(remaining)))
            : isDone
              ? S.remainingZero
              : fmt(remaining)
          }
        </span>
      </div>
    </div>
  );
}

// ── Existing allocation row ───────────────────────────────────────────────────

function AllocRow({ alloc, cycleName, onRemoved }) {
  const [busy, setBusy] = useState(false);

  async function handleRemove() {
    setBusy(true);
    try {
      await prepAllocAPI.remove(alloc.id);
      onRemoved(alloc.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800 truncate">{cycleName}</p>
        <p className="text-xs font-mono text-gray-400 mt-0.5">{alloc.crop_cycle_incident_no}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold text-orange-600 tabular-nums">{fmt(alloc.amount)}</span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700
            disabled:opacity-40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {busy ? S.removing : S.removeBtn}
        </button>
      </div>
    </div>
  );
}

// ── Unallocated cycle row ─────────────────────────────────────────────────────

function CycleInputRow({ cycle, maxAmount, inputVal, onChange, onSave, saving }) {
  const parsed  = parseFloat(inputVal) || 0;
  const isOver  = parsed > maxAmount + 0.005;
  const canSave = parsed > 0 && !isOver && !saving;

  const { formatted: maxFmt } = formatMoney(maxAmount);

  return (
    <div className="px-4 py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {cycle.crop_name}
            {cycle.seed_category ? <span className="text-gray-400 font-normal"> · {cycle.seed_category}</span> : null}
          </p>
          <p className="text-xs font-mono text-gray-400 mt-0.5">{cycle.incident_no}</p>
        </div>
        <p className="text-[11px] text-gray-400 shrink-0 mt-0.5">{S.perCycleMax(maxFmt)}</p>
      </div>

      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <input
            type="number"
            inputMode="decimal"
            value={inputVal}
            onChange={e => onChange(e.target.value)}
            placeholder={S.amountPlaceholder}
            className={`w-full border rounded-xl px-3 py-2.5 text-base bg-white
              focus:outline-none focus:ring-2 focus:ring-orange-400
              ${isOver ? 'border-red-400' : 'border-gray-300'}`}
          />
          {isOver && (
            <p className="text-xs text-red-500 mt-1">{S.errors.overMax(Math.floor(maxAmount))}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
            bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.97]
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? S.saving : S.saveBtn}
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PrepAllocPage() {
  const { field_id, work_order_id } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();
  const prepWO    = location.state?.prepWO ?? null;   // passed from FieldDetailPage

  const [summary,   setSummary]   = useState(null);  // { wo_cost, allocated_total, unallocated_remainder, allocations[] }
  const [allCycles, setAllCycles] = useState([]);
  const [woMeta,    setWoMeta]    = useState(       // prep_season + prep_crop_year, from state or fallback fetch
    prepWO
      ? { prep_season: prepWO.prep_season, prep_crop_year: prepWO.prep_crop_year, work_order_number: prepWO.work_order_number }
      : null
  );
  const [loading,   setLoading]   = useState(true);
  const [inputs,    setInputs]    = useState({});    // { [cycleId]: string }
  const [saving,    setSaving]    = useState({});    // { [cycleId]: bool }
  const [error,     setError]     = useState(null);

  const loadSummary = useCallback(async () => {
    const res = await prepAllocAPI.summary(work_order_id);
    setSummary(res.data);
    return res.data;
  }, [work_order_id]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const requests = [
          prepAllocAPI.summary(work_order_id),
          api.get('/crop-cycles/'),
        ];
        // Fallback: if no route state, fetch season/year from the field's prep-work list
        if (!prepWO) {
          requests.push(api.get(`/fields/${field_id}/prep-work`));
        }
        const results = await Promise.all(requests);
        setSummary(results[0].data);
        setAllCycles(results[1].data ?? []);
        if (!prepWO) {
          const wos = results[2].data?.work_orders ?? [];
          const found = wos.find(w => w.work_order_id === work_order_id);
          if (found) {
            setWoMeta({
              prep_season:        found.prep_season,
              prep_crop_year:     found.prep_crop_year,
              work_order_number:  found.work_order_number,
            });
          }
        }
      } catch {
        setError('डेटा नहीं आया।');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [work_order_id]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Same-season filter: match prep WO's season+year
  const woSeason = woMeta?.prep_season;
  const woYear   = woMeta?.prep_crop_year;

  const matchedCycles = allCycles.filter(c =>
    c.season === woSeason && c.crop_year === woYear
  );

  const allocatedIds = new Set((summary?.allocations ?? []).map(a => a.crop_cycle_id));
  const unallocatedCycles = matchedCycles.filter(c => !allocatedIds.has(c.crop_cycle_id));

  // Live remaining: server's unallocated_remainder minus sum of pending inputs
  const totalPending = Object.entries(inputs).reduce((sum, [, v]) => sum + (parseFloat(v) || 0), 0);
  const localRemaining = (summary?.unallocated_remainder ?? 0) - totalPending;

  function maxForCycle(cycleId) {
    const otherPending = totalPending - (parseFloat(inputs[cycleId]) || 0);
    return Math.max(0, (summary?.unallocated_remainder ?? 0) - otherPending);
  }

  async function handleSave(cycle) {
    const amount = parseFloat(inputs[cycle.crop_cycle_id]) || 0;
    if (amount <= 0) return;

    setSaving(s => ({ ...s, [cycle.crop_cycle_id]: true }));
    setError(null);
    try {
      await prepAllocAPI.create({
        work_order_id,
        crop_cycle_id: cycle.crop_cycle_id,
        amount,
      });
      // Clear input for this cycle, refresh summary
      setInputs(prev => { const n = { ...prev }; delete n[cycle.crop_cycle_id]; return n; });
      await loadSummary();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === 'object' ? detail.message : (detail ?? 'कुछ गड़बड़ हो गई।');
      setError(msg);
    } finally {
      setSaving(s => ({ ...s, [cycle.crop_cycle_id]: false }));
    }
  }

  function handleRemoved(allocId) {
    // Optimistically remove from summary, then re-fetch
    setSummary(prev => {
      if (!prev) return prev;
      const removed = prev.allocations.find(a => a.id === allocId);
      const removedAmt = removed ? Number(removed.amount) : 0;
      return {
        ...prev,
        allocations: prev.allocations.filter(a => a.id !== allocId),
        allocated_total: prev.allocated_total - removedAmt,
        unallocated_remainder: prev.unallocated_remainder + removedAmt,
      };
    });
    // Also re-fetch for accuracy
    loadSummary();
  }

  // Build a map of cycle name by id for allocation rows
  const cycleNameById = Object.fromEntries(
    allCycles.map(c => [c.crop_cycle_id, `${c.crop_name}${c.seed_category ? ' · ' + c.seed_category : ''}`])
  );

  const seasonHindi = SEASONS[woSeason] ?? woSeason ?? '';
  const woLabel = woMeta?.work_order_number ?? work_order_id.slice(0, 8);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        <div className="h-8 w-40 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-16 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-12 md:pt-8">

      {/* Back */}
      <button
        onClick={() => navigate(`/fields/${field_id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {S.back}
      </button>

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-0.5">{S.heading}</h1>
      <p className="text-sm text-gray-400 mb-5">{S.subLabel(woLabel)}</p>

      {/* ── Remaining bar ── */}
      {summary && (
        <RemainingBar
          woCost={summary.wo_cost}
          allocated={summary.allocated_total}
          localPending={totalPending}
        />
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          {error}
        </p>
      )}

      {/* ── Existing allocations ── */}
      {summary?.allocations?.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm mb-4 overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {S.existingHeading}
          </p>
          {summary.allocations.map(alloc => (
            <AllocRow
              key={alloc.id}
              alloc={alloc}
              cycleName={cycleNameById[alloc.crop_cycle_id] ?? alloc.crop_cycle_incident_no ?? '—'}
              onRemoved={handleRemoved}
            />
          ))}
        </div>
      )}

      {/* ── Available cycles section ── */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {woSeason && woYear ? S.availHeading(seasonHindi, woYear) : 'फसलें'}
        </p>

        {matchedCycles.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-gray-400">
            {woSeason && woYear ? S.noCycles(seasonHindi, woYear) : 'कोई फसल नहीं'}
          </p>
        ) : unallocatedCycles.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-green-600 font-medium">
            ✓ {S.allAllocated}
          </p>
        ) : (
          unallocatedCycles.map(cycle => (
            <CycleInputRow
              key={cycle.crop_cycle_id}
              cycle={cycle}
              maxAmount={maxForCycle(cycle.crop_cycle_id)}
              inputVal={inputs[cycle.crop_cycle_id] ?? ''}
              onChange={val => setInputs(prev => ({ ...prev, [cycle.crop_cycle_id]: val }))}
              onSave={() => handleSave(cycle)}
              saving={!!saving[cycle.crop_cycle_id]}
            />
          ))
        )}
      </div>

      {/* If WO has no season tag at all */}
      {!woSeason && (
        <p className="mt-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          इस काम पर सीज़न नहीं डाला — पहले खेत की तैयारी में सीज़न जोड़ो।
        </p>
      )}
    </div>
  );
}
