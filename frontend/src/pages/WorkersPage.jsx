import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { WORKERS_PAGE as S } from '../strings/hi';

export default function WorkersPage() {
  const navigate = useNavigate();
  const [workers,       setWorkers]       = useState([]);
  const [status,        setStatus]        = useState('loading');
  const [confirmId,     setConfirmId]     = useState(null);   // worker_id pending deactivate confirm
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWorkers = useCallback(() => {
    setStatus('loading');
    api.get('/workers/')
      .then(r => { setWorkers(r.data ?? []); setStatus('ok'); })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  async function handleDeactivate(w) {
    setActionLoading(true);
    try {
      await api.patch(`/workers/${w.worker_id}/deactivate`);
      setConfirmId(null);
      fetchWorkers();
    } catch {
      alert('कुछ गड़बड़ हो गई।');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleActivate(w) {
    setActionLoading(true);
    try {
      await api.patch(`/workers/${w.worker_id}/activate`);
      fetchWorkers();
    } catch {
      alert('कुछ गड़बड़ हो गई।');
    } finally {
      setActionLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-3">
        <div className="h-7 w-32 rounded-lg bg-gray-100 animate-pulse mb-5" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        <p className="text-red-500">{S.error}</p>
        <button onClick={fetchWorkers} className="mt-3 text-sm text-gray-400 underline">
          फिर से कोशिश करो
        </button>
      </div>
    );
  }

  const active   = workers.filter(w => w.active);
  const inactive = workers.filter(w => !w.active);

  function WorkerRow({ w }) {
    const isConfirming = confirmId === w.worker_id;
    const roleLabel = S.roles[w.role] ?? w.role;
    const roleColor = S.roleBadgeColors[w.role] ?? 'bg-gray-100 text-gray-600';

    return (
      <div className={`px-4 py-3.5 ${!w.active ? 'opacity-50' : ''}`}>
        {isConfirming ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-700">{S.deactivateConfirm}</p>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => handleDeactivate(w)}
                disabled={actionLoading}
                className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {S.deactivateYes}
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {S.deactivateNo}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            {/* Left: name + number + badges */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-semibold ${w.active ? 'text-gray-900' : 'text-gray-500'}`}>
                  {w.name}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor}`}>
                  {roleLabel}
                </span>
                {!w.active && (
                  <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                    {S.inactive}
                  </span>
                )}
              </div>
              {w.whatsapp_number && (
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{w.whatsapp_number}</p>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => navigate(`/workers/${w.worker_id}/edit`, { state: { worker: w } })}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium"
              >
                {S.editBtn}
              </button>
              {w.active ? (
                <button
                  onClick={() => setConfirmId(w.worker_id)}
                  className="text-xs text-red-400 hover:text-red-600 font-medium"
                >
                  {S.deactivateBtn}
                </button>
              ) : (
                <button
                  onClick={() => handleActivate(w)}
                  disabled={actionLoading}
                  className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                >
                  {S.activateBtn}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-10 md:pt-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">{S.heading}</h1>
        <button
          onClick={() => navigate('/workers/new')}
          className="rounded-xl bg-orange-500 text-white text-sm font-semibold px-4 py-2
            hover:bg-orange-600 transition-colors"
        >
          {S.addBtn}
        </button>
      </div>

      {workers.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 px-4 py-8 text-center">
          <p className="text-sm text-gray-400 mb-4">{S.empty}</p>
          <button
            onClick={() => navigate('/workers/new')}
            className="rounded-xl bg-orange-500 text-white text-sm font-semibold px-5 py-2.5
              hover:bg-orange-600 transition-colors"
          >
            {S.addBtn}
          </button>
        </div>
      ) : (
        <>
          {/* Active workers */}
          {active.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100 mb-4">
              {active.map(w => <WorkerRow key={w.worker_id} w={w} />)}
            </div>
          )}

          {/* Inactive workers */}
          {inactive.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
                {S.inactive}
              </p>
              <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
                {inactive.map(w => <WorkerRow key={w.worker_id} w={w} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
