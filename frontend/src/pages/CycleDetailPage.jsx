/**
 * CycleDetailPage — /cycle/:crop_cycle_id
 * THE money screen. Hero P&L + tasks (2a display + 2b CRUD) + fields/sales/yields.
 *
 * Fetches on mount + after every mutation:
 *   GET /api/crop-cycles/{id}/pnl
 *   GET /api/crop-cycles/{id}
 *   GET /api/sales?crop_cycle_id={id}
 *   GET /api/yields?crop_cycle_id={id}
 *   GET /api/crop-cycles/{id}/tasks-detail
 *
 * TODO(auth-slice-6): gate this screen to supervisor/owner role — financial data.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import api, { cropCycleAPI, fieldAPI, woActionsAPI, workersAPI } from '../services/api';
import { ProfitDisplay, formatMoney } from '../utils/money';
import {
  SEASONS, CYCLE_DETAIL_STRINGS as S, SALE_CHANNELS, YIELD_LIST as YS,
  QUALITY_GRADES, TASK_STATUSES, TASK_STATUS_COLORS, WO_STATUSES, WO_STATUS_COLORS,
  RESOURCE_TYPES, PREP_RESOURCE_TYPES, TASKS_CRUD as TC,
  TASK_CATEGORY_LABELS, TASK_SUBCATEGORIES, SEVERITY_BADGES, NEW_CYCLE as NC,
  SEED_CLASS_OPTIONS, SEED_STAGE_OPTIONS,
} from '../strings/hi';

// ── Helpers ────────────────────────────────────────────────────────────────────
function emptyResLine() { return { name: '', resource_type: 'labor', resource_type_custom: '', cost: '' }; }

// ── Simple breakdown row ────────────────────────────────────────────────────────
function MoneyLine({ label, amount, className = '' }) {
  const { formatted } = formatMoney(amount);
  return (
    <div className={`flex justify-between items-center py-2 ${className}`}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm tabular-nums ${className}`}>{formatted}</span>
    </div>
  );
}

// ── Simple section card ────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
        {title}
      </h2>
      <div className="rounded-xl bg-white border border-gray-200 px-4 divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

// ── CycleEditForm — edit crop cycle (crop, variety, dates, fields+acres) ──────
function CycleEditForm({ cycleId, initial, initialCycleFields, onSave, onCancel }) {
  const [allFields,      setAllFields]      = useState([]);
  const [loadingData,    setLoadingData]    = useState(true);

  const [crop,             setCrop]             = useState(initial.crop_name ?? '');
  const [variety,          setVariety]          = useState(initial.seed_category ?? '');
  const [seedClass,        setSeedClass]        = useState(initial.seed_class ?? '');
  const [seedClassCustom,  setSeedClassCustom]  = useState(initial.seed_class_custom ?? '');
  const [seedStage,        setSeedStage]        = useState(initial.seed_stage ?? '');
  const [seedStageCustom,  setSeedStageCustom]  = useState(initial.seed_stage_custom ?? '');
  const [sowDate,          setSowDate]          = useState(initial.sowing_date ?? '');
  const [seedQty,          setSeedQty]          = useState(
    initial.seed_quantity != null ? String(initial.seed_quantity) : ''
  );
  const [selectedFields, setSelectedFields] = useState(
    initialCycleFields.map(f => ({
      field_id:        f.field_id,
      name:            f.field_id,
      allocated_acres: f.allocated_acres != null ? String(f.allocated_acres) : '',
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    fieldAPI.getAll()
      .then(r => {
        const aF = r.data || [];
        setAllFields(aF);
        // Enrich names from fields list
        setSelectedFields(prev =>
          prev.map(sf => {
            const found = aF.find(f => f.field_id === sf.field_id);
            return found ? { ...sf, name: found.name || sf.field_id } : sf;
          })
        );
        setLoadingData(false);
      })
      .catch(() => setLoadingData(false));
  }, []);

  const availableFields = allFields.filter(
    f => !selectedFields.find(s => s.field_id === f.field_id)
  );
  const addField    = (f) => setSelectedFields(prev => [
    ...prev, { field_id: f.field_id, name: f.name || f.field_id, allocated_acres: '' }
  ]);
  const removeField = (id) => setSelectedFields(prev => prev.filter(f => f.field_id !== id));
  const setAcres    = (id, val) => setSelectedFields(prev =>
    prev.map(f => f.field_id === id ? { ...f, allocated_acres: val } : f)
  );
  const totalAcres = selectedFields.reduce((sum, f) => sum + (parseFloat(f.allocated_acres) || 0), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!crop.trim())                  { setError(NC.errors.crop);    return; }
    if (!sowDate)                      { setError(NC.errors.sowing);  return; }
    if (selectedFields.length === 0)   { setError(NC.errors.noField); return; }
    for (const f of selectedFields) {
      if (!(parseFloat(f.allocated_acres) > 0)) { setError(NC.errors.acres); return; }
    }
    setSaving(true); setError('');
    try {
      await cropCycleAPI.updateCycle(cycleId, {
        crop_name:         crop.trim(),
        seed_category:     variety.trim() || null,
        seed_class:        seedClass || null,
        seed_class_custom: seedClass === 'other' ? (seedClassCustom.trim() || null) : null,
        seed_stage:        seedStage || null,
        seed_stage_custom: seedStage === 'other' ? (seedStageCustom.trim() || null) : null,
        sowing_date:       sowDate,
        seed_quantity:     seedQty ? parseFloat(seedQty) : null,
        fields:            selectedFields.map(f => ({
          field_id:        f.field_id,
          allocated_acres: parseFloat(f.allocated_acres),
        })),
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.detail || 'कुछ गड़बड़ हो गई।');
    } finally { setSaving(false); }
  }

  if (loadingData) {
    return <p className="text-sm text-gray-400 py-4 text-center">लोड हो रहा है…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Crop */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {NC.cropLabel} <span className="text-red-500">*</span>
        </label>
        <input
          type="text" value={crop}
          onChange={e => setCrop(e.target.value)}
          placeholder={NC.cropPlaceholder}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                     focus:outline-none focus:ring-2 focus:ring-orange-400"
          lang="hi"
        />
      </div>

      {/* Variety */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {NC.varietyLabel}
        </label>
        <input
          type="text" value={variety}
          onChange={e => setVariety(e.target.value)}
          placeholder={NC.varietyPlaceholder}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                     focus:outline-none focus:ring-2 focus:ring-orange-400"
          translate="no" autoComplete="off" spellCheck={false}
        />
        <p className="text-xs text-gray-400 mt-1">{NC.varietyNote}</p>
      </div>

      {/* Seed class */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {NC.seedClassLabel}
        </label>
        <select
          value={seedClass}
          onChange={e => { setSeedClass(e.target.value); setSeedClassCustom(''); }}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                     focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        >
          <option value="">— वैकल्पिक —</option>
          {SEED_CLASS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {seedClass === 'other' && (
          <input
            type="text" value={seedClassCustom}
            onChange={e => setSeedClassCustom(e.target.value)}
            placeholder={NC.seedClassPlaceholder}
            className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-orange-400"
            lang="hi"
          />
        )}
      </div>

      {/* Seed stage */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {NC.seedStageLabel}
        </label>
        <select
          value={seedStage}
          onChange={e => { setSeedStage(e.target.value); setSeedStageCustom(''); }}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                     focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        >
          <option value="">— वैकल्पिक —</option>
          {SEED_STAGE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {seedStage === 'other' && (
          <input
            type="text" value={seedStageCustom}
            onChange={e => setSeedStageCustom(e.target.value)}
            placeholder={NC.seedStagePlaceholder}
            className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-orange-400"
            lang="hi"
          />
        )}
      </div>

      {/* Sowing date */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {NC.sowingLabel} <span className="text-red-500">*</span>
        </label>
        <input
          type="date" value={sowDate}
          onChange={e => setSowDate(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                     focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Seed quantity */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {NC.seedQtyLabel}
        </label>
        <input
          type="number" min="0" step="0.1" value={seedQty}
          onChange={e => setSeedQty(e.target.value)}
          placeholder={NC.seedQtyPlaceholder}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                     focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Fields + acres */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {NC.fieldsLabel} <span className="text-red-500">*</span>
        </label>

        {selectedFields.length > 0 && (
          <div className="space-y-2 mb-3">
            {selectedFields.map(sf => (
              <div key={sf.field_id}
                   className="flex items-center gap-2 bg-orange-50 border border-orange-200
                              rounded-xl px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold font-mono text-gray-900">{sf.field_id}</p>
                  {sf.name && sf.name !== sf.field_id && (
                    <p className="text-xs text-gray-400 leading-tight">{sf.name}</p>
                  )}
                </div>
                <input
                  type="number" min="0.01" step="0.01" value={sf.allocated_acres}
                  onChange={e => setAcres(sf.field_id, e.target.value)}
                  placeholder={NC.fieldAcresPlaceholder}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm
                             text-right focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <span className="text-xs text-gray-400 shrink-0">एकड़</span>
                <button type="button" onClick={() => removeField(sf.field_id)}
                        className="text-gray-400 hover:text-red-500 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {totalAcres > 0 && (
              <p className="text-xs font-semibold text-orange-700 text-right">
                {NC.totalAcres(totalAcres.toFixed(2))}
              </p>
            )}
          </div>
        )}

        {availableFields.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableFields.map(f => (
              <button key={f.field_id} type="button" onClick={() => addField(f)}
                      className="px-3 py-1.5 rounded-xl text-sm border border-gray-300
                                 bg-white hover:border-orange-400 hover:bg-orange-50
                                 transition text-left">
                <span className="font-bold font-mono text-gray-800">+ {f.field_id}</span>
                {f.name && f.name !== f.field_id && (
                  <span className="block text-[10px] text-gray-400 leading-tight">{f.name}</span>
                )}
              </button>
            ))}
          </div>
        ) : selectedFields.length > 0 ? (
          <p className="text-xs text-gray-400">सभी खेत जोड़े गए</p>
        ) : (
          <p className="text-xs text-gray-400">कोई खेत नहीं मिला</p>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit" disabled={saving}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50
                     text-white font-bold rounded-2xl py-3 text-sm transition"
        >
          {saving ? S.savingCycle : S.saveCycle}
        </button>
        <button
          type="button" onClick={onCancel}
          className="px-4 text-sm text-gray-500 hover:text-gray-700 border border-gray-300
                     rounded-2xl py-2 bg-white transition"
        >
          {TC.cancelForm}
        </button>
      </div>
    </form>
  );
}

// ── TaskForm — create or edit a task ──────────────────────────────────────────
function TaskForm({ cycleId, cycleFields = [], fieldNameMap = {}, initial = null, onSave, onCancel }) {
  const isEdit = Boolean(initial);

  const [tipanni,     setTipanni]     = useState(initial?.short_description ?? '');
  const [varnan,      setVarnan]      = useState(initial?.description ?? '');
  // Multi-select field IDs — seed from task_fields (new) or field_id (legacy)
  const [fieldIds,    setFieldIds]    = useState(() => {
    if (initial?.task_fields?.length) return initial.task_fields.map(tf => tf.field_id);
    if (initial?.field_id)            return [initial.field_id];
    if (cycleFields.length > 0)       return [cycleFields[0].field_id]; // default first on create
    return [];
  });
  const [category,    setCategory]    = useState(initial?.category ?? '');
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? '');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const subcatOptions = TASK_SUBCATEGORIES[category] ?? [];

  function toggleField(fid) {
    setFieldIds(prev =>
      prev.includes(fid) ? prev.filter(id => id !== fid) : [...prev, fid]
    );
  }

  function handleCategoryChange(val) {
    setCategory(val);
    setSubcategory('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!tipanni.trim())      { setError(TC.errors.tipanni);  return; }
    if (fieldIds.length === 0){ setError(TC.errors.field);    return; }
    if (!category)            { setError(TC.errors.category); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        short_description: tipanni.trim(),
        description:       varnan.trim() || null,
        field_ids:         fieldIds,
        category,
        subcategory:       subcategory || null,
      };
      if (isEdit) {
        await cropCycleAPI.updateTask(cycleId, initial.task_id, payload);
      } else {
        await cropCycleAPI.createTask(cycleId, payload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.detail || 'कुछ गड़बड़ हो गई।');
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit}
          className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-4 space-y-3">
      {/* tipanni */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {TC.tipanniLabel} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={tipanni}
          onChange={e => setTipanni(e.target.value)}
          placeholder={TC.tipanniPlaceholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-orange-400"
          lang="hi"
          autoFocus
        />
      </div>

      {/* category + subcategory — two column row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {TC.categoryLabel} <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={e => handleCategoryChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="">{TC.categoryPlaceholder}</option>
            {Object.entries(TASK_CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {TC.subcategoryLabel}
          </label>
          <select
            value={subcategory}
            onChange={e => setSubcategory(e.target.value)}
            disabled={!category || subcatOptions.length === 0}
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white
                       disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">{TC.subcategoryPlaceholder}</option>
            {subcatOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* varnan */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {TC.varnanLabel}
        </label>
        <input
          type="text"
          value={varnan}
          onChange={e => setVarnan(e.target.value)}
          placeholder={TC.varnanPlaceholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-orange-400"
          lang="hi"
        />
      </div>

      {/* field multi-picker — toggle chips, one or more */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {TC.fieldLabel} <span className="text-red-500">*</span>
        </label>
        {cycleFields.length === 0 ? (
          <p className="text-xs text-gray-400">{TC.fieldNone}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cycleFields.map(f => {
              const selected = fieldIds.includes(f.field_id);
              return (
                <button
                  key={f.field_id} type="button"
                  onClick={() => toggleField(f.field_id)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition text-left
                    ${selected
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-400'}`}
                >
                  <span className="font-bold font-mono">
                    {selected ? '✓ ' : ''}{f.field_id}
                  </span>
                  {f.allocated_acres ? <span className="opacity-75"> · {f.allocated_acres}एकड़</span> : ''}
                  {fieldNameMap[f.field_id] && fieldNameMap[f.field_id] !== f.field_id && (
                    <span className={`block text-[10px] leading-tight mt-0.5 ${selected ? 'opacity-80' : 'text-gray-400'}`}>
                      {fieldNameMap[f.field_id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit" disabled={saving}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50
                     text-white text-sm font-semibold rounded-xl py-2 transition"
        >
          {saving ? TC.savingTask : (isEdit ? TC.updateTask : TC.saveTask)}
        </button>
        <button
          type="button" onClick={onCancel}
          className="px-4 text-sm text-gray-500 hover:text-gray-700 border border-gray-300
                     rounded-xl py-2 bg-white transition"
        >
          {TC.cancelForm}
        </button>
      </div>
    </form>
  );
}

// ── WOForm — create (with simpler cost) or edit (description only) ────────────
function WOForm({ taskId, initial = null, workers = [], onSave, onCancel }) {
  const isEdit = Boolean(initial);

  const [tipanni,    setTipanni]    = useState(initial?.short_description ?? '');
  const [varnan,     setVarnan]     = useState(initial?.description ?? '');
  const [assignedTo, setAssignedTo] = useState(initial?.assigned_to ?? '');
  // Cost mode: simple = one ₹ total; detail = resource line breakdown
  const [showDetail, setShowDetail] = useState(false);
  const [simpleCost, setSimpleCost] = useState('');
  const [resources,  setResources]  = useState([emptyResLine()]);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const liveTotal = resources.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0);
  const { formatted: liveTotalFmt } = formatMoney(liveTotal);

  function toggleDetail() {
    if (!showDetail) {
      // Entering detail mode: seed the first resource line with the simple cost amount
      const seed = parseFloat(simpleCost) > 0
        ? [{ name: 'अन्य खर्च', resource_type: 'other', cost: simpleCost }]
        : [emptyResLine()];
      setResources(seed);
      setShowDetail(true);
    } else {
      // Collapsing back to simple: sync simpleCost from current live total
      if (liveTotal > 0) setSimpleCost(String(liveTotal));
      setShowDetail(false);
    }
  }

  function updateRes(idx, field, val) {
    setResources(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!tipanni.trim()) { setError(TC.woErrors.tipanni); return; }

    if (!isEdit) {
      // Build the resource list to POST
      let resToPost;
      if (!showDetail) {
        if (!(parseFloat(simpleCost) > 0)) { setError(TC.woErrors.simpleCost); return; }
        resToPost = [{ name: 'अन्य खर्च', resource_type: 'other', cost: parseFloat(simpleCost) }];
      } else {
        if (resources.length === 0) { setError(TC.woErrors.resource); return; }
        for (const r of resources) {
          if (!r.name.trim())            { setError(TC.woErrors.resName); return; }
          if (!(parseFloat(r.cost) > 0)) { setError(TC.woErrors.resCost); return; }
        }
        resToPost = resources.map(r => ({
          name:                 r.name.trim(),
          resource_type:        r.resource_type,
          resource_type_custom: r.resource_type === 'other' ? (r.resource_type_custom?.trim() || null) : null,
          cost:                 parseFloat(r.cost),
        }));
      }

      setSaving(true); setError('');
      try {
        const woRes = await cropCycleAPI.createWorkOrder(taskId, {
          short_description: tipanni.trim(),
          description:       varnan.trim() || null,
        });
        const woId = woRes.data.work_order_id;
        for (const r of resToPost) {
          await cropCycleAPI.createWorkOrderResource(woId, r);
        }
        if (assignedTo) {
          await woActionsAPI.assign(woId, assignedTo);
        }
        onSave();
      } catch (err) {
        setError(err.response?.data?.detail || 'कुछ गड़बड़ हो गई।');
      } finally { setSaving(false); }
    } else {
      // Edit: patch description fields + re-assign worker if changed
      setSaving(true); setError('');
      try {
        await cropCycleAPI.updateWorkOrder(taskId, initial.work_order_id, {
          short_description: tipanni.trim(),
          description:       varnan.trim() || null,
        });
        if (assignedTo !== (initial.assigned_to ?? '')) {
          if (assignedTo) {
            await woActionsAPI.assign(initial.work_order_id, assignedTo);
          }
        }
        onSave();
      } catch (err) {
        setError(err.response?.data?.detail || 'कुछ गड़बड़ हो गई।');
      } finally { setSaving(false); }
    }
  }

  return (
    <form onSubmit={handleSubmit}
          className="bg-green-50 border border-green-200 rounded-xl px-4 py-4 space-y-3">
      {/* tipanni */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {TC.woTipanniLabel} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={tipanni}
          onChange={e => setTipanni(e.target.value)}
          placeholder={TC.woTipanniPlaceholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-500"
          lang="hi"
          autoFocus
        />
      </div>

      {/* varnan */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {TC.varnanLabel}
        </label>
        <input
          type="text"
          value={varnan}
          onChange={e => setVarnan(e.target.value)}
          placeholder={TC.varnanPlaceholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-500"
          lang="hi"
        />
      </div>

      {/* Worker assignment */}
      {workers.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {TC.workerLabel}
          </label>
          <select
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">{TC.workerNone}</option>
            {workers.filter(w => w.active).map(w => (
              <option key={w.worker_id} value={w.worker_id}>{w.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Cost section — only on create */}
      {!isEdit && (
        <div>
          {/* Row: label + toggle */}
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-600">
              {showDetail ? TC.resourcesLabel : TC.simpleCostLabel}
              {' '}<span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={toggleDetail}
              className="text-xs text-green-700 font-medium hover:text-green-900 underline"
            >
              {showDetail ? TC.collapseDetail : TC.expandDetail}
            </button>
          </div>

          {!showDetail ? (
            /* ── Simple mode: one ₹ input ── */
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <span className="text-gray-400 font-medium shrink-0">₹</span>
              <input
                type="number" inputMode="decimal" min="0"
                value={simpleCost}
                onChange={e => setSimpleCost(e.target.value)}
                placeholder={TC.simpleCostHint}
                className="flex-1 text-sm focus:outline-none bg-transparent"
              />
            </div>
          ) : (
            /* ── Detail mode: resource lines ── */
            <>
              <div className="space-y-3">
                {resources.map((res, idx) => (
                  <div key={idx}
                       className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {PREP_RESOURCE_TYPES.map(rt => (
                        <button
                          key={rt.value} type="button"
                          onClick={() => updateRes(idx, 'resource_type', rt.value)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition
                            ${res.resource_type === rt.value
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}
                        >
                          {rt.label}
                        </button>
                      ))}
                    </div>
                    {/* अन्य custom text when resource_type=other */}
                    {res.resource_type === 'other' && (
                      <input
                        type="text"
                        value={res.resource_type_custom || ''}
                        onChange={e => updateRes(idx, 'resource_type_custom', e.target.value)}
                        placeholder="क्या खर्च? (जैसे: पानी का टैंकर)"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs
                                   focus:outline-none focus:ring-1 focus:ring-green-400 bg-orange-50"
                        lang="hi"
                      />
                    )}
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={res.name}
                          onChange={e => updateRes(idx, 'name', e.target.value)}
                          placeholder={TC.resourceName}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                                     focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                          lang="hi"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm shrink-0">₹</span>
                          <input
                            type="number" inputMode="decimal" min="0"
                            value={res.cost}
                            onChange={e => updateRes(idx, 'cost', e.target.value)}
                            placeholder={TC.resourceCost}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                                       focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                          />
                        </div>
                      </div>
                      {resources.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setResources(prev => prev.filter((_, i) => i !== idx))}
                          className="mt-0.5 text-gray-300 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setResources(prev => [...prev, emptyResLine()])}
                className="mt-2 text-sm text-green-700 font-medium hover:text-green-800"
              >
                {TC.addResource}
              </button>
              {liveTotal > 0 && (
                <div className="flex justify-between items-center mt-3 rounded-xl
                                bg-green-50 border border-green-100 px-4 py-2.5">
                  <span className="text-sm font-semibold text-gray-700">{TC.liveTotal}</span>
                  <span className="text-base font-bold text-green-700 tabular-nums">
                    {liveTotalFmt}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit" disabled={saving}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50
                     text-white text-sm font-semibold rounded-xl py-2 transition"
        >
          {saving ? TC.savingWO : (isEdit ? TC.updateWO : TC.saveWO)}
        </button>
        <button
          type="button" onClick={onCancel}
          className="px-4 text-sm text-gray-500 hover:text-gray-700 border border-gray-300
                     rounded-xl py-2 bg-white transition"
        >
          {TC.cancelForm}
        </button>
      </div>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CycleDetailPage() {
  const { crop_cycle_id } = useParams();
  const navigate          = useNavigate();
  const location          = useLocation();
  const ctx               = location.state ?? {};

  // ── Core data ────────────────────────────────────────────────────────────────
  const [pnl,    setPnl]    = useState(null);
  const [detail, setDetail] = useState(null);
  const [sales,  setSales]  = useState([]);
  const [yields, setYields] = useState([]);
  const [tasks,  setTasks]  = useState([]);
  const [status, setStatus] = useState('loading');

  // ── Expand / collapse ────────────────────────────────────────────────────────
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [expandedWOs,   setExpandedWOs]   = useState(new Set());

  const toggleTask = (id) => setExpandedTasks(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleWO = (id) => setExpandedWOs(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // ── Task CRUD state ──────────────────────────────────────────────────────────
  const [showAddTask,     setShowAddTask]     = useState(false);
  const [editingTask,     setEditingTask]     = useState(null); // task obj from tasks-detail
  const [deletingTaskId,  setDeletingTaskId]  = useState(null);
  const [taskDelLoading,  setTaskDelLoading]  = useState(false);

  // ── WO CRUD state ────────────────────────────────────────────────────────────
  const [addingWoTaskId,  setAddingWoTaskId]  = useState(null); // task_id for new WO
  const [editingWO,       setEditingWO]       = useState(null); // {wo, taskId}
  const [deletingWOKey,   setDeletingWOKey]   = useState(null); // {woId, taskId}
  const [woDelLoading,    setWoDelLoading]    = useState(false);

  // ── Resource CRUD state ───────────────────────────────────────────────────────
  const [addingResWoId,   setAddingResWoId]   = useState(null);
  const [newResLine,      setNewResLine]      = useState(emptyResLine());
  const [newResError,     setNewResError]     = useState('');
  const [newResSaving,    setNewResSaving]    = useState(false);
  const [deletingRes,     setDeletingRes]     = useState(null); // {woId, resId}
  const [resDelLoading,   setResDelLoading]   = useState(false);

  // ── Task status inline change ────────────────────────────────────────────────
  const [statusingTaskId,   setStatusingTaskId]   = useState(null);
  const [taskStatusLoading, setTaskStatusLoading] = useState(false);

  // ── WO completion submit ─────────────────────────────────────────────────────
  const [completingWO,      setCompletingWO]      = useState(null); // {woId, taskId}
  const [completionComment, setCompletionComment] = useState('');
  const [completionSaving,  setCompletionSaving]  = useState(false);

  // ── WO close / reopen ────────────────────────────────────────────────────────
  const [closingWoId,    setClosingWoId]    = useState(null);
  const [closeLoading,   setCloseLoading]   = useState(false);
  const [reopeningWoId,  setReopeningWoId]  = useState(null);
  const [reopenLoading,  setReopenLoading]  = useState(false);
  // Send-back reason (pending_review → open with optional reason note)
  const [sendBackWoId,   setSendBackWoId]   = useState(null);
  const [sendBackReason, setSendBackReason] = useState('');
  const [sendBackLoading, setSendBackLoading] = useState(false);

  // ── Cycle edit ───────────────────────────────────────────────────────────────
  const [editingCycle,    setEditingCycle]    = useState(false);

  // ── Workers (for WO assignment) ───────────────────────────────────────────
  const [workers, setWorkers] = useState([]);

  // ── Field name map: {field_id → name} for ID-primary display ──────────────
  const [fieldNameMap, setFieldNameMap] = useState({});

  // ── Sales delete state ───────────────────────────────────────────────────────
  const [deletingId,      setDeletingId]      = useState(null);
  const [deleteLoading,   setDeleteLoading]   = useState(false);

  // ── Yields delete state ───────────────────────────────────────────────────────
  const [deletingYieldId, setDeletingYieldId]         = useState(null);
  const [deleteYieldLoading, setDeleteYieldLoading]   = useState(false);

  // ── Data fetch ───────────────────────────────────────────────────────────────
  const fetchAll = useCallback(() => {
    return Promise.all([
      api.get(`/crop-cycles/${crop_cycle_id}/pnl`),
      api.get(`/crop-cycles/${crop_cycle_id}`),
      api.get(`/sales?crop_cycle_id=${crop_cycle_id}`),
      api.get(`/yields?crop_cycle_id=${crop_cycle_id}`),
      cropCycleAPI.getTasksDetail(crop_cycle_id),
    ]).then(([pnlRes, detailRes, salesRes, yieldsRes, tasksRes]) => {
      setPnl(pnlRes.data);
      setDetail(detailRes.data);
      setSales(salesRes.data ?? []);
      setYields(yieldsRes.data ?? []);
      setTasks(tasksRes.data ?? []);
      setStatus('ok');
    }).catch(() => setStatus('error'));
  }, [crop_cycle_id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    workersAPI.list().then(r => setWorkers(r.data || [])).catch(() => {});
    fieldAPI.getAll().then(r => {
      const map = {};
      (r.data || []).forEach(f => { map[f.field_id] = f.name || f.field_id; });
      setFieldNameMap(map);
    }).catch(() => {});
  }, []);

  // ── Task handlers ─────────────────────────────────────────────────────────────
  async function handleDeleteTask(taskId) {
    setTaskDelLoading(true);
    try {
      await cropCycleAPI.deleteTask(crop_cycle_id, taskId);
      setDeletingTaskId(null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail?.message || 'हटाने में गड़बड़ हो गई।');
    } finally { setTaskDelLoading(false); }
  }

  // ── WO handlers ──────────────────────────────────────────────────────────────
  async function handleDeleteWO(taskId, woId) {
    setWoDelLoading(true);
    try {
      await cropCycleAPI.deleteWorkOrder(taskId, woId);
      setDeletingWOKey(null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail || 'हटाने में गड़बड़ हो गई।');
    } finally { setWoDelLoading(false); }
  }

  // ── Resource handlers ─────────────────────────────────────────────────────────
  async function handleAddResource(woId) {
    if (!newResLine.name.trim())           { setNewResError(TC.woErrors.resName); return; }
    if (!(parseFloat(newResLine.cost) > 0)){ setNewResError(TC.woErrors.resCost); return; }
    setNewResSaving(true); setNewResError('');
    try {
      await cropCycleAPI.createWorkOrderResource(woId, {
        name:                 newResLine.name.trim(),
        resource_type:        newResLine.resource_type,
        resource_type_custom: newResLine.resource_type === 'other'
          ? (newResLine.resource_type_custom?.trim() || null) : null,
        cost:                 parseFloat(newResLine.cost),
      });
      setAddingResWoId(null);
      setNewResLine(emptyResLine());
      fetchAll();
    } catch { setNewResError('कुछ गड़बड़ हो गई।'); }
    finally { setNewResSaving(false); }
  }

  async function handleDeleteResource(woId, resId) {
    setResDelLoading(true);
    try {
      await cropCycleAPI.deleteWorkOrderResource(woId, resId);
      setDeletingRes(null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail || 'हटाने में गड़बड़ हो गई।');
    } finally { setResDelLoading(false); }
  }

  // ── Task status change ────────────────────────────────────────────────────────
  async function handleTaskStatusChange(taskId, newStatus) {
    setTaskStatusLoading(true);
    try {
      await cropCycleAPI.updateTask(crop_cycle_id, taskId, { status: newStatus });
      setStatusingTaskId(null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail || 'स्थिति बदलने में गड़बड़ हो गई।');
    } finally { setTaskStatusLoading(false); }
  }

  // ── WO completion submit ──────────────────────────────────────────────────────
  async function handleSubmitCompletion(woId) {
    if (!completionComment.trim()) { alert(TC.completionRequired); return; }
    setCompletionSaving(true);
    try {
      await woActionsAPI.submitCompletion(woId, completionComment.trim());
      setCompletingWO(null);
      setCompletionComment('');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail || 'सबमिट करने में गड़बड़ हो गई।');
    } finally { setCompletionSaving(false); }
  }

  // ── WO close ──────────────────────────────────────────────────────────────────
  async function handleCloseWO(woId) {
    setClosingWoId(woId);
    setCloseLoading(true);
    try {
      await woActionsAPI.close(woId);
      setClosingWoId(null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail || 'बंद करने में गड़बड़ हो गई।');
    } finally { setCloseLoading(false); }
  }

  // ── WO send-back (pending_review → open, with optional reason note) ──────────
  async function handleSendBack(woId) {
    setSendBackLoading(true);
    try {
      await woActionsAPI.reopen(woId, { reason: sendBackReason.trim() || undefined });
      setSendBackWoId(null);
      setSendBackReason('');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail || 'वापस भेजने में गड़बड़ हो गई।');
    } finally { setSendBackLoading(false); }
  }

  // ── WO reopen from closed (no reason needed) ──────────────────────────────────
  async function handleReopenClosed(woId) {
    setReopeningWoId(woId);
    setReopenLoading(true);
    try {
      await woActionsAPI.reopen(woId, {});
      setReopeningWoId(null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail || 'खोलने में गड़बड़ हो गई।');
    } finally { setReopenLoading(false); }
  }

  // ── Sale handlers ─────────────────────────────────────────────────────────────
  async function handleDelete(saleId) {
    setDeleteLoading(true);
    try {
      await api.delete(`/sales/${saleId}`);
      setSales(prev => prev.filter(s => s.sale_id !== saleId));
      api.get(`/crop-cycles/${crop_cycle_id}/pnl`).then(r => setPnl(r.data)).catch(() => {});
    } finally { setDeleteLoading(false); setDeletingId(null); }
  }

  async function handleDeleteYield(yieldId) {
    setDeleteYieldLoading(true);
    try {
      await api.delete(`/yields/${yieldId}`);
      setYields(prev => prev.filter(y => y.yield_id !== yieldId));
    } finally { setDeleteYieldLoading(false); setDeletingYieldId(null); }
  }

  // ── Guard states ──────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        <div className="h-8 w-40 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-16 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 text-center">
        <p className="text-red-600">कुछ गड़बड़ हो गई।</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-gray-500 underline">
          {S.back}
        </button>
      </div>
    );
  }

  // ── Derived display ───────────────────────────────────────────────────────────
  const season      = pnl.season      ?? ctx.season      ?? '';
  const crop_year   = ctx.crop_year   ?? null;
  const crop_name   = pnl.crop_name   ?? ctx.crop_name   ?? '';
  const seed_cat    = pnl.seed_category ?? ctx.seed_category ?? '';

  const seasonHindi = SEASONS[season] ?? season;
  const seasonLabel = crop_year ? `${seasonHindi} ${crop_year}` : seasonHindi;

  const backPath    = crop_year && season
    ? `/season/${season}/${crop_year}`
    : '/seasons';

  const revenue   = pnl.revenue        ?? 0;
  const cropCost  = pnl.crop_cost      ?? 0;
  const prepAlloc = pnl.prep_allocated ?? 0;
  const profit    = pnl.profit         ?? 0;

  const { formatted: revFmt  } = formatMoney(revenue);
  const { formatted: costFmt } = formatMoney(cropCost);
  const { formatted: prepFmt } = formatMoney(prepAlloc);

  const fieldCode   = detail?.field_code;
  const area        = detail?.cultivated_area;
  const cycleFields = detail?.cycle_fields ?? [];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-10 md:pt-8">

      {/* Back */}
      <button
        onClick={() => navigate(backPath)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {seasonLabel} › {crop_name}
      </button>

      {/* Page title + cycle edit */}
      {editingCycle ? (
        <div className="mb-6 rounded-2xl bg-white border border-orange-200 shadow-sm px-6 py-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">{S.editCycleTitle}</h2>
          <CycleEditForm
            cycleId={crop_cycle_id}
            initial={detail}
            initialCycleFields={cycleFields}
            onSave={() => { setEditingCycle(false); fetchAll(); }}
            onCancel={() => setEditingCycle(false)}
          />
        </div>
      ) : (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{crop_name}</h1>
            {seed_cat && (
              <p className="text-sm text-gray-400 mt-0.5 font-mono">{seed_cat} · {seasonLabel}</p>
            )}
          </div>
          <button
            onClick={() => setEditingCycle(true)}
            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded
                       hover:bg-blue-50 border border-blue-200 transition-colors flex-shrink-0 mt-1"
          >
            {S.editCycle}
          </button>
        </div>
      )}

      {/* ── P&L HERO ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm px-6 py-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          {S.pnlTitle}
        </p>
        <ProfitDisplay amount={profit} large revenue={revenue} cost={cropCost + prepAlloc} />
        <div className="border-t border-gray-100 mt-4 pt-1">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">{S.revenue}</span>
            <span className={`text-sm tabular-nums ${revenue > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {revFmt}
            </span>
          </div>
          {cropCost > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{S.cropCost}</span>
              <span className="text-sm tabular-nums text-red-600">{costFmt}</span>
            </div>
          )}
          {prepAlloc > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{S.prepCost}</span>
              <span className="text-sm tabular-nums text-red-600">{prepFmt}</span>
            </div>
          )}
          <div className="border-t border-gray-200 mt-1 pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-900">
              {profit >= 0 ? S.profit : S.loss}
            </span>
            <ProfitDisplay amount={profit} />
          </div>
        </div>
      </div>

      {/* ── FIELDS ───────────────────────────────────────────────────────────── */}
      <Section title={S.fieldsHeading}>
        {cycleFields.length === 0 ? (
          <p className="text-sm text-gray-400 py-3">—</p>
        ) : (
          <>
            {cycleFields.map(f => (
              <div key={f.field_id} className="flex justify-between items-center py-2.5">
                <div>
                  <p className="text-sm font-bold font-mono text-gray-900">{f.field_id}</p>
                  {fieldNameMap[f.field_id] && fieldNameMap[f.field_id] !== f.field_id && (
                    <p className="text-xs text-gray-400">{fieldNameMap[f.field_id]}</p>
                  )}
                </div>
                {f.allocated_acres != null && Number(f.allocated_acres) > 0 && (
                  <span className="text-sm text-gray-500">{S.acres(Number(f.allocated_acres))}</span>
                )}
              </div>
            ))}
            {cycleFields.length > 1 && (() => {
              const tot = cycleFields.reduce((s, f) => s + (Number(f.allocated_acres) || 0), 0);
              return tot > 0 ? (
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-xs font-semibold text-gray-500">कुल</span>
                  <span className="text-xs font-semibold text-gray-700">{S.acres(tot)}</span>
                </div>
              ) : null;
            })()}
          </>
        )}
      </Section>

      {/* ── TASKS (2a display + 2b CRUD) ─────────────────────────────────────── */}
      <div className="mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
          {S.tasksHeading}
        </h2>

        <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">

          {tasks.length === 0 && !showAddTask ? (
            <p className="text-sm text-gray-400 px-4 py-3">{S.noTasks}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {tasks.map((task) => {
                const isEditing  = editingTask?.task_id === task.task_id;
                const isDeleting = deletingTaskId === task.task_id;
                const tExpanded  = expandedTasks.has(task.task_id);
                const tStatus    = TASK_STATUSES[task.status]        ?? task.status;
                const tColor     = TASK_STATUS_COLORS[task.status]   ?? 'bg-gray-100 text-gray-700';
                const { formatted: tCostFmt } = formatMoney(task.task_cost);

                return (
                  <div key={task.task_id}>

                    {/* ── Edit form inline ──────────────────────────────────── */}
                    {isEditing ? (
                      <div className="px-4 py-3">
                        <TaskForm
                          cycleId={crop_cycle_id}
                          cycleFields={cycleFields}
                          fieldNameMap={fieldNameMap}
                          initial={editingTask}
                          onSave={() => { setEditingTask(null); fetchAll(); }}
                          onCancel={() => setEditingTask(null)}
                        />
                      </div>
                    ) : (
                      <>
                        {/* ── Task row ────────────────────────────────────── */}
                        <div className="flex items-center px-4 py-3 hover:bg-gray-50">
                          {/* expand/collapse toggle */}
                          <button
                            onClick={() => toggleTask(task.task_id)}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left"
                          >
                            {tExpanded
                              ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            }
                            <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                              {task.task_number}
                            </span>
                            {/* field chips — compact, ID bold + name tooltip via title */}
                            {task.task_fields?.map(tf => (
                              <span key={tf.field_id}
                                    title={fieldNameMap[tf.field_id] || tf.field_id}
                                    className="text-xs font-bold font-mono bg-orange-50
                                               text-orange-600 border border-orange-200
                                               px-1.5 py-0.5 rounded flex-shrink-0">
                                {tf.field_id}
                              </span>
                            ))}
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {task.short_description}
                            </span>
                            {/* status badge — tappable to open inline status picker */}
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setStatusingTaskId(
                                  statusingTaskId === task.task_id ? null : task.task_id
                                );
                              }}
                              className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0
                                         border border-transparent hover:border-blue-300 transition ${tColor}`}
                              title={TC.changeStatus}
                            >
                              {tStatus}
                            </button>
                            {/* severity badge */}
                            {task.severity && SEVERITY_BADGES[task.severity] && (
                              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0
                                               ${SEVERITY_BADGES[task.severity].cls}`}>
                                {SEVERITY_BADGES[task.severity].label}
                              </span>
                            )}
                          </button>
                          {/* cost */}
                          {task.task_cost > 0 && (
                            <span className="text-sm font-semibold text-red-600 tabular-nums mx-2 flex-shrink-0">
                              {tCostFmt}
                            </span>
                          )}
                          {/* edit/delete buttons */}
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => { setEditingTask(task); setShowAddTask(false); setStatusingTaskId(null); }}
                              className="text-xs text-blue-600 hover:text-blue-800 px-1.5 py-0.5
                                         rounded hover:bg-blue-50 transition-colors"
                            >
                              {TC.editTask}
                            </button>
                            <button
                              onClick={() => setDeletingTaskId(task.task_id)}
                              className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5
                                         rounded hover:bg-red-50 transition-colors"
                            >
                              {TC.deleteTask}
                            </button>
                          </div>
                        </div>

                        {/* ── Inline status picker ──────────────────────────── */}
                        {statusingTaskId === task.task_id && (
                          <div className="flex flex-wrap items-center gap-1.5 bg-blue-50
                                          border-t border-blue-100 px-4 py-2.5">
                            <span className="text-xs text-gray-500 font-medium shrink-0 mr-1">
                              {TC.changeStatus}:
                            </span>
                            {Object.entries(TASK_STATUSES).map(([val, label]) => (
                              <button
                                key={val}
                                type="button"
                                disabled={taskStatusLoading || task.status === val}
                                onClick={() => handleTaskStatusChange(task.task_id, val)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition
                                  disabled:opacity-60
                                  ${task.status === val
                                    ? `${TASK_STATUS_COLORS[val] ?? ''} ring-1 ring-blue-500`
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
                              >
                                {taskStatusLoading && task.status === val ? TC.statusSaving : label}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setStatusingTaskId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600 ml-1"
                            >
                              {TC.statusCancel}
                            </button>
                          </div>
                        )}

                        {/* ── Delete confirm ────────────────────────────────── */}
                        {isDeleting && (
                          <div className="flex items-center justify-between bg-red-50
                                          border-t border-red-100 px-4 py-2.5 gap-3">
                            <span className="text-sm text-red-700 font-medium">
                              {TC.deleteTaskConfirm}
                            </span>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleDeleteTask(task.task_id)}
                                disabled={taskDelLoading}
                                className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700
                                           px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                              >
                                {TC.deleteTaskYes}
                              </button>
                              <button
                                onClick={() => setDeletingTaskId(null)}
                                disabled={taskDelLoading}
                                className="text-xs font-semibold text-gray-600 bg-white border
                                           border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
                              >
                                {TC.deleteNo}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── WO list (expanded) ───────────────────────────────── */}
                    {tExpanded && !isEditing && (
                      <div className="bg-gray-50 border-t border-gray-100">

                        {task.work_orders.length === 0 && addingWoTaskId !== task.task_id ? (
                          <p className="text-xs text-gray-400 px-10 py-2">
                            कोई वर्क ऑर्डर नहीं
                          </p>
                        ) : (
                          task.work_orders.map((wo) => {
                            const isEditingWO  = editingWO?.wo.work_order_id === wo.work_order_id;
                            const isDeletingWO = deletingWOKey?.woId === wo.work_order_id;
                            const wExpanded    = expandedWOs.has(wo.work_order_id);
                            const wStatus      = WO_STATUSES[wo.status]      ?? wo.status;
                            const wColor       = WO_STATUS_COLORS[wo.status] ?? 'bg-gray-100 text-gray-700';
                            const { formatted: wCostFmt } = formatMoney(wo.wo_cost);

                            return (
                              <div key={wo.work_order_id}
                                   className="border-b border-gray-100 last:border-b-0">

                                {/* WO edit form */}
                                {isEditingWO ? (
                                  <div className="px-10 py-3">
                                    <WOForm
                                      taskId={editingWO.taskId}
                                      initial={wo}
                                      workers={workers}
                                      onSave={() => { setEditingWO(null); fetchAll(); }}
                                      onCancel={() => setEditingWO(null)}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    {/* WO row */}
                                    <div className="flex items-center pl-10 pr-4 py-2.5 hover:bg-gray-100">
                                      <button
                                        onClick={() => toggleWO(wo.work_order_id)}
                                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                      >
                                        {wExpanded
                                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                          : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        }
                                        <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                                          {wo.work_order_number}
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${wColor}`}>
                                          {wStatus}
                                        </span>
                                        {wo.assigned_worker && (
                                          <span className="text-xs text-gray-500 truncate">
                                            → {wo.assigned_worker}
                                          </span>
                                        )}
                                      </button>
                                      {wo.wo_cost > 0 && (
                                        <span className="text-xs font-semibold text-red-500 tabular-nums mx-2 flex-shrink-0">
                                          {wCostFmt}
                                        </span>
                                      )}
                                      {/* Context-aware action buttons */}
                                      {wo.status === 'pending_review' ? (
                                        <div className="flex gap-1 flex-shrink-0">
                                          <button
                                            onClick={() => handleCloseWO(wo.work_order_id)}
                                            disabled={closeLoading && closingWoId === wo.work_order_id}
                                            className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700
                                                       px-2 py-0.5 rounded-lg transition disabled:opacity-60"
                                          >
                                            {closeLoading && closingWoId === wo.work_order_id ? TC.closingWO : TC.closeWO}
                                          </button>
                                          <button
                                            onClick={() => { setSendBackWoId(wo.work_order_id); setSendBackReason(''); }}
                                            className="text-xs font-semibold text-orange-700 bg-white border border-orange-300
                                                       hover:bg-orange-50 px-2 py-0.5 rounded-lg transition"
                                          >
                                            {TC.reopenWO}
                                          </button>
                                        </div>
                                      ) : wo.status === 'closed' ? (
                                        <div className="flex gap-1 flex-shrink-0">
                                          <button
                                            onClick={() => handleReopenClosed(wo.work_order_id)}
                                            disabled={reopenLoading && reopeningWoId === wo.work_order_id}
                                            className="text-xs font-semibold text-gray-600 bg-white border border-gray-300
                                                       hover:bg-gray-50 px-2 py-0.5 rounded-lg transition disabled:opacity-60"
                                          >
                                            {reopenLoading && reopeningWoId === wo.work_order_id ? TC.reopeningClosed : TC.reopenClosed}
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex gap-1 flex-shrink-0">
                                          <button
                                            onClick={() => setEditingWO({ wo, taskId: task.task_id })}
                                            className="text-xs text-blue-600 hover:text-blue-800 px-1.5 py-0.5
                                                       rounded hover:bg-blue-50 transition-colors"
                                          >
                                            {TC.editWO}
                                          </button>
                                          <button
                                            onClick={() => setDeletingWOKey({ woId: wo.work_order_id, taskId: task.task_id })}
                                            className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5
                                                       rounded hover:bg-red-50 transition-colors"
                                          >
                                            {TC.deleteWO}
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Send-back reason form (pending_review only) */}
                                    {sendBackWoId === wo.work_order_id && (
                                      <div className="pl-10 pr-4 py-3 bg-orange-50 border-t border-orange-100 space-y-2">
                                        <p className="text-xs font-semibold text-orange-800">
                                          {TC.sendBackReasonLabel}
                                        </p>
                                        <input
                                          type="text"
                                          value={sendBackReason}
                                          onChange={e => setSendBackReason(e.target.value)}
                                          onKeyDown={e => { if (e.key === 'Enter') handleSendBack(wo.work_order_id); if (e.key === 'Escape') { setSendBackWoId(null); setSendBackReason(''); } }}
                                          placeholder={TC.sendBackReasonPlaceholder}
                                          className="w-full rounded-lg border border-orange-200 px-3 py-1.5 text-xs
                                                     bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                                          lang="hi"
                                          autoFocus
                                        />
                                        <p className="text-xs text-orange-500">{TC.sendBackReasonHint}</p>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleSendBack(wo.work_order_id)}
                                            disabled={sendBackLoading}
                                            className="text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600
                                                       px-3 py-1.5 rounded-lg disabled:opacity-60 transition"
                                          >
                                            {sendBackLoading ? '…' : TC.sendBackSubmit}
                                          </button>
                                          <button
                                            onClick={() => { setSendBackWoId(null); setSendBackReason(''); }}
                                            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5
                                                       rounded-lg border border-gray-200 bg-white"
                                          >
                                            {TC.cancelForm}
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* WO delete confirm */}
                                    {isDeletingWO && (
                                      <div className="flex items-center justify-between bg-red-50
                                                      pl-10 pr-4 py-2 gap-3 border-t border-red-100">
                                        <span className="text-xs text-red-700 font-medium">
                                          {TC.deleteWOConfirm}
                                        </span>
                                        <div className="flex gap-2 flex-shrink-0">
                                          <button
                                            onClick={() => handleDeleteWO(task.task_id, wo.work_order_id)}
                                            disabled={woDelLoading}
                                            className="text-xs font-semibold text-white bg-red-600
                                                       hover:bg-red-700 px-3 py-1 rounded-lg
                                                       disabled:opacity-60"
                                          >
                                            {TC.deleteWOYes}
                                          </button>
                                          <button
                                            onClick={() => setDeletingWOKey(null)}
                                            disabled={woDelLoading}
                                            className="text-xs text-gray-600 bg-white border border-gray-300
                                                       hover:bg-gray-50 px-3 py-1 rounded-lg"
                                          >
                                            {TC.deleteNo}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}

                                {/* Resources + completion flow (WO expanded) */}
                                {wExpanded && !isEditingWO && (
                                  <div className="pl-16 pr-4 pb-2 pt-1">
                                    {wo.resources.length === 0 && addingResWoId !== wo.work_order_id ? (
                                      <p className="text-xs text-gray-400 py-1">कोई लागत नहीं</p>
                                    ) : (
                                      <div className="divide-y divide-gray-100">
                                        {wo.resources.map((r) => {
                                          const rType = r.resource_type === 'other' && r.resource_type_custom
                                            ? r.resource_type_custom
                                            : (RESOURCE_TYPES[r.resource_type] ?? r.resource_type ?? '—');
                                          const { formatted: rCostFmt } = formatMoney(r.cost ?? 0);
                                          const isDeletingThisRes =
                                            deletingRes?.woId === wo.work_order_id &&
                                            deletingRes?.resId === r.resource_id;

                                          return (
                                            <div key={r.resource_id}>
                                              <div className="flex items-center justify-between py-1.5 gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">
                                                    {rType}
                                                  </span>
                                                  <span className="text-xs text-gray-700 truncate">
                                                    {r.name || '—'}
                                                  </span>
                                                  {r.qty != null && r.unit && (
                                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                                      {r.qty} {r.unit}
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                  <span className="text-xs font-medium text-gray-700 tabular-nums">
                                                    {rCostFmt}
                                                  </span>
                                                  <button
                                                    onClick={() => setDeletingRes({ woId: wo.work_order_id, resId: r.resource_id })}
                                                    className="text-xs text-red-400 hover:text-red-600 px-1 py-0.5
                                                               rounded hover:bg-red-50 transition-colors"
                                                  >
                                                    {TC.deleteRes}
                                                  </button>
                                                </div>
                                              </div>
                                              {isDeletingThisRes && (
                                                <div className="flex items-center justify-between
                                                                bg-red-50 rounded px-2 py-1.5 mb-1 gap-3">
                                                  <span className="text-xs text-red-700">{TC.deleteResConfirm}</span>
                                                  <div className="flex gap-1.5">
                                                    <button
                                                      onClick={() => handleDeleteResource(wo.work_order_id, r.resource_id)}
                                                      disabled={resDelLoading}
                                                      className="text-xs font-semibold text-white bg-red-600
                                                                 hover:bg-red-700 px-2.5 py-1 rounded-lg disabled:opacity-60"
                                                    >
                                                      {TC.deleteResYes}
                                                    </button>
                                                    <button
                                                      onClick={() => setDeletingRes(null)}
                                                      className="text-xs text-gray-600 bg-white border border-gray-300
                                                                 hover:bg-gray-50 px-2.5 py-1 rounded-lg"
                                                    >
                                                      {TC.deleteNo}
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Add resource to existing WO */}
                                    {addingResWoId === wo.work_order_id ? (
                                      <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                                        <div className="flex flex-wrap gap-1.5">
                                          {PREP_RESOURCE_TYPES.map(rt => (
                                            <button
                                              key={rt.value} type="button"
                                              onClick={() => setNewResLine(p => ({...p, resource_type: rt.value, resource_type_custom: ''}))}
                                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition
                                                ${newResLine.resource_type === rt.value
                                                  ? 'bg-green-600 text-white border-green-600'
                                                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}
                                            >
                                              {rt.label}
                                            </button>
                                          ))}
                                        </div>
                                        {newResLine.resource_type === 'other' && (
                                          <input
                                            type="text"
                                            value={newResLine.resource_type_custom || ''}
                                            onChange={e => setNewResLine(p => ({...p, resource_type_custom: e.target.value}))}
                                            placeholder="क्या खर्च? (जैसे: पानी का टैंकर)"
                                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs
                                                       focus:outline-none focus:ring-1 focus:ring-green-400 bg-orange-50"
                                            lang="hi"
                                          />
                                        )}
                                        <input
                                          type="text"
                                          value={newResLine.name}
                                          onChange={e => setNewResLine(p => ({...p, name: e.target.value}))}
                                          placeholder={TC.resourceName}
                                          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs
                                                     focus:outline-none focus:ring-2 focus:ring-green-400"
                                          lang="hi"
                                        />
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-400">₹</span>
                                          <input
                                            type="number" inputMode="decimal" min="0"
                                            value={newResLine.cost}
                                            onChange={e => setNewResLine(p => ({...p, cost: e.target.value}))}
                                            placeholder="राशि"
                                            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs
                                                       focus:outline-none focus:ring-2 focus:ring-green-400"
                                          />
                                          <button
                                            onClick={() => handleAddResource(wo.work_order_id)}
                                            disabled={newResSaving}
                                            className="text-xs font-semibold bg-green-600 text-white hover:bg-green-700
                                                       px-3 py-1.5 rounded-lg disabled:opacity-60"
                                          >
                                            {newResSaving ? '…' : 'दर्ज करो'}
                                          </button>
                                          <button
                                            onClick={() => { setAddingResWoId(null); setNewResLine(emptyResLine()); setNewResError(''); }}
                                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg border border-gray-200"
                                          >
                                            रद्द
                                          </button>
                                        </div>
                                        {newResError && (
                                          <p className="text-xs text-red-600">{newResError}</p>
                                        )}
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setAddingResWoId(wo.work_order_id);
                                          setNewResLine(emptyResLine());
                                          setNewResError('');
                                          setExpandedWOs(prev => new Set([...prev, wo.work_order_id]));
                                        }}
                                        className="mt-1 text-xs text-green-700 font-medium hover:text-green-800"
                                      >
                                        {TC.addResource}
                                      </button>
                                    )}

                                    {/* ── Latest note: worker completion OR supervisor send-back reason ── */}
                                    {wo.completion_note && (() => {
                                      const isSendBack = wo.completion_note.startsWith('↩ ');
                                      const noteText   = isSendBack ? wo.completion_note.slice(2) : wo.completion_note;
                                      return (
                                        <div className="mt-3 border-t border-gray-100 pt-2">
                                          <p className={`text-xs font-semibold mb-1 ${isSendBack ? 'text-red-500' : 'text-gray-500'}`}>
                                            {isSendBack ? TC.sendBackNoteLabel : TC.completionNoteLabel}
                                          </p>
                                          <p className={`text-xs rounded-lg px-3 py-2 whitespace-pre-wrap border
                                            ${isSendBack
                                              ? 'text-red-900 bg-red-50 border-red-100'
                                              : 'text-gray-800 bg-amber-50 border-amber-100'}`}>
                                            {noteText}
                                          </p>
                                        </div>
                                      );
                                    })()}

                                    {/* ── Worker completion submit (open/in_progress only) ── */}
                                    {(wo.status === 'open' || wo.status === 'in_progress') && (
                                      <div className="mt-2 border-t border-gray-100 pt-2">
                                        {completingWO?.woId === wo.work_order_id ? (
                                          <div className="space-y-2">
                                            <p className="text-xs font-semibold text-gray-600">
                                              {TC.completionLabel}
                                            </p>
                                            <textarea
                                              value={completionComment}
                                              onChange={e => setCompletionComment(e.target.value)}
                                              placeholder={TC.completionPlaceholder}
                                              rows={2}
                                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs
                                                         focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                                              lang="hi"
                                              autoFocus
                                            />
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => handleSubmitCompletion(wo.work_order_id)}
                                                disabled={completionSaving}
                                                className="text-xs font-semibold bg-amber-500 hover:bg-amber-600
                                                           text-white px-3 py-1.5 rounded-lg disabled:opacity-60"
                                              >
                                                {completionSaving ? TC.submittingCompletion : TC.submitCompletionBtn}
                                              </button>
                                              <button
                                                onClick={() => { setCompletingWO(null); setCompletionComment(''); }}
                                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5
                                                           rounded-lg border border-gray-200 bg-white"
                                              >
                                                {TC.cancelForm}
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setCompletingWO({ woId: wo.work_order_id, taskId: task.task_id });
                                              setCompletionComment('');
                                            }}
                                            className="text-xs font-semibold text-amber-700 hover:text-amber-900"
                                          >
                                            {TC.submitCompletion}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}

                        {/* Add WO form or button */}
                        {addingWoTaskId === task.task_id ? (
                          <div className="px-10 py-3 border-t border-gray-100">
                            <WOForm
                              taskId={task.task_id}
                              workers={workers}
                              onSave={() => {
                                setAddingWoTaskId(null);
                                fetchAll();
                              }}
                              onCancel={() => setAddingWoTaskId(null)}
                            />
                          </div>
                        ) : (
                          <div className="px-10 pt-2 pb-2.5 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setAddingWoTaskId(task.task_id);
                                setEditingWO(null);
                              }}
                              className="text-xs text-green-700 font-semibold hover:text-green-800"
                            >
                              {TC.addWO}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add task form or button */}
          {showAddTask ? (
            <div className="px-4 py-3 border-t border-gray-100">
              <TaskForm
                cycleId={crop_cycle_id}
                cycleFields={cycleFields}
                fieldNameMap={fieldNameMap}
                onSave={() => { setShowAddTask(false); fetchAll(); }}
                onCancel={() => setShowAddTask(false)}
              />
            </div>
          ) : (
            <div className="px-4 pt-2 pb-3 border-t border-gray-100">
              <button
                onClick={() => { setShowAddTask(true); setEditingTask(null); }}
                className="flex items-center gap-1.5 text-sm font-medium text-orange-600
                           hover:text-orange-700 py-1"
              >
                <Plus className="w-4 h-4" />
                {TC.addTask}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── SALES ────────────────────────────────────────────────────────────── */}
      <Section title={S.salesHeading}>
        {sales.length === 0 ? (
          <p className="text-sm text-gray-400 py-3">{S.noSales}</p>
        ) : (
          sales.map(sale => {
            const channelLabel = SALE_CHANNELS[sale.channel] ?? sale.channel;
            const isDeleting   = deletingId === sale.sale_id;
            return (
              <div key={sale.sale_id}>
                <div className="flex items-start justify-between py-2.5 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm text-gray-800 font-medium">{sale.buyer || '—'}</span>
                      <span className="text-xs text-gray-400">{channelLabel}</span>
                      <span className="text-xs text-gray-400">{sale.sale_date}</span>
                      <span className="text-xs text-gray-400">
                        {sale.quantity} {sale.unit} @ ₹{sale.rate}
                      </span>
                    </div>
                    {sale.notes && (
                      <p className="text-xs text-gray-400 italic mt-0.5 truncate">{sale.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-green-700 tabular-nums">
                      {formatMoney(sale.total_amount).formatted}
                    </span>
                    <button
                      onClick={() => navigate(
                        `/cycle/${crop_cycle_id}/sales/${sale.sale_id}/edit`,
                        { state: { season, crop_year: ctx.crop_year, crop_name, seed_category: seed_cat, sale } }
                      )}
                      className="text-xs text-blue-600 hover:text-blue-800 px-1.5 py-0.5
                                 rounded hover:bg-blue-50 transition-colors"
                    >
                      {S.editSale}
                    </button>
                    <button
                      onClick={() => setDeletingId(sale.sale_id)}
                      className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5
                                 rounded hover:bg-red-50 transition-colors"
                    >
                      {S.deleteSale}
                    </button>
                  </div>
                </div>
                {isDeleting && (
                  <div className="flex items-center justify-between bg-red-50 rounded-lg
                                  px-3 py-2.5 mb-1 gap-3">
                    <span className="text-sm text-red-700 font-medium">{S.deleteConfirm}</span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDelete(sale.sale_id)}
                        disabled={deleteLoading}
                        className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700
                                   px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                      >
                        {S.deleteYes}
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        disabled={deleteLoading}
                        className="text-xs font-semibold text-gray-600 bg-white border border-gray-300
                                   hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {S.deleteNo}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div className="pt-2 pb-1 border-t border-gray-100 mt-1">
          <button
            onClick={() => navigate(
              `/cycle/${crop_cycle_id}/sales/new`,
              { state: { season, crop_year: ctx.crop_year, crop_name, seed_category: seed_cat } }
            )}
            className="flex items-center gap-1.5 text-sm font-medium text-green-700
                       hover:text-green-800 py-1"
          >
            <Plus className="w-4 h-4" />
            {S.addSale}
          </button>
        </div>
      </Section>

      {/* ── YIELDS ───────────────────────────────────────────────────────────── */}
      <Section title={S.yieldsHeading}>
        {yields.length === 0 ? (
          <p className="text-sm text-gray-400 py-3">{S.noYields}</p>
        ) : (
          yields.map(y => {
            const isDeletingY  = deletingYieldId === y.yield_id;
            const gradeLabel   = QUALITY_GRADES.find(g => g.value === y.quality_grade)?.label ?? y.quality_grade;
            return (
              <div key={y.yield_id}>
                <div className="flex items-start justify-between py-2.5 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-gray-800">
                        {y.quantity} {y.unit}
                      </span>
                      {gradeLabel && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {gradeLabel}
                        </span>
                      )}
                      {y.field_id && (
                        <span className="text-xs text-gray-400">{y.field_id}</span>
                      )}
                      <span className="text-xs text-gray-400">{y.harvest_date}</span>
                    </div>
                    {y.notes && (
                      <p className="text-xs text-gray-400 italic mt-0.5 truncate">{y.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(
                        `/cycle/${crop_cycle_id}/yields/${y.yield_id}/edit`,
                        { state: { season, crop_year: ctx.crop_year, crop_name, seed_category: seed_cat, yield: y } }
                      )}
                      className="text-xs text-blue-600 hover:text-blue-800 px-1.5 py-0.5
                                 rounded hover:bg-blue-50 transition-colors"
                    >
                      {YS.editYield}
                    </button>
                    <button
                      onClick={() => setDeletingYieldId(y.yield_id)}
                      className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5
                                 rounded hover:bg-red-50 transition-colors"
                    >
                      {YS.deleteYield}
                    </button>
                  </div>
                </div>
                {isDeletingY && (
                  <div className="flex items-center justify-between bg-red-50 rounded-lg
                                  px-3 py-2.5 mb-1 gap-3">
                    <span className="text-sm text-red-700 font-medium">{YS.deleteConfirm}</span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDeleteYield(y.yield_id)}
                        disabled={deleteYieldLoading}
                        className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700
                                   px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                      >
                        {YS.deleteYes}
                      </button>
                      <button
                        onClick={() => setDeletingYieldId(null)}
                        disabled={deleteYieldLoading}
                        className="text-xs font-semibold text-gray-600 bg-white border border-gray-300
                                   hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {YS.deleteNo}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div className="pt-2 pb-1 border-t border-gray-100 mt-1">
          <button
            onClick={() => navigate(
              `/cycle/${crop_cycle_id}/yields/new`,
              { state: { season, crop_year: ctx.crop_year, crop_name, seed_category: seed_cat } }
            )}
            className="flex items-center gap-1.5 text-sm font-medium text-green-700
                       hover:text-green-800 py-1"
          >
            <Plus className="w-4 h-4" />
            {YS.addYield}
          </button>
        </div>
      </Section>

    </div>
  );
}
