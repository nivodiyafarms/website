import React from 'react';
import { GENERAL } from '../strings/hi';

/**
 * Shared money formatting — single source of truth.
 * All amounts in Indian Rupees. Use for every profit/cost display.
 */

export function formatMoney(amount) {
  const n = Number(amount) || 0;
  const abs = Math.abs(n);
  const formatted = '₹' + abs.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return { value: n, formatted, isNeg: n < 0, isZero: n === 0 };
}

/**
 * Colored profit/loss display with ▲/▼ arrow.
 *
 * Optional props `revenue` and `cost` (both numbers) activate the "बिक्री बाकी" tag:
 *   - revenue === 0 AND cost > 0  →  tag shows (mid-flight crop, money out, no sale yet)
 *   - revenue > 0                 →  no tag (real P&L, stands alone)
 *   - cost === 0                  →  no tag (nothing has happened yet)
 * Tag is muted gray — informational, not alarming. Logic lives here so every
 * caller (season detail, cycle detail, future 3c screens) stays consistent.
 */
export function ProfitDisplay({ amount, large = false, revenue, cost }) {
  const { formatted, isNeg, isZero } = formatMoney(amount);
  const color   = isZero ? 'text-gray-400' : isNeg ? 'text-red-600' : 'text-green-600';
  const arrow   = isZero ? '' : isNeg ? '▼ ' : '▲ ';
  const sizeCls = large
    ? 'text-3xl md:text-4xl font-bold tracking-tight'
    : 'text-base font-semibold';

  const showTag = revenue !== undefined && cost !== undefined
    && Number(revenue) === 0 && Number(cost) > 0;

  return (
    <span className="inline-flex items-baseline gap-2 flex-wrap">
      <span className={`${color} ${sizeCls} tabular-nums`}>
        {arrow}{formatted}
      </span>
      {showTag && (
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full leading-none">
          {GENERAL.salePending}
        </span>
      )}
    </span>
  );
}
