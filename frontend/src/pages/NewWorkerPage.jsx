import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { NEW_WORKER as S, WORKERS_PAGE as WS } from '../strings/hi';

const ROLES = [
  { value: 'worker',     label: WS.roles.worker     },
  { value: 'supervisor', label: WS.roles.supervisor  },
  { value: 'owner',      label: WS.roles.owner       },
];

// Validate E.164: +[1-9][6-14 more digits]
const E164_RE = /^\+[1-9]\d{6,14}$/;

export default function NewWorkerPage() {
  const { worker_id } = useParams();
  const navigate      = useNavigate();
  const location      = useLocation();
  const isEdit        = Boolean(worker_id);
  const existing      = location.state?.worker ?? null;

  // Phone stored split: countryCode (e.g. "+91") + localNumber (e.g. "9876543210")
  function splitPhone(full) {
    if (!full) return { cc: '+91', local: '' };
    // Try to match known country codes (1-3 digits after +)
    const m = full.match(/^(\+\d{1,3})(\d+)$/);
    if (m) return { cc: m[1], local: m[2] };
    return { cc: '+91', local: full.replace(/^\+\d{1,3}/, '') };
  }

  const initPhone = splitPhone(existing?.whatsapp_number ?? '');

  const [name,        setName]        = useState(existing?.name ?? '');
  const [countryCode, setCountryCode] = useState(initPhone.cc);
  const [localNum,    setLocalNum]    = useState(initPhone.local);
  const [role,        setRole]        = useState(existing?.role ?? 'worker');
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);

  // Combined E.164 number
  const fullPhone = localNum.trim()
    ? `${countryCode.trim()}${localNum.replace(/\D/g, '')}`
    : '';

  function validate() {
    const e = {};
    if (!name.trim()) e.name = S.errors.name;
    if (fullPhone && !E164_RE.test(fullPhone)) e.phone = S.errors.phone;
    return e;
  }

  const isValid = name.trim().length > 0 &&
    (!fullPhone || E164_RE.test(fullPhone));

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);

    const payload = {
      name: name.trim(),
      whatsapp_number: fullPhone || null,
      role,
    };

    try {
      if (isEdit) {
        await api.put(`/workers/${worker_id}`, payload);
      } else {
        await api.post('/workers/', payload);
      }
      setSuccess(true);
      setTimeout(() => navigate('/workers'), 900);
    } catch (err) {
      const detail = err.response?.data?.detail ?? '';
      if (detail.includes('पहले से दर्ज')) {
        setErrors({ phone: S.errors.duplicate });
      } else {
        setErrors({ submit: 'कुछ गड़बड़ हो गई, दोबारा कोशिश करो।' });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-16 md:pt-8">

      {/* Back */}
      <button
        onClick={() => navigate('/workers')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        कर्मचारी
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? S.editTitle : S.title}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {S.nameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={S.namePlaceholder}
            className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-orange-400
              ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* WhatsApp number: country code + local */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {S.phoneLabel}
          </label>
          <div className="flex gap-2">
            {/* Country code input */}
            <input
              type="text"
              value={countryCode}
              onChange={e => {
                // Keep the + and only digits after it
                const raw = e.target.value.replace(/[^\d+]/g, '');
                setCountryCode(raw.startsWith('+') ? raw : '+' + raw.replace(/\+/g, ''));
              }}
              maxLength={5}
              className="w-20 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900
                font-mono text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
              aria-label={S.countryCodeLabel}
            />
            {/* Local number */}
            <input
              type="tel"
              inputMode="numeric"
              value={localNum}
              onChange={e => setLocalNum(e.target.value.replace(/\D/g, ''))}
              placeholder={S.localNumPlaceholder}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-orange-400
                ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{S.phoneHint}</p>
          {/* Live preview of combined number */}
          {fullPhone && (
            <p className={`text-xs mt-1 font-mono ${E164_RE.test(fullPhone) ? 'text-green-600' : 'text-red-500'}`}>
              {fullPhone} {E164_RE.test(fullPhone) ? '✓' : '✗'}
            </p>
          )}
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        {/* Role pills */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {S.roleLabel}
          </label>
          <div className="flex gap-3">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold border transition-colors
                  ${role === r.value
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {errors.submit && (
          <p className="text-sm text-red-500 text-center">{errors.submit}</p>
        )}

        {success ? (
          <div className="w-full rounded-xl bg-green-50 border border-green-200 py-3
            text-center text-green-700 text-sm font-semibold">
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
