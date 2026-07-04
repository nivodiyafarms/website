/**
 * NewCyclePage — /season/:season/:crop_year/new-cycle
 * Creates a new crop cycle (variety) in the given season.
 * Season + crop_year are LOCKED from URL context — never re-asked.
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { cropCycleAPI, fieldAPI } from '../services/api';
import { SEASONS, NEW_CYCLE as S, SEED_CLASS_OPTIONS, SEED_STAGE_OPTIONS } from '../strings/hi';

export default function NewCyclePage() {
  const { season, crop_year } = useParams();
  const navigate = useNavigate();

  const [fields, setFields]         = useState([]);   // all available fields
  const [cropNames, setCropNames]   = useState([]);   // existing crop names for suggestions
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  // Form state
  const [crop, setCrop]             = useState('');
  const [newCropMode, setNewCropMode] = useState(false); // true when "नई फसल जोड़ो" chosen
  const [variety, setVariety]       = useState('');
  const [seedClass, setSeedClass]   = useState('');
  const [seedClassCustom, setSeedClassCustom] = useState('');
  const [seedStage, setSeedStage]   = useState('');
  const [seedStageCustom, setSeedStageCustom] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [seedQty, setSeedQty]       = useState('');
  // selected fields: [{ field_id, name, allocated_acres: '' }]
  const [selectedFields, setSelectedFields] = useState([]);

  const seasonLabel = `${SEASONS[season] ?? season} ${crop_year}`;

  useEffect(() => {
    Promise.all([
      fieldAPI.getAll(),
      cropCycleAPI.getCropNames(),
    ]).then(([fr, cr]) => {
      setFields(fr.data || []);
      setCropNames(cr.data || []);
    }).catch(() => {});
  }, []);

  // ── Field picker helpers ────────────────────────────────────────────────────

  const availableFields = fields.filter(
    f => !selectedFields.find(s => s.field_id === f.field_id)
  );

  const addField = (f) => {
    setSelectedFields(prev => [...prev, { field_id: f.field_id, name: f.name, allocated_acres: '' }]);
  };

  const removeField = (fieldId) => {
    setSelectedFields(prev => prev.filter(f => f.field_id !== fieldId));
  };

  const setAcres = (fieldId, val) => {
    setSelectedFields(prev =>
      prev.map(f => f.field_id === fieldId ? { ...f, allocated_acres: val } : f)
    );
  };

  const totalAcres = selectedFields.reduce((sum, f) => sum + (parseFloat(f.allocated_acres) || 0), 0);

  // ── Validation + submit ────────────────────────────────────────────────────

  const validate = () => {
    if (!crop.trim())          return S.errors.crop;
    if (!seedClass)            return S.errors.seedClass;
    if (!sowingDate)           return S.errors.sowing;
    if (selectedFields.length === 0) return S.errors.noField;
    for (const f of selectedFields) {
      const a = parseFloat(f.allocated_acres);
      if (!a || a <= 0)        return S.errors.acres;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError('');
    try {
      await cropCycleAPI.createCycle({
        crop_name:         crop.trim(),
        seed_category:     variety.trim() || null,
        seed_class:        seedClass || null,
        seed_class_custom: seedClass === 'other' ? (seedClassCustom.trim() || null) : null,
        seed_stage:        seedStage || null,
        seed_stage_custom: seedStage === 'other' ? (seedStageCustom.trim() || null) : null,
        sowing_date:       sowingDate,
        season:            season,
        crop_year:         Number(crop_year),
        seed_quantity:     seedQty ? parseFloat(seedQty) : null,
        current_stage:     'sowing',
        status:            'open',
        fields: selectedFields.map(f => ({
          field_id:        f.field_id,
          allocated_acres: parseFloat(f.allocated_acres),
        })),
      });
      navigate(`/season/${season}/${crop_year}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'कुछ गड़बड़ हो गई।');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-5 pb-16 md:pt-8">

      {/* Back */}
      <button
        onClick={() => navigate(`/season/${season}/${crop_year}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {seasonLabel}
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{S.title}</h1>

      {/* Season locked badge */}
      <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200
                      text-orange-700 rounded-xl px-3 py-1.5 text-sm font-semibold mb-6">
        <span className="text-xs uppercase tracking-wide text-orange-400">{S.seasonLocked}</span>
        <span>{seasonLabel}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Crop */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {S.cropLabel} <span className="text-red-500">*</span>
          </label>
          {cropNames.length > 0 && !newCropMode ? (
            <select
              value={crop}
              onChange={e => {
                if (e.target.value === '__new__') {
                  setNewCropMode(true);
                  setCrop('');
                } else {
                  setCrop(e.target.value);
                }
              }}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">— फसल चुनो —</option>
              {cropNames.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
              <option value="__new__">{S.addNewCrop}</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={crop}
                onChange={e => setCrop(e.target.value)}
                placeholder={S.newCropPlaceholder}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                           focus:outline-none focus:ring-2 focus:ring-orange-400"
                lang="hi"
                autoFocus={newCropMode}
              />
              {newCropMode && (
                <button
                  type="button"
                  onClick={() => { setNewCropMode(false); setCrop(''); }}
                  className="px-3 rounded-xl border border-gray-300 text-gray-500
                             hover:bg-gray-50 text-sm"
                >
                  ← वापस
                </button>
              )}
            </div>
          )}
        </div>

        {/* Variety */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {S.varietyLabel}
          </label>
          <input
            type="text"
            value={variety}
            onChange={e => setVariety(e.target.value)}
            placeholder={S.varietyPlaceholder}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-orange-400"
            translate="no"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="text-xs text-gray-400 mt-1">{S.varietyNote}</p>
        </div>

        {/* Seed class — required */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {S.seedClassLabel} <span className="text-red-500">*</span>
          </label>
          <select
            value={seedClass}
            onChange={e => { setSeedClass(e.target.value); setSeedClassCustom(''); }}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="">— श्रेणी चुनो —</option>
            {SEED_CLASS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {seedClass === 'other' && (
            <input
              type="text"
              value={seedClassCustom}
              onChange={e => setSeedClassCustom(e.target.value)}
              placeholder={S.seedClassPlaceholder}
              className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-orange-400"
              lang="hi"
              autoFocus
            />
          )}
        </div>

        {/* Seed stage — optional */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {S.seedStageLabel}
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
              type="text"
              value={seedStageCustom}
              onChange={e => setSeedStageCustom(e.target.value)}
              placeholder={S.seedStagePlaceholder}
              className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-orange-400"
              lang="hi"
              autoFocus
            />
          )}
        </div>

        {/* Sowing date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {S.sowingLabel} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={sowingDate}
            onChange={e => setSowingDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Seed quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {S.seedQtyLabel}
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={seedQty}
            onChange={e => setSeedQty(e.target.value)}
            placeholder={S.seedQtyPlaceholder}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Fields + acres */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {S.fieldsLabel} <span className="text-red-500">*</span>
          </label>

          {/* Selected fields */}
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
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={sf.allocated_acres}
                    onChange={e => setAcres(sf.field_id, e.target.value)}
                    placeholder={S.fieldAcresPlaceholder}
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
                  {S.totalAcres(totalAcres.toFixed(2))}
                </p>
              )}
            </div>
          )}

          {/* Available fields to pick */}
          {availableFields.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableFields.map(f => (
                <button
                  key={f.field_id}
                  type="button"
                  onClick={() => addField(f)}
                  className="px-3 py-1.5 rounded-xl text-sm border border-gray-300
                             bg-white text-gray-700 hover:border-orange-400 hover:bg-orange-50
                             transition"
                >
                  <span className="font-bold font-mono">{f.field_id}</span>
                  {f.name && f.name !== f.field_id && (
                    <span className="text-xs text-gray-400 ml-1">{f.name}</span>
                  )}
                </button>
              ))}
            </div>
          ) : selectedFields.length > 0 ? (
            <p className="text-xs text-gray-400">सभी खेत जोड़े गए</p>
          ) : (
            <p className="text-xs text-gray-400">कोई खेत नहीं मिला — पहले खेत बनाओ</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50
                     text-white font-bold rounded-2xl py-3.5 text-base transition"
        >
          {saving ? S.saving : S.submit}
        </button>

      </form>
    </div>
  );
}
