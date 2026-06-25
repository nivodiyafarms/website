/**
 * NewSalePage — /cycle/:crop_cycle_id/sales/new         (create)
 *              /cycle/:crop_cycle_id/sales/:sale_id/edit (edit)
 * Detects edit mode via presence of sale_id param.
 * Edit: pre-fills from location.state.sale, submits via PUT.
 * Create: empty form, submits via POST.
 *
 * TODO(auth): created_by + role-gate in Slice 6.
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import { formatMoney } from '../utils/money';
import { SEASONS, NEW_SALE as S, SALE_CHANNELS, SALE_UNITS } from '../strings/hi';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function FieldLabel({ text }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {text}
    </p>
  );
}

export default function NewSalePage() {
  const { crop_cycle_id, sale_id } = useParams();
  const isEdit   = Boolean(sale_id);
  const navigate = useNavigate();
  const location = useLocation();
  const ctx      = location.state ?? {};
  const existing = ctx.sale ?? null;   // passed by CycleDetailPage when editing

  // Form state — pre-filled in edit mode from existing sale
  const [qty,       setQty]       = useState(isEdit && existing ? String(existing.quantity) : '');
  const [unit,      setUnit]      = useState(isEdit && existing ? existing.unit       : 'quintal');
  const [rate,      setRate]      = useState(isEdit && existing ? String(existing.rate) : '');
  const [buyer,     setBuyer]     = useState(isEdit && existing ? (existing.buyer ?? '') : '');
  const [channel,   setChannel]   = useState(isEdit && existing ? existing.channel    : '');
  const [saleDate,  setSaleDate]  = useState(isEdit && existing ? existing.sale_date  : todayStr());
  const [notes,     setNotes]     = useState(isEdit && existing ? (existing.notes ?? '') : '');
  const [showNotes, setShowNotes] = useState(Boolean(isEdit && existing?.notes));

  const [recentBuyers, setRecentBuyers] = useState([]);
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);

  useEffect(() => {
    api.get('/buyers/recent')
      .then(r => setRecentBuyers(r.data.buyers ?? []))
      .catch(() => {});
  }, []);

  const qtyNum  = parseFloat(qty)  || 0;
  const rateNum = parseFloat(rate) || 0;
  const total   = qtyNum * rateNum;
  const { formatted: totalFmt } = formatMoney(total);

  const seasonHindi = SEASONS[ctx.season] ?? ctx.season ?? '';
  const cropYear    = ctx.crop_year ? ` ${ctx.crop_year}` : '';
  const cycleLabel  = [ctx.crop_name, ctx.seed_category].filter(Boolean).join(' ') +
    (seasonHindi ? ` — ${seasonHindi}${cropYear}` : '');

  function validate() {
    const e = {};
    if (!qty  || qtyNum  <= 0) e.qty     = S.errors.qty;
    if (!rate || rateNum <= 0) e.rate    = S.errors.rate;
    if (!channel)              e.channel = S.errors.channel;
    return e;
  }

  // Both qty and rate must be strictly > 0 to enable submit
  const isValid = qtyNum > 0 && rateNum > 0 && channel;

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSaving(true);
    const payload = {
      sale_date: saleDate,
      quantity:  qtyNum,
      unit,
      rate:      rateNum,
      buyer:     buyer.trim() || null,
      channel,
      notes:     notes.trim() || null,
    };
    try {
      if (isEdit) {
        await api.put(`/sales/${sale_id}`, payload);
      } else {
        await api.post('/sales', { crop_cycle_id, ...payload });
      }
      setSaved(true);
      setTimeout(() => navigate(`/cycle/${crop_cycle_id}`, { replace: true }), 900);
    } catch (err) {
      setSaving(false);
      const detail = err?.response?.data?.detail ?? 'कुछ गड़बड़ हो गई।';
      setErrors({ submit: detail });
    }
  }

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-20 text-center">
        <p className="text-4xl mb-3">✓</p>
        <p className="text-xl font-bold text-green-700">{S.success}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-12 md:pt-8">

      {/* Back */}
      <button
        onClick={() => navigate(`/cycle/${crop_cycle_id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {ctx.crop_name ?? 'वापस'}
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {isEdit ? S.editTitle : S.title}
      </h1>
      {cycleLabel && <p className="text-sm text-gray-400 mb-6">{cycleLabel}</p>}

      <div className="space-y-6">

        {/* ── मात्रा + इकाई ────────────────────────────────────────────── */}
        <div>
          <FieldLabel text={S.qty} />
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <input
                type="number"
                inputMode="decimal"
                value={qty}
                onChange={e => { setQty(e.target.value); setErrors(v => ({ ...v, qty: undefined })); }}
                placeholder={S.qtyPlaceholder}
                className={`w-full border rounded-xl px-4 py-3 text-lg bg-white
                  focus:outline-none focus:ring-2 focus:ring-green-500
                  ${errors.qty ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.qty && <p className="text-xs text-red-500 mt-1">{errors.qty}</p>}
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {SALE_UNITS.map(u => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUnit(u.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                    ${unit === u.value
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── भाव ──────────────────────────────────────────────────────── */}
        <div>
          <FieldLabel text={S.rate} />
          <input
            type="number"
            inputMode="decimal"
            value={rate}
            onChange={e => { setRate(e.target.value); setErrors(v => ({ ...v, rate: undefined })); }}
            placeholder={S.ratePlaceholder}
            className={`w-full border rounded-xl px-4 py-3 text-lg bg-white
              focus:outline-none focus:ring-2 focus:ring-green-500
              ${errors.rate ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.rate && <p className="text-xs text-red-500 mt-1">{errors.rate}</p>}
        </div>

        {/* ── LIVE TOTAL ────────────────────────────────────────────────── */}
        {total > 0 && (
          <div className="rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-center">
            <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">
              {S.liveTotal}
            </p>
            <p className="text-3xl md:text-4xl font-bold text-green-700 tabular-nums">
              {totalFmt}
            </p>
          </div>
        )}

        {/* ── खरीदार ───────────────────────────────────────────────────── */}
        <div>
          <FieldLabel text={S.buyer} />
          {recentBuyers.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-400 mb-1.5">{S.recentBuyers}</p>
              <div className="flex flex-wrap gap-2">
                {recentBuyers.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBuyer(b)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors
                      ${buyer === b
                        ? 'bg-green-100 border-green-400 text-green-800 font-medium'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
          <input
            type="text"
            value={buyer}
            onChange={e => setBuyer(e.target.value)}
            placeholder={S.buyerPlaceholder}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white
              focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
          />
        </div>

        {/* ── किसको बेचा ───────────────────────────────────────────────── */}
        <div>
          <FieldLabel text={S.channel} />
          {errors.channel && <p className="text-xs text-red-500 mb-1.5">{errors.channel}</p>}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SALE_CHANNELS).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => { setChannel(val); setErrors(v => ({ ...v, channel: undefined })); }}
                className={`py-3.5 rounded-xl text-base font-semibold border transition-colors
                  ${channel === val
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── तारीख ────────────────────────────────────────────────────── */}
        <div>
          <FieldLabel text={S.date} />
          <input
            type="date"
            value={saleDate}
            onChange={e => setSaleDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white
              focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
          />
        </div>

        {/* ── टिप्पणी (collapsed unless pre-filled) ────────────────────── */}
        <div>
          <button
            type="button"
            onClick={() => setShowNotes(v => !v)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            {showNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {S.addNotes}
          </button>
          {showNotes && (
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={S.notesPlaceholder}
              rows={3}
              className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 bg-white
                focus:outline-none focus:ring-2 focus:ring-green-500 text-base resize-none"
            />
          )}
        </div>

        {errors.submit && (
          <p className="text-sm text-red-600 text-center">{errors.submit}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition-all
            ${isValid && !saving
              ? 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          {saving ? S.saving : S.submit}
        </button>

      </div>
    </div>
  );
}
