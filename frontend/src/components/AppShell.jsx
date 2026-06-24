/**
 * AppShell — responsive nav shell
 *
 * Mobile  (<768px / below md): top header + scrollable content + fixed bottom nav
 * Desktop (≥768px / md+):      left sidebar + scrollable content, no bottom bar
 *
 * Same component tree — only Tailwind responsive prefixes swap chrome.
 */
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wheat, MapPin, Receipt, Map, LogOut, Sprout, Mic } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME, APP_TAGLINE, NAV, GENERAL } from '../strings/hi';

const NAV_ITEMS = [
  { path: '/seasons',         labelKey: 'crops',   Icon: Wheat,    emoji: '🌾' },
  { path: '/fields',          labelKey: 'fields',  Icon: MapPin,   emoji: '🗺️' },
  { path: '/general-purpose', labelKey: 'expense', Icon: Receipt,  emoji: '💰' },
  { path: '/farm-map',        labelKey: 'map',     Icon: Map,      emoji: '📍' },
];

function useActiveNav() {
  const { pathname } = useLocation();
  return (path) => {
    if (path === '/seasons') return pathname === '/seasons' || pathname.startsWith('/season/');
    return pathname === path || pathname.startsWith(path + '/');
  };
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isActive = useActiveNav();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 md:flex-row flex-col">

      {/* ── Desktop sidebar (hidden on mobile) ──────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-60 bg-white border-r border-gray-100 shadow-sm flex-shrink-0">

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="bg-green-600 p-2 rounded-xl">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{APP_NAME}</p>
            <p className="text-xs text-gray-400">{APP_TAGLINE}</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ path, labelKey, Icon }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${active
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-green-600' : 'text-gray-400'}`} />
                {NAV[labelKey]}
              </Link>
            );
          })}
        </nav>

        {/* Voice entry placeholder (future Sarvam/WhatsApp) */}
        <div className="mx-3 mb-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <button disabled
            className="w-full flex items-center gap-2 text-xs text-amber-600 cursor-not-allowed"
            title={GENERAL.voiceComingSoon}
          >
            <Mic className="w-4 h-4" />
            <span>{GENERAL.voiceComingSoon}</span>
          </button>
        </div>

        {/* User + logout */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          {user && (
            <p className="text-xs text-gray-400 truncate mb-2">{user.name} · {user.role}</p>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {GENERAL.logout}
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Mobile top header (hidden on desktop) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-1.5 rounded-lg">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">{APP_NAME}</span>
          </div>
          {user && (
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </header>

        {/* Page content — pb-20 leaves room above mobile bottom nav */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* ── Mobile bottom nav (hidden on desktop) ──────────────────────── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 shadow-lg z-40">
          <div className="grid grid-cols-4 h-16">
            {NAV_ITEMS.map(({ path, labelKey, Icon }) => {
              const active = isActive(path);
              return (
                <Link key={path} to={path}
                  className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors
                    ${active ? 'text-green-700' : 'text-gray-400'}`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${active ? 'text-green-700' : 'text-gray-500'}`}>
                    {NAV[labelKey]}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 w-8 h-0.5 bg-green-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

    </div>
  );
}
