/**
 * CycleDetailPage — /cycle/:crop_cycle_id
 * THE money screen. Hero P&L panel + fields/sales/yields sections.
 *
 * Fetches:
 *   GET /api/crop-cycles/{id}/pnl      — P&L numbers
 *   GET /api/crop-cycles/{id}          — field_code + cultivated_area
 *
 * location.state (set by SeasonDetailPage / CropVarietyPage):
 *   { season, crop_year, crop_name, seed_category }
 *   Falls back gracefully if navigated directly (bookmarked URL).
 *
 * TODO(auth-slice-6): gate this screen to supervisor/owner role — financial data.
 * TODO(3c): render sales + yield line items once list endpoints exist.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import api from '../services/api';
import { ProfitDisplay, formatMoney } from '../utils/money';
import { SEASONS, CYCLE_DETAIL_STRINGS as S, SALE_CHANNELS } from '../strings/hi';

// ── Breakdown row (cost/revenue lines — no arrow, just color) ─────────────────
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

// ── Main component ─────────────────────────────────────────────────────────────
export default function CycleDetailPage() {
  const { crop_cycle_id } = useParams();
  const navigate          = useNavigate();
  const location          = useLocation();
  const ctx               = location.state ?? {};

  const [pnl, setPnl]             = useState(null);
  const [detail, setDetail]       = useState(null);
  const [sales, setSales]         = useState([]);
  const [status, setStatus]       = useState('loading');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAll = useCallback(() => {
    return Promise.all([
      api.get(`/crop-cycles/${crop_cycle_id}/pnl`),
      api.get(`/crop-cycles/${crop_cycle_id}`),
      api.get(`/sales?crop_cycle_id=${crop_cycle_id}`),
    ])
      .then(([pnlRes, detailRes, salesRes]) => {
        setPnl(pnlRes.data);
        setDetail(detailRes.data);
        setSales(salesRes.data ?? []);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, [crop_cycle_id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleDelete(saleId) {
    setDeleteLoading(true);
    try {
      await api.delete(`/sales/${saleId}`);
      setSales(prev => prev.filter(s => s.sale_id !== saleId));
      // Re-fetch PnL so hero numbers update immediately
      api.get(`/crop-cycles/${crop_cycle_id}/pnl`).then(r => setPnl(r.data)).catch(() => {});
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  }

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
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-gray-500 underline"
        >
          {S.back}
        </button>
      </div>
    );
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const season       = pnl.season  ?? ctx.season  ?? '';
  const crop_year    = ctx.crop_year ?? null;
  const crop_name    = pnl.crop_name ?? ctx.crop_name ?? '';
  const seed_cat     = pnl.seed_category ?? ctx.seed_category ?? '';

  const seasonHindi  = SEASONS[season] ?? season;
  const seasonLabel  = crop_year ? `${seasonHindi} ${crop_year}` : seasonHindi;

  // Back destination: one level up in the drill-down path
  const backPath     = crop_year && season
    ? `/season/${season}/${crop_year}`
    : '/seasons';

  const revenue      = pnl.revenue      ?? 0;
  const cropCost     = pnl.crop_cost    ?? 0;
  const prepAlloc    = pnl.prep_allocated ?? 0;
  const profit       = pnl.profit       ?? 0;

  const { formatted: revFmt }  = formatMoney(revenue);
  const { formatted: costFmt } = formatMoney(cropCost);
  const { formatted: prepFmt } = formatMoney(prepAlloc);

  const fieldCode = detail?.field_code;
  const area      = detail?.cultivated_area;

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

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{crop_name}</h1>
        {/* seed_category shown exactly as stored — NEVER translated */}
        {seed_cat && (
          <p className="text-sm text-gray-400 mt-0.5 font-mono">{seed_cat} · {seasonLabel}</p>
        )}
      </div>

      {/* ── HERO P&L PANEL ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm px-6 py-5 mb-6">

        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
          {S.pnlTitle}
        </p>

        {/* Big number */}
        <ProfitDisplay amount={profit} large revenue={revenue} cost={cropCost + prepAlloc} />

        {/* Breakdown */}
        <div className="border-t border-gray-100 mt-4 pt-1">

          {/* Revenue */}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">{S.revenue}</span>
            <span className={`text-sm tabular-nums ${revenue > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {revFmt}
            </span>
          </div>

          {/* Crop cost */}
          {cropCost > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{S.cropCost}</span>
              <span className="text-sm tabular-nums text-red-600">{costFmt}</span>
            </div>
          )}

          {/* Prep allocation — only show if >0 */}
          {prepAlloc > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{S.prepCost}</span>
              <span className="text-sm tabular-nums text-red-600">{prepFmt}</span>
            </div>
          )}

          {/* Divider + profit/loss bottom line */}
          <div className="border-t border-gray-200 mt-1 pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-900">
              {profit >= 0 ? S.profit : S.loss}
            </span>
            <ProfitDisplay amount={profit} />
          </div>
        </div>
      </div>

      {/* ── FIELDS ─────────────────────────────────────────────────────────── */}
      <Section title={S.fieldsHeading}>
        {fieldCode ? (
          <div className="flex justify-between items-center py-3">
            <span className="text-sm font-mono text-gray-700">{fieldCode}</span>
            {area != null && area > 0 && (
              <span className="text-sm text-gray-500">{S.acres(area)}</span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-3">—</p>
        )}
      </Section>

      {/* ── SALES ──────────────────────────────────────────────────────────── */}
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
                      <span className="text-sm text-gray-800 font-medium">
                        {sale.buyer || '—'}
                      </span>
                      <span className="text-xs text-gray-400">{channelLabel}</span>
                      <span className="text-xs text-gray-400">{sale.sale_date}</span>
                      <span className="text-xs text-gray-400">
                        {sale.quantity} {sale.unit} @ ₹{sale.rate}
                      </span>
                    </div>
                    {sale.notes && (
                      <p className="text-xs text-gray-400 italic mt-0.5 truncate">
                        {sale.notes}
                      </p>
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

                {/* Inline delete confirm */}
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

      {/* ── YIELDS ─────────────────────────────────────────────────────────── */}
      <Section title={S.yieldsHeading}>
        {/* TODO(3c): replace with yields list once GET /api/crop-cycles/{id}/yields exists */}
        <p className="text-sm text-gray-400 py-3">{S.noYields}</p>
      </Section>

    </div>
  );
}
