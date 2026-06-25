/**
 * CropVarietyPage — /season/:season/:crop_year/crop/:crop_name
 * Only reached when a crop has >1 cycle/variety.
 * Lists varieties with profit/loss + acres. Tap → /cycle/{id}.
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { ProfitDisplay } from '../utils/money';
import { SEASONS, VARIETY_LIST_STRINGS as S } from '../strings/hi';

export default function CropVarietyPage() {
  const { season, crop_year, crop_name } = useParams();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState([]);
  const [status, setStatus] = useState('loading');

  // React Router v6 gives decoded param automatically, but be explicit for safety
  const cropNameDecoded = decodeURIComponent(crop_name);
  const seasonLabel     = `${SEASONS[season] ?? season} ${crop_year}`;

  useEffect(() => {
    api.get(`/seasons/${season}/${crop_year}/summary`)
      .then(r => {
        const crop = (r.data.crops ?? []).find(c => c.crop_name === cropNameDecoded);
        setCycles(crop?.cycles ?? []);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, [season, crop_year, cropNameDecoded]);

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-8 md:pt-8">

      {/* Back */}
      <button
        onClick={() => navigate(`/season/${season}/${crop_year}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {seasonLabel}
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{cropNameDecoded}</h1>
      <p className="text-sm text-gray-400 mb-6">{seasonLabel}</p>

      <div className="space-y-3">
        {cycles.map(cy => (
          <button
            key={cy.crop_cycle_id}
            onClick={() =>
              navigate(`/cycle/${cy.crop_cycle_id}`, {
                state: {
                  season,
                  crop_year: Number(crop_year),
                  crop_name: cropNameDecoded,
                  seed_category: cy.seed_category,
                },
              })
            }
            className="w-full text-left bg-white border border-gray-200 rounded-2xl
              px-5 py-4 shadow-sm flex items-center gap-4
              hover:border-gray-300 active:scale-[0.98] transition-all duration-100"
          >
            {/* seed_category — NEVER translated */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 font-mono tracking-wide">
                {cy.seed_category}
              </p>
              <div className="mt-1">
                <ProfitDisplay amount={cy.profit} />
              </div>
            </div>
            {cy.allocated_acres_total > 0 && (
              <p className="text-sm text-gray-400 flex-shrink-0">
                {S.acres(cy.allocated_acres_total)}
              </p>
            )}
            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
