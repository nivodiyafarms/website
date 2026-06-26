import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import api from '../services/api';
import { formatMoney } from '../utils/money';
import { SEASONS, NEW_PREP_WO as S, PREP_RESOURCE_TYPES } from '../strings/hi';

const SEASON_KEYS = ['kharif', 'rabi', 'zaid'];
const YEAR_MIN = 2023;
const YEAR_MAX = 2030;
const DEFAULT_YEAR = 2026;

function emptyResource() {
  return { name: '', resource_type: 'labor', cost: '' };
}

export default function NewPrepWOPage() {
  const { field_id, work_order_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(work_order_id);
  const existing = location.state?.prepWO ?? null;

  // ── Form state ────────────────────────────────────────────────────────────
  const [description, setDescription] = useState(existing?.description ?? '');
  const [season, setSeason]           = useState(existing?.prep_season ?? 'kharif');
  const [year, setYear]               = useState(existing?.prep_crop_year ?? DEFAULT_YEAR);
  const [resources, setResources]     = useState(
    existing?.resources?.length
      ? existing.resources.map(r => ({ name: r.name, resource_type: r.resource_type, cost: String(r.cost) }))
      : [emptyResource()]
  );
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Live total ────────────────────────────────────────────────────────────
  const liveTotal = resources.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);
  const { formatted: liveTotalFmt } = formatMoney(liveTotal);

  // ── Resource helpers ──────────────────────────────────────────────────────
  function updateRes(idx, field, val) {
    setResources(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  }
  function addResource() {
    setResources(prev => [...prev, emptyResource()]);
  }
  function removeResource(idx) {
    setResources(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!description.trim()) e.desc = S.errors.desc;
    const resErrors = resources.map(r => {
      const re = {};
      if (!r.name.trim()) re.name = S.errors.resName;
      const c = parseFloat(r.cost);
      if (!r.cost || isNaN(c) || c <= 0) re.cost = S.errors.resCost;
      return re;
    });
    const hasResError = resErrors.some(re => Object.keys(re).length > 0);
    if (hasResError) e.resources = resErrors;
    return e;
  }

  const isValid = description.trim() &&
    resources.every(r => r.name.trim() && parseFloat(r.cost) > 0) &&
    liveTotal > 0;

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      const payload = {
        description: description.trim(),
        prep_season: season,
        prep_crop_year: year,
        resources: resources.map(r => ({
          name: r.name.trim(),
          resource_type: r.resource_type,
          cost: parseFloat(r.cost),
        })),
      };
      if (isEdit) {
        await api.put(`/fields/${field_id}/prep-work/${work_order_id}`, payload);
      } else {
        await api.post(`/fields/${field_id}/prep-work`, payload);
      }
      setSuccess(true);
      setTimeout(() => navigate(`/fields/${field_id}`), 900);
    } catch {
      setErrors({ submit: 'कुछ गड़बड़ हो गई, दोबारा कोशिश करो।' });
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-16 md:pt-8">

      {/* Back */}
      <button
        onClick={() => navigate(`/fields/${field_id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        वापस
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? S.editTitle : S.title}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {S.descLabel}
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={S.descPlaceholder}
            className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-orange-400
              ${errors.desc ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.desc && <p className="text-xs text-red-500 mt-1">{errors.desc}</p>}
        </div>

        {/* Season + Year on same row */}
        <div className="flex gap-4">
          {/* Season picker */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{S.seasonLabel}</label>
            <div className="flex gap-2">
              {SEASON_KEYS.map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSeason(key)}
                  className={`flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold border transition-colors
                    ${season === key
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}
                >
                  {SEASONS[key]}
                </button>
              ))}
            </div>
          </div>

          {/* Year stepper */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{S.yearLabel}</label>
            <div className="flex items-center gap-2 h-10">
              <button
                type="button"
                onClick={() => setYear(y => Math.max(YEAR_MIN, y - 1))}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-bold flex items-center justify-center"
              >−</button>
              <span className="text-sm font-bold text-gray-900 w-12 text-center tabular-nums">{year}</span>
              <button
                type="button"
                onClick={() => setYear(y => Math.min(YEAR_MAX, y + 1))}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-bold flex items-center justify-center"
              >+</button>
            </div>
          </div>
        </div>

        {/* Resource lines */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{S.resourcesLabel}</label>
          <div className="space-y-3">
            {resources.map((res, idx) => {
              const resErr = errors.resources?.[idx] ?? {};
              return (
                <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                  {/* Resource type chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {PREP_RESOURCE_TYPES.map(rt => (
                      <button
                        key={rt.value}
                        type="button"
                        onClick={() => updateRes(idx, 'resource_type', rt.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                          ${res.resource_type === rt.value
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
                      >
                        {rt.label}
                      </button>
                    ))}
                  </div>
                  {/* Name + cost + remove */}
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={res.name}
                        onChange={e => updateRes(idx, 'name', e.target.value)}
                        placeholder={S.resourceName}
                        className={`w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400
                          focus:outline-none focus:ring-2 focus:ring-orange-400
                          ${resErr.name ? 'border-red-400' : 'border-gray-200'} bg-white`}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">₹</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          value={res.cost}
                          onChange={e => updateRes(idx, 'cost', e.target.value)}
                          placeholder={S.resourceCost}
                          className={`w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400
                            focus:outline-none focus:ring-2 focus:ring-orange-400
                            ${resErr.cost ? 'border-red-400' : 'border-gray-200'} bg-white`}
                        />
                      </div>
                    </div>
                    {resources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeResource(idx)}
                        className="mt-0.5 text-gray-300 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {(resErr.name || resErr.cost) && (
                    <p className="text-xs text-red-500">{resErr.name || resErr.cost}</p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addResource}
            className="mt-2 text-sm text-orange-600 font-medium hover:text-orange-700"
          >
            {S.addResource}
          </button>
        </div>

        {/* Live total */}
        {liveTotal > 0 && (
          <div className="flex justify-between items-center rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">{S.liveTotal}</span>
            <span className="text-lg font-bold text-orange-600 tabular-nums">{liveTotalFmt}</span>
          </div>
        )}

        {/* Submit error */}
        {errors.submit && (
          <p className="text-sm text-red-500 text-center">{errors.submit}</p>
        )}

        {/* Submit */}
        {success ? (
          <div className="w-full rounded-xl bg-green-50 border border-green-200 py-3 text-center text-green-700 text-sm font-semibold">
            {S.success}
          </div>
        ) : (
          <button
            type="submit"
            disabled={!isValid || saving}
            className="w-full rounded-xl bg-orange-500 text-white font-bold py-3.5 text-base
              hover:bg-orange-600 active:bg-orange-700 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? S.saving : S.submit}
          </button>
        )}

      </form>
    </div>
  );
}
