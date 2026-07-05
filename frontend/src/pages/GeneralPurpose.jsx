/**
 * GeneralPurpose — /general-purpose
 * Saamanya kharch ledger. Posted-but-flagged review model:
 *   - expense saves immediately (money already spent)
 *   - supervisor verifies / voids after-the-fact
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X, Pencil, Trash2 } from 'lucide-react';
import BreadcrumbNav from '../components/BreadcrumbNav';
import NotesInterface from '../components/NotesInterface';
import { generalExpenseAPI } from '../services/api';
import { formatMoney } from '../utils/money';
import {
  GE_CATEGORY_LABELS,
  GE_SUBCATEGORIES,
  GE_REVIEW_STATUS,
  GE_PAYMENT_MODES,
  GE_PAYMENT_BADGE,
  GE_STRINGS as S,
} from '../strings/hi';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function FieldLabel({ text, required }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
  );
}

function ReviewBadge({ status }) {
  const s = GE_REVIEW_STATUS[status] ?? GE_REVIEW_STATUS.unreviewed;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.color}`}>
      {s.label}
    </span>
  );
}

function PaymentBadge({ mode, customText }) {
  if (!mode) return null;
  const b = GE_PAYMENT_BADGE[mode];
  if (!b) return null;
  const label = mode === 'other' && customText ? customText : b.label;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${b.color}`}>
      {label}
    </span>
  );
}

// ── Add / Edit form ──────────────────────────────────────────────────────────

function ExpenseForm({ initial, onSave, onCancel }) {
  const isEdit = Boolean(initial);

  const [category,    setCategory]    = useState(initial?.category ?? '');
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [amount,      setAmount]      = useState(initial?.total_cost != null ? String(initial.total_cost) : '');
  const [qty,         setQty]         = useState(initial?.qty != null ? String(initial.qty) : '');
  const [unit,        setUnit]        = useState(initial?.unit ?? '');
  const [unitRate,    setUnitRate]    = useState(initial?.unit_rate != null ? String(initial.unit_rate) : '');
  const [date,        setDate]        = useState(initial?.date ?? todayStr());
  const [paymentMode, setPaymentMode] = useState(initial?.payment_mode ?? '');
  const [paymentCustom, setPaymentCustom] = useState(initial?.payment_mode_custom ?? '');
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);

  const subcatOptions = category ? (GE_SUBCATEGORIES[category] ?? []) : [];

  function validate() {
    const e = {};
    if (!category) e.category = S.errors.category;
    const n = parseFloat(amount);
    if (!amount || isNaN(n) || n <= 0) e.amount = S.errors.amount;
    if (!paymentMode) e.paymentMode = 'भुगतान का तरीका चुनो';
    if (paymentMode === 'other' && !paymentCustom.trim()) e.paymentCustom = 'तरीका लिखो';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      category,
      subcategory: subcategory || null,
      description: description.trim() || null,
      total_cost:  parseFloat(amount),
      qty:         qty ? parseFloat(qty) : null,
      unit:        unit.trim() || null,
      unit_rate:   unitRate ? parseFloat(unitRate) : null,
      date,
      payment_mode:        paymentMode || null,
      payment_mode_custom: paymentMode === 'other' ? paymentCustom.trim() || null : null,
    };
    try {
      if (isEdit) {
        const res = await generalExpenseAPI.update(initial.general_expense_id, payload);
        onSave(res.data);
      } else {
        const res = await generalExpenseAPI.create(payload);
        onSave(res.data);
      }
    } catch (err) {
      setSaving(false);
      const detail = err?.response?.data?.detail ?? 'कुछ गड़बड़ हो गई।';
      setErrors({ submit: detail });
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
      <h3 className="text-base font-bold text-gray-800 mb-4">
        {isEdit ? S.formEdit : S.formAdd}
      </h3>
      <div className="space-y-4">

        {/* श्रेणी */}
        <div>
          <FieldLabel text={S.categoryLabel} required />
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setSubcategory(''); setErrors(v => ({ ...v, category: undefined })); }}
            className={`w-full border rounded-xl px-4 py-3 bg-white text-base
              focus:outline-none focus:ring-2 focus:ring-green-500
              ${errors.category ? 'border-red-400' : 'border-gray-300'}`}
          >
            <option value="">— श्रेणी चुनो —</option>
            {Object.entries(GE_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
        </div>

        {/* उप-श्रेणी */}
        {category && (
          <div>
            <FieldLabel text={S.subcategoryLabel} />
            {subcatOptions.length > 0 ? (
              <select
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-base
                  focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">— (वैकल्पिक) —</option>
                {subcatOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                placeholder={S.subcategoryPlaceholder}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-base
                  focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            )}
          </div>
        )}

        {/* विवरण */}
        <div>
          <FieldLabel text={S.descLabel} />
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={S.descPlaceholder}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-base
              focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* राशि */}
        <div>
          <FieldLabel text={S.amountLabel} required />
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={e => { setAmount(e.target.value); setErrors(v => ({ ...v, amount: undefined })); }}
            placeholder={S.amountPlaceholder}
            className={`w-full border rounded-xl px-4 py-3 bg-white text-lg
              focus:outline-none focus:ring-2 focus:ring-green-500
              ${errors.amount ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
        </div>

        {/* मात्रा + इकाई + दर (optional row) */}
        <div className="flex gap-2">
          <div className="flex-1">
            <FieldLabel text={S.qtyLabel} />
            <input
              type="number"
              inputMode="decimal"
              value={qty}
              onChange={e => setQty(e.target.value)}
              placeholder="—"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 bg-white text-base
                focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="w-24">
            <FieldLabel text={S.unitLabel} />
            <input
              type="text"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="kg / L"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 bg-white text-base
                focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex-1">
            <FieldLabel text={S.rateLabel} />
            <input
              type="number"
              inputMode="decimal"
              value={unitRate}
              onChange={e => setUnitRate(e.target.value)}
              placeholder="—"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 bg-white text-base
                focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* तारीख */}
        <div>
          <FieldLabel text={S.dateLabel} />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-base
              focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* भुगतान का तरीका */}
        <div>
          <FieldLabel text={S.paymentLabel} required />
          <select
            value={paymentMode}
            onChange={e => {
              setPaymentMode(e.target.value);
              setPaymentCustom('');
              setErrors(v => ({ ...v, paymentMode: undefined, paymentCustom: undefined }));
            }}
            className={`w-full border rounded-xl px-4 py-3 bg-white text-base
              focus:outline-none focus:ring-2 focus:ring-green-500
              ${errors.paymentMode ? 'border-red-400' : 'border-gray-300'}`}
          >
            <option value="">{S.paymentPlaceholder}</option>
            {GE_PAYMENT_MODES.map(m => (
              <option key={m.key} value={m.key}>
                {m.label}{m.hint ? ` — ${m.hint}` : ''}
              </option>
            ))}
          </select>
          {errors.paymentMode && <p className="text-xs text-red-500 mt-1">{errors.paymentMode}</p>}
        </div>

        {paymentMode === 'other' && (
          <div>
            <FieldLabel text={S.paymentCustomLabel} required />
            <input
              type="text"
              value={paymentCustom}
              onChange={e => {
                setPaymentCustom(e.target.value);
                setErrors(v => ({ ...v, paymentCustom: undefined }));
              }}
              placeholder={S.paymentCustomPlaceholder}
              className={`w-full border rounded-xl px-4 py-3 bg-white text-base
                focus:outline-none focus:ring-2 focus:ring-green-500
                ${errors.paymentCustom ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.paymentCustom && <p className="text-xs text-red-500 mt-1">{errors.paymentCustom}</p>}
          </div>
        )}

        {errors.submit && (
          <p className="text-sm text-red-600">{errors.submit}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl font-bold text-base
              bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? S.saving : (isEdit ? S.update : S.submit)}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-xl font-medium text-base
              bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {S.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Void reason dialog ───────────────────────────────────────────────────────

function VoidDialog({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-red-700">{S.voidReason}</p>
      <textarea
        ref={ref}
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder={S.voidReasonPlaceholder}
        rows={2}
        className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => reason.trim() && onConfirm(reason.trim())}
          disabled={!reason.trim()}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white
            hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {S.voidConfirm}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600
            border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          {S.voidCancel}
        </button>
      </div>
    </div>
  );
}

// ── Delete confirm inline ────────────────────────────────────────────────────

function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
      <p className="text-sm text-gray-700 flex-1">{S.deleteConfirm}</p>
      <button
        type="button"
        onClick={onConfirm}
        className="px-3 py-1.5 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
      >
        {S.deleteYes}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
      >
        {S.deleteNo}
      </button>
    </div>
  );
}

// ── Single expense row ───────────────────────────────────────────────────────

function ExpenseRow({ expense, onUpdated, onDeleted }) {
  const [expanded,   setExpanded]   = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [showVoid,   setShowVoid]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [busy,       setBusy]       = useState(false);

  const { formatted: amtFmt } = formatMoney(expense.total_cost);
  const catLabel = GE_CATEGORY_LABELS[expense.category] ?? expense.category ?? '—';
  const statusKey = expense.review_status ?? 'unreviewed';

  async function handleVerify() {
    setBusy(true);
    try {
      const res = await generalExpenseAPI.verify(expense.general_expense_id);
      onUpdated(res.data);
    } finally { setBusy(false); }
  }

  async function handleVoid(reason) {
    setBusy(true);
    try {
      const res = await generalExpenseAPI.void(expense.general_expense_id, reason);
      onUpdated(res.data);
      setShowVoid(false);
    } finally { setBusy(false); }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await generalExpenseAPI.delete(expense.general_expense_id);
      onDeleted(expense.general_expense_id);
    } finally { setBusy(false); }
  }

  if (showEdit) {
    return (
      <ExpenseForm
        initial={expense}
        onSave={updated => { onUpdated(updated); setShowEdit(false); }}
        onCancel={() => setShowEdit(false)}
      />
    );
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden
      ${statusKey === 'void' ? 'opacity-60 border-gray-200' : 'border-gray-200'}`}>

      {/* ── Summary row (clickable) ── */}
      <div
        className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
        onClick={() => setExpanded(v => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
      >
        <div className="flex items-start justify-between gap-3">

          {/* Left: ID + category + description */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-gray-400 shrink-0 bg-gray-100 px-1.5 py-0.5 rounded">
                {expense.expense_no ?? '—'}
              </span>
              <span className="font-semibold text-gray-800 text-sm">{catLabel}</span>
              {expense.subcategory && (
                <span className="text-gray-500 text-xs">· {expense.subcategory}</span>
              )}
            </div>
            {expense.description && (
              <p className="text-sm text-gray-600 mt-0.5 truncate">{expense.description}</p>
            )}
          </div>

          {/* Right: amount + date + badges */}
          <div className="text-right shrink-0">
            <p className="font-bold text-gray-900 text-base">{amtFmt}</p>
            {expense.date && (
              <p className="text-[11px] text-gray-400 mt-0.5">{expense.date}</p>
            )}
            <div className="mt-1 flex items-center justify-end gap-1 flex-wrap">
              <PaymentBadge mode={expense.payment_mode} customText={expense.payment_mode_custom} />
              <ReviewBadge status={statusKey} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">

          {/* Quantity / rate row */}
          {(expense.qty != null || expense.unit_rate != null) && (
            <div className="flex gap-4 text-sm text-gray-600">
              {expense.qty != null && (
                <span>मात्रा: <strong>{expense.qty}</strong>{expense.unit ? ` ${expense.unit}` : ''}</span>
              )}
              {expense.unit_rate != null && (
                <span>दर: <strong>₹{expense.unit_rate}</strong></span>
              )}
            </div>
          )}

          {/* Void reason */}
          {statusKey === 'void' && expense.void_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              <span className="font-semibold">रद्द कारण: </span>{expense.void_reason}
            </div>
          )}

          {/* Notes — inline, not at bottom of page */}
          <NotesInterface
            relatedType="general_expense"
            relatedId={expense.general_expense_id}
          />

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {statusKey !== 'verified' && statusKey !== 'void' && (
              <button
                type="button"
                onClick={handleVerify}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-green-50 text-green-700 border border-green-200 hover:bg-green-100
                  disabled:opacity-50 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {S.verify}
              </button>
            )}
            {statusKey !== 'void' && (
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                {S.edit}
              </button>
            )}
            {statusKey !== 'void' && (
              <button
                type="button"
                onClick={() => { setShowVoid(v => !v); setShowDelete(false); }}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-red-50 text-red-700 border border-red-200 hover:bg-red-100
                  disabled:opacity-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                {S.void}
              </button>
            )}
            {/* Delete — always available (hard delete of void rows is fine) */}
            <button
              type="button"
              onClick={() => { setShowDelete(v => !v); setShowVoid(false); }}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                bg-gray-50 text-red-600 border border-red-100 hover:bg-red-50
                disabled:opacity-50 transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {showVoid   && <VoidDialog onConfirm={handleVoid} onCancel={() => setShowVoid(false)} />}
          {showDelete && <DeleteConfirm onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />}
        </div>
      )}
    </div>
  );
}

// ── Filter helpers ───────────────────────────────────────────────────────────

function pad2(n) { return String(n).padStart(2, '0'); }

/** Returns { date_from?, date_to? } for the given preset. */
function buildDateParams(preset, dateFrom, dateTo) {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1; // 1-12

  if (preset === 'this_month') {
    const lastDay = new Date(y, m, 0).getDate();
    return { date_from: `${y}-${pad2(m)}-01`, date_to: `${y}-${pad2(m)}-${lastDay}` };
  }
  if (preset === 'last_month') {
    const lm = m === 1 ? 12 : m - 1;
    const ly = m === 1 ? y - 1 : y;
    const lastDay = new Date(ly, lm, 0).getDate();
    return { date_from: `${ly}-${pad2(lm)}-01`, date_to: `${ly}-${pad2(lm)}-${lastDay}` };
  }
  if (preset === 'this_season') {
    // Kharif: Jun 1 – Nov 30  |  Rabi: Dec 1 prev – May 31 current
    if (m >= 6 && m <= 11) return { date_from: `${y}-06-01`,     date_to: `${y}-11-30` };
    if (m === 12)           return { date_from: `${y}-12-01`,     date_to: `${y + 1}-05-31` };
    /* m 1-5 = rabi that started last Dec */
                            return { date_from: `${y - 1}-12-01`, date_to: `${y}-05-31` };
  }
  if (preset === 'custom') {
    const p = {};
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo)   p.date_to   = dateTo;
    return p;
  }
  return {}; // 'all'
}

// ── Chip component ────────────────────────────────────────────────────────────

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all
        ${active
          ? 'bg-green-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
    >
      {label}
    </button>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({ datePreset, setDatePreset, dateFrom, setDateFrom, dateTo, setDateTo,
                     statusFilter, setStatusFilter, paymentFilter, setPaymentFilter }) {
  const dateOpts = [
    { key: 'all',         label: S.filterAll },
    { key: 'this_month',  label: S.filterThisMonth },
    { key: 'last_month',  label: S.filterLastMonth },
    { key: 'this_season', label: S.filterThisSeason },
    { key: 'custom',      label: S.filterCustom },
  ];
  const statusOpts = [
    { key: 'all',        label: S.filterAll },
    { key: 'unreviewed', label: GE_REVIEW_STATUS.unreviewed.label },
    { key: 'verified',   label: GE_REVIEW_STATUS.verified.label },
    { key: 'void',       label: GE_REVIEW_STATUS.void.label },
  ];
  const paymentOpts = [
    { key: 'all', label: S.filterAll },
    ...GE_PAYMENT_MODES.map(m => ({ key: m.key, label: m.label })),
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 mb-4 space-y-3">

      {/* Date row */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
          {S.filterDate}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {dateOpts.map(o => (
            <Chip key={o.key} label={o.label} active={datePreset === o.key}
              onClick={() => setDatePreset(o.key)} />
          ))}
        </div>
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="text-xs text-gray-400 shrink-0">{S.filterRangeSep}</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}
      </div>

      {/* Status row */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
          {S.filterStatus}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {statusOpts.map(o => (
            <Chip key={o.key} label={o.label} active={statusFilter === o.key}
              onClick={() => setStatusFilter(o.key)} />
          ))}
        </div>
      </div>

      {/* Payment row */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
          {S.filterPayment}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {paymentOpts.map(o => (
            <Chip key={o.key} label={o.label} active={paymentFilter === o.key}
              onClick={() => setPaymentFilter(o.key)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GeneralPurpose() {
  const [expenses,     setExpenses]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [showForm,     setShowForm]     = useState(false);

  // Filters
  const [datePreset,    setDatePreset]    = useState('all');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  async function loadExpenses(params) {
    setLoading(true);
    setError(null);
    try {
      const res = await generalExpenseAPI.list(params);
      setExpenses(res.data ?? []);
    } catch {
      setError('खर्चों की सूची नहीं आई।');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = { ...buildDateParams(datePreset, dateFrom, dateTo) };
    if (statusFilter  !== 'all') params.review_status = statusFilter;
    if (paymentFilter !== 'all') params.payment_mode  = paymentFilter;
    loadExpenses(params);
  }, [datePreset, dateFrom, dateTo, statusFilter, paymentFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCreated(newExp) {
    setExpenses(prev => [newExp, ...prev]);
    setShowForm(false);
  }

  function handleUpdated(updated) {
    setExpenses(prev => prev.map(e =>
      e.general_expense_id === updated.general_expense_id ? updated : e
    ));
  }

  function handleDeleted(id) {
    setExpenses(prev => prev.filter(e => e.general_expense_id !== id));
  }

  const totalActive = expenses
    .filter(e => (e.review_status ?? 'unreviewed') !== 'void')
    .reduce((sum, e) => sum + (e.total_cost ?? 0), 0);

  const { formatted: totalFmt } = formatMoney(totalActive);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-16 md:pt-8">

      <BreadcrumbNav items={[{ label: S.heading }]} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{S.heading}</h1>
          {!loading && expenses.length > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">कुल: {totalFmt}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm
            bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          {S.addExpense}
        </button>
      </div>

      {/* Filter bar */}
      <FilterBar
        datePreset={datePreset}     setDatePreset={setDatePreset}
        dateFrom={dateFrom}         setDateFrom={setDateFrom}
        dateTo={dateTo}             setDateTo={setDateTo}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        paymentFilter={paymentFilter} setPaymentFilter={setPaymentFilter}
      />

      {/* Inline add form */}
      {showForm && (
        <ExpenseForm
          onSave={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* States */}
      {loading && (
        <p className="text-center text-gray-400 py-12">लोड हो रहा है…</p>
      )}
      {error && (
        <p className="text-center text-red-500 py-8">{error}</p>
      )}

      {/* List */}
      {!loading && !error && (
        <div className="space-y-3">
          {expenses.length === 0 && !showForm ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>{S.empty}</p>
            </div>
          ) : (
            expenses.map(e => (
              <ExpenseRow
                key={e.general_expense_id}
                expense={e}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
