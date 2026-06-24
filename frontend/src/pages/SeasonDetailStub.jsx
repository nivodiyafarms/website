/**
 * SeasonDetailStub — placeholder for /season/:season/:crop_year
 * Real drilldown built in Slice 3b.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SEASONS, SEASON_DETAIL } from '../strings/hi';

const SEASON_NAMES = { kharif: SEASONS.kharif, rabi: SEASONS.rabi, zaid: SEASONS.zaid };

export default function SeasonDetailStub() {
  const { season, crop_year } = useParams();
  const navigate = useNavigate();
  const name = SEASON_NAMES[season] ?? season;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <button
        onClick={() => navigate('/seasons')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {SEASON_DETAIL.back}
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {name} {crop_year}
      </h1>

      <div className="mt-10 rounded-2xl bg-amber-50 border border-amber-100 p-8 text-center">
        <p className="text-5xl mb-4">🚧</p>
        <p className="text-xl font-bold text-amber-700">{SEASON_DETAIL.comingSoon}</p>
      </div>
    </div>
  );
}
