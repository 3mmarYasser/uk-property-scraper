'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PriceHistoryPoint } from '../lib/api';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { price, date, change } = payload[0].payload;
  return (
    <div
      style={{
        background: 'var(--elevated)',
        border: '1px solid var(--line-2)',
        borderRadius: 10,
        padding: '9px 12px',
        boxShadow: 'var(--shadow-2)',
      }}
    >
      <div className="num" style={{ fontSize: 15, fontWeight: 600 }}>
        £{price.toLocaleString('en-GB')}
      </div>
      <div className="muted-2" style={{ fontSize: 11.5, marginTop: 2 }}>
        {date} · {change}
      </div>
    </div>
  );
}

export function PriceChart({ history }: { history: PriceHistoryPoint[] }) {
  if (!history || history.length === 0) {
    return <p className="muted-2">No price history recorded yet.</p>;
  }

  const data = history.map((h) => ({
    date: fmtDate(h.recordedAt),
    price: h.price,
    change: h.changeType === 'INITIAL' ? 'First listed' : h.changeType === 'DECREASE' ? 'Reduced' : 'Increased',
  }));

  // A single data point can't draw a meaningful line; show the listed price instead.
  if (data.length === 1) {
    return (
      <div className="muted" style={{ fontSize: 14 }}>
        Listed at <span className="num" style={{ color: 'var(--text)', fontWeight: 600 }}>£{data[0].price.toLocaleString('en-GB')}</span>{' '}
        on {data[0].date}. No changes since — we&apos;ll plot the trend here once the price moves.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="date" stroke="var(--text-3)" fontSize={11.5} tickLine={false} axisLine={false} dy={6} />
        <YAxis
          stroke="var(--text-3)"
          fontSize={11.5}
          width={56}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--line-2)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="price"
          stroke="var(--accent-2)"
          strokeWidth={2}
          fill="url(#priceFill)"
          dot={{ r: 3, fill: 'var(--accent-2)', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: 'var(--accent-2)', stroke: 'var(--bg)', strokeWidth: 2 }}
          animationDuration={700}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
