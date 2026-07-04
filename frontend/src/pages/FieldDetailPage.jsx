import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { formatMoney } from '../utils/money';
import { SEASONS, FIELD_DETAIL as S, FIELD_DETAIL_PREP as PS } from '../strings/hi';

function seasonLabel(season, year) {
  if (!season && !year) return null;
  const s = SEASONS[season] ?? season ?? '';
  return [s, year].filter(Boolean).join(' ');
}

export default function FieldDetailPage() {
  const { field_id } = useParams();
  const navigate = useNavigate();

  const [data,    setData]    = useState(null);
  const [status,  setStatus]  = useState('loading');
  const [deletingId, setDeletingId]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(() => {
    setStatus('loading');
    api.get(`/fields/${field_id}/prep-work`)
      .then(r => { setData(r.data); setStatus('ok'); })
      .catch(() => setStatus('error'));
  }, [field_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(wo) {
    setDeleteLoading(true);
    try {
      await api.delete(`/fields/${field_id}/prep-work/${wo.work_order_id}`);
      setDeletingId(null);
      fetchData();
    } catch {
      alert('हटाने में दिक्कत हो गई।');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        <div className="h-8 w-40 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-16 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        <p className="text-red-500">कुछ गड़बड़ हो गई।</p>
        <button onClick={() => navigate('/fields')} className="mt-3 text-sm text-gray-400 underline">
          {S.back}
        </button>
      </div>
    );
  }

  const { name, area_acre, total_prep_cost, work_orders } = data;
  const { formatted: totalFmt } = formatMoney(total_prep_cost);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-10 md:pt-8">

      {/* Back */}
      <button
        onClick={() => navigate('/fields')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {S.back}
      </button>

      {/* Header: field_id bold primary, name muted below */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-mono text-gray-900 leading-tight">{field_id}</h1>
        {name && (
          <p className="text-sm text-gray-500 mt-0.5">{name}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{S.acres(area_acre)}</p>
      </div>

      {/* ── Prep cost summary panel ───────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm px-6 py-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          {S.prepHeading}
        </p>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">{S.prepSubLabel}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-800">{S.totalPrepCost}</span>
          <span className={`text-xl font-bold tabular-nums ${total_prep_cost > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {totalFmt}
          </span>
        </div>
      </div>

      {/* ── Prep work orders list ─────────────────────────────────────────── */}
      <div className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
          {S.prepHeading}
        </h2>

        {work_orders.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-200 px-4 py-6 text-center">
            <p className="text-sm text-gray-400 mb-4">{S.emptyState}</p>
            <button
              onClick={() => navigate(`/fields/${field_id}/prep/new`)}
              className="inline-block rounded-xl bg-orange-500 text-white text-sm font-semibold px-5 py-2.5
                hover:bg-orange-600 transition-colors"
            >
              {PS.addBtn}
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
              {work_orders.map(wo => {
                const tag = seasonLabel(wo.prep_season, wo.prep_crop_year);
                const { formatted: woFmt } = formatMoney(wo.cost);
                const isDeleting = deletingId === wo.work_order_id;

                return (
                  <div key={wo.work_order_id} className="px-4 py-3.5">
                    {/* Delete confirm inline */}
                    {isDeleting ? (
                      <div className="flex items-center justify-between gap-3 py-1">
                        <p className="text-sm text-gray-700">{PS.deleteConfirm}</p>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleDelete(wo)}
                            disabled={deleteLoading}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {PS.deleteYes}
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            {PS.deleteNo}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 leading-snug">
                            {wo.description}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">
                              {wo.work_order_number}
                            </span>
                            {tag ? (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                {tag}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300 italic">
                                {S.untagged}
                              </span>
                            )}
                          </div>
                          {/* Resource breakdown */}
                          {wo.resources?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {wo.resources.map((r, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                  {r.name} ₹{r.cost.toLocaleString('hi-IN')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                          <span className="text-sm font-semibold text-orange-600 tabular-nums">
                            {woFmt}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(
                                `/fields/${field_id}/prep/${wo.work_order_id}/allocate`,
                                { state: { prepWO: wo } }
                              )}
                              className="text-xs text-orange-600 hover:text-orange-800 font-semibold"
                            >
                              {PS.allocBtn}
                            </button>
                            <button
                              onClick={() => navigate(
                                `/fields/${field_id}/prep/${wo.work_order_id}/edit`,
                                { state: { prepWO: wo } }
                              )}
                              className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                            >
                              {PS.editBtn}
                            </button>
                            <button
                              onClick={() => setDeletingId(wo.work_order_id)}
                              className="text-xs text-red-400 hover:text-red-600 font-medium"
                            >
                              {PS.deleteBtn}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add button at bottom of list */}
            <button
              onClick={() => navigate(`/fields/${field_id}/prep/new`)}
              className="mt-3 w-full rounded-xl border-2 border-dashed border-orange-300 py-3
                text-sm font-semibold text-orange-500 hover:border-orange-400 hover:bg-orange-50
                transition-colors"
            >
              {PS.addBtn}
            </button>
          </>
        )}
      </div>

    </div>
  );
}
