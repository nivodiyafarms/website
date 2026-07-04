/**
 * FieldsPage — /fields
 * Screen 1: list all farm fields with live prep-cost summary.
 * Tap → FieldDetailPage at /fields/:field_id
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import api from '../services/api';
import { formatMoney } from '../utils/money';
import { FIELDS_PAGE as S } from '../strings/hi';

export default function FieldsPage() {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [status, setStatus]   = useState('loading');

  useEffect(() => {
    api.get('/fields/summary')
      .then(r => { setFields(r.data ?? []); setStatus('ok'); })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-3">
        <div className="h-7 w-24 rounded-lg bg-gray-100 animate-pulse mb-5" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        <p className="text-red-500">{S.error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-10 md:pt-8">

      <h1 className="text-2xl font-bold text-gray-900 mb-5">{S.heading}</h1>

      {fields.length === 0 ? (
        <p className="text-sm text-gray-400 text-center pt-12">{S.empty}</p>
      ) : (
        <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100 shadow-sm">
          {fields.map(f => {
            const { formatted: costFmt } = formatMoney(f.prep_cost);
            return (
              <button
                key={f.field_id}
                onClick={() => navigate(`/fields/${f.field_id}`)}
                className="w-full flex items-center justify-between px-4 py-4
                  hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold font-mono text-gray-900 leading-snug">
                    {f.field_id}
                  </p>
                  {f.name && (
                    <p className="text-xs text-gray-500 leading-snug">{f.name}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {S.acres(f.area_acre)}
                    {f.village ? ` · ${f.village}` : ''}
                  </p>
                  {f.prep_cost > 0 && (
                    <p className="text-xs text-orange-600 mt-0.5 font-medium">
                      {S.prepCostLabel} {costFmt}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 ml-3" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
