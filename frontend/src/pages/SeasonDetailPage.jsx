/**
 * SeasonDetailPage — /season/:season/:crop_year
 * Lists crops in this season, each with rolled-up profit/loss.
 * Tap a crop → direct to /cycle/{id} if 1 variety, else → variety list.
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Plus } from 'lucide-react';
import api from '../services/api';
import { ProfitDisplay } from '../utils/money';
import { SEASONS, SEASON_DETAIL_CROPS as S, GENERAL } from '../strings/hi';

export default function SeasonDetailPage() {
  const { season, crop_year } = useParams();
  const navigate  = useNavigate();
  const [data, setData]     = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    api.get(`/seasons/${season}/${crop_year}/summary`)
      .then(r => { setData(r.data); setStatus('ok'); })
      .catch(() => setStatus('error'));
  }, [season, crop_year]);

  const seasonLabel = `${SEASONS[season] ?? season} ${crop_year}`;

  const handleCropTap = (crop) => {
    if (crop.cycles.length === 1) {
      const cy = crop.cycles[0];
      navigate(`/cycle/${cy.crop_cycle_id}`, {
        state: {
          season,
          crop_year: Number(crop_year),
          crop_name: crop.crop_name,
          seed_category: cy.seed_category,
        },
      });
    } else {
      navigate(
        `/season/${season}/${crop_year}/crop/${encodeURIComponent(crop.crop_name)}`
      );
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 text-center">
        <p className="text-red-600">{GENERAL.error}</p>
      </div>
    );
  }

  const prep = data.prep_overhead ?? {};
  const fmt  = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-8 md:pt-8">

      {/* Back */}
      <button
        onClick={() => navigate('/seasons')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {S.back}
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{seasonLabel}</h1>
        <button
          onClick={() => navigate(`/season/${season}/${crop_year}/new-cycle`)}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600
                     text-white text-sm font-semibold rounded-xl px-3 py-2 transition"
        >
          <Plus className="w-4 h-4" />
          {S.addCycle}
        </button>
      </div>

      {/* Crop rows */}
      <div className="space-y-3">
        {(data.crops ?? []).map(crop => {
          const totalProfit  = crop.cycles.reduce((sum, cy) => sum + (cy.profit     ?? 0), 0);
          const totalRevenue = crop.cycles.reduce((sum, cy) => sum + (cy.revenue    ?? 0), 0);
          const totalCost    = crop.cycles.reduce((sum, cy) => sum + (cy.total_cost ?? 0), 0);
          const n = crop.cycles.length;
          return (
            <button
              key={crop.crop_name}
              onClick={() => handleCropTap(crop)}
              className="w-full text-left bg-white border border-gray-200 rounded-2xl
                px-5 py-4 shadow-sm flex items-center gap-4
                hover:border-gray-300 active:scale-[0.98] transition-all duration-100"
            >
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-gray-900">{crop.crop_name}</p>
                <div className="mt-1">
                  <ProfitDisplay amount={totalProfit} revenue={totalRevenue} cost={totalCost} />
                </div>
              </div>
              <p className="text-sm text-gray-400 flex-shrink-0">{S.cycleCount(n)}</p>
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Prep overhead strip */}
      <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          {S.prepHeading}
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-semibold text-gray-700">{fmt(prep.total_prep_cost)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{S.prepTotal}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">{fmt(prep.total_allocated)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{S.prepAllocated}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">{fmt(prep.unallocated_remainder)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{S.prepUnallocated}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
