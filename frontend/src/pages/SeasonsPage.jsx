/**
 * SeasonsPage — फसल tab landing screen
 * Fetches GET /api/seasons/summary → one card per (season, crop_year).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { APP_NAME, SEASONS } from '../strings/hi';

// ── Season visual config ────────────────────────────────────────────────────
const SEASON_CONFIG = {
  kharif: {
    emoji:      '☔',
    nameKey:    'kharif',
    subKey:     'kharifSub',
    gradient:   'from-blue-500 to-cyan-400',
    lightBg:    'bg-blue-50',
    border:     'border-blue-100',
    accentText: 'text-blue-700',
    badgeBg:    'bg-blue-100',
    badgeText:  'text-blue-800',
    iconBg:     'bg-blue-100',
  },
  rabi: {
    emoji:      '❄️',
    nameKey:    'rabi',
    subKey:     'rabiSub',
    gradient:   'from-indigo-500 to-violet-400',
    lightBg:    'bg-indigo-50',
    border:     'border-indigo-100',
    accentText: 'text-indigo-700',
    badgeBg:    'bg-indigo-100',
    badgeText:  'text-indigo-800',
    iconBg:     'bg-indigo-100',
  },
  zaid: {
    emoji:      '☀️',
    nameKey:    'zaid',
    subKey:     'zaidSub',
    gradient:   'from-amber-400 to-orange-400',
    lightBg:    'bg-amber-50',
    border:     'border-amber-100',
    accentText: 'text-amber-700',
    badgeBg:    'bg-amber-100',
    badgeText:  'text-amber-800',
    iconBg:     'bg-amber-100',
  },
};

const DEFAULT_CONFIG = {
  emoji:      '🌾',
  nameKey:    null,
  subKey:     null,
  gradient:   'from-green-500 to-emerald-400',
  lightBg:    'bg-green-50',
  border:     'border-green-100',
  accentText: 'text-green-700',
  badgeBg:    'bg-green-100',
  badgeText:  'text-green-800',
  iconBg:     'bg-green-100',
};

function SeasonCard({ season, crop_year, label, cycle_count }) {
  const navigate = useNavigate();
  const cfg = SEASON_CONFIG[season] ?? DEFAULT_CONFIG;
  const hindiName = cfg.nameKey ? SEASONS[cfg.nameKey] : label;
  const sub       = cfg.subKey  ? SEASONS[cfg.subKey]  : '';

  return (
    <button
      onClick={() => navigate(`/season/${season}/${crop_year}`)}
      className={`w-full text-left rounded-2xl border ${cfg.border} ${cfg.lightBg}
        shadow-sm active:shadow-none active:scale-[0.98] transition-all duration-150
        flex items-center gap-4 px-5 py-4 md:py-5`}
    >
      {/* Emoji badge */}
      <div className={`${cfg.iconBg} rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0 text-3xl`}>
        {cfg.emoji}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-xl font-bold ${cfg.accentText} leading-tight`}>
          {hindiName} {crop_year}
        </p>
        {sub && (
          <p className="text-sm text-gray-500 mt-0.5">{sub}</p>
        )}
        <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
          {SEASONS.cycleCount(cycle_count)}
        </span>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 h-24 animate-pulse" />
      ))}
    </div>
  );
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error

  const fetchSeasons = async () => {
    setStatus('loading');
    try {
      const res = await api.get('/seasons/summary');
      setSeasons(res.data);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => { fetchSeasons(); }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 md:pt-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
        <p className="text-base text-gray-500 mt-1">{SEASONS.prompt}</p>
      </div>

      {/* Loading */}
      {status === 'loading' && <LoadingSkeleton />}

      {/* Error */}
      {status === 'error' && (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
          <p className="text-red-600 font-medium whitespace-pre-line">{SEASONS.error}</p>
          <button
            onClick={fetchSeasons}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            {SEASONS.retry}
          </button>
        </div>
      )}

      {/* Empty */}
      {status === 'ok' && seasons.length === 0 && (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 text-center">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-gray-500">{SEASONS.empty}</p>
        </div>
      )}

      {/* Season cards */}
      {status === 'ok' && seasons.length > 0 && (
        <div className="space-y-4">
          {seasons.map(s => (
            <SeasonCard key={`${s.season}-${s.crop_year}`} {...s} />
          ))}
        </div>
      )}
    </div>
  );
}
