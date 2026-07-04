/**
 * NewYieldPage — /cycle/:crop_cycle_id/yields/new         (create)
 *               /cycle/:crop_cycle_id/yields/:yield_id/edit (edit)
 * Detects edit mode via presence of yield_id param.
 *
 * TODO(auth): created_by + role-gate in Slice 6.
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import { SEASONS, NEW_YIELD as S, SALE_UNITS, QUALITY_GRADES } from '../strings/hi';

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

export default function NewYieldPage() {
  const { crop_cycle_id, yield_id } = useParams();
  const isEdit   = Boolean(yield_id);
  const navigate = useNavigate();
  const location = useLocation();
  const ctx      = location.state ?? {};
  const existing = ctx.yield ?? null;  // passed by CycleDetailPage when editing

  // Form state — pre-filled in edit mode
  const [qty,        setQty]        = useState(isEdit && existing ? String(existing.quantity) : '');
  const [unit,       setUnit]       = useState(isEdit && existing ? existing.unit          : 'quintal');
  const [fieldId,    setFieldId]    = useState(isEdit && existing ? (existing.field_id ?? '') : '');
  const [grade,      setGrade]      = useState(isEdit && existing ? (existing.quality_grade ?? '') : '');
  const [harvestDate, setHarvestDate] = useState(isEdit && existing ? existing.harvest_date : todayStr());
  const [notes,      setNotes]      = useState(isEdit && existing ? (existing.notes ?? '') : '');
  const [showNotes,  setShowNotes]  = useState(Boolean(isEdit && existing?.notes));

  const [cycleFields, setCycleFields] = useState([]);
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  // Load this cycle's fields for the picker
  useEffect(() => {
    api.get(`/crop-cycles/${crop_cycle_id}/fields`)
      .then(r => setCycleFields(r.data ?? []))
      .catch(() => {});
  }, [crop_cycle_id]);

  const qtyNum  = parseFloat(qty) || 0;

  const seasonHindi = SEASONS[ctx.season] ?? ctx.season ?? '';
  const cropYear    = ctx.crop_year ? ` ${ctx.crop_year}` : '';
  const cycleLabel  = [ctx.crop_name, ctx.seed_category].filter(Boolean).join(' ') +
    (seasonHindi ? ` — ${seasonHindi}${cropYear}` : '');

  function validate() {
    const e = {};
    if (!qty || qtyNum <= 0) e.qty = S.errors.qty;
    return e;
  }

  const isValid = qtyNum > 0;

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSaving(true);
    const payload = {
      harvest_date:  harvestDate,
      quantity:      qtyNum,
      unit,
      field_id:      fieldId || null,
      quality_grade: grade || null,
      notes:         notes.trim() || null,
    };
    try {
      if (isEdit) {
        await api.put(`/yields/${yield_id}`, payload);
      } else {
        await api.post('/yields', { crop_cycle_id, ...payload });
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

        {/* ── खेत (optional, only if cycle has fields) ─────────────────── */}
        {cycleFields.length > 0 && (
          <div>
            <FieldLabel text={S.field} />
            <div className="flex flex-wrap gap-2">
              {/* "पूरी फसल" = no specific field */}
              <button
                type="button"
                onClick={() => setFieldId('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                  ${!fieldId
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
              >
                {S.fieldAll}
              </button>
              {cycleFields.map(f => (
                <button
                  key={f.field_id}
                  type="button"
                  onClick={() => setFieldId(f.field_id)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors text-left
                    ${fieldId === f.field_id
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <span className="font-bold font-mono">{f.field_id}</span>
                  {f.allocated_acres ? <span className="opacity-75"> · {f.allocated_acres}एकड़</span> : ''}
                  {f.name && f.name !== f.field_id && (
                    <span className={`block text-[10px] leading-tight mt-0.5 ${fieldId === f.field_id ? 'opacity-80' : 'text-gray-400'}`}>
                      {f.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── दर्जा (quality_grade — optional tap picks) ─────────────── */}
        <div>
          <FieldLabel text={S.grade} />
          <div className="flex flex-wrap gap-2">
            {/* No-grade option */}
            <button
              type="button"
              onClick={() => setGrade('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                ${!grade
                  ? 'bg-gray-100 text-gray-700 border-gray-300 font-semibold'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
            >
              —
            </button>
            {QUALITY_GRADES.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGrade(grade === g.value ? '' : g.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                  ${grade === g.value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── तारीख ────────────────────────────────────────────────────── */}
        <div>
          <FieldLabel text={S.date} />
          <input
            type="date"
            value={harvestDate}
            onChange={e => setHarvestDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white
              focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
          />
        </div>

        {/* ── टिप्पणी (collapsed) ───────────────────────────────────────── */}
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
