// ─────────────────────────────────────────────────────────────────
//  ExpenseChart – Recharts donut + bar for category spending
// ─────────────────────────────────────────────────────────────────
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { useState } from 'react';
import { cn, formatVND, formatCompact } from '../../utils/helpers';
import { mockCategoryExpenses, mockMonthlyData } from '../../data/mockData';

type ChartMode = 'donut' | 'bar';

// ── Custom Tooltip ────────────────────────────────────────────────
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const { name, value, percent } = payload[0].payload;
    return (
      <div className="card px-3 py-2 text-xs shadow-xl border border-slate-700">
        <p className="font-semibold text-slate-100 mb-0.5">{name}</p>
        <p className="text-slate-300">{formatVND(value)}</p>
        <p className="text-slate-400">{(percent * 100).toFixed(1)}% tổng chi</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="card px-3 py-2 text-xs shadow-xl border border-slate-700 space-y-1">
        <p className="font-semibold text-slate-100">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {formatCompact(p.value)}đ
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Donut Chart ───────────────────────────────────────────────────
function DonutChart() {
  const total = mockCategoryExpenses.reduce((s, d) => s + d.value, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Chart */}
      <div className="relative w-52 h-52 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={mockCategoryExpenses}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {mockCategoryExpenses.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                  stroke="transparent"
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] text-slate-500 font-medium">Tổng chi</p>
          <p className="text-sm font-bold text-slate-100">{formatCompact(total)}đ</p>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 flex-1">
        {mockCategoryExpenses.map((item, i) => {
          const pct = ((item.value / total) * 100).toFixed(1);
          return (
            <div
              key={item.name}
              className="flex items-center gap-2 cursor-pointer group"
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{item.name}</p>
                <p className="text-[10px] text-slate-500">{pct}% · {formatCompact(item.value)}đ</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────
function MonthlyBarChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={mockMonthlyData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 12 }}
        />
        <Bar dataKey="income"   name="Thu nhập"  fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Chi tiêu"  fill="#f87171" radius={[4, 4, 0, 0]} />
        <Bar dataKey="savings"  name="Tiết kiệm" fill="#818cf8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function ExpenseChart() {
  const [mode, setMode] = useState<ChartMode>('donut');

  return (
    <div className="card p-6 flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Phân tích chi tiêu</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tháng 7/2025</p>
        </div>
        <div className="flex items-center bg-surface-950 rounded-xl p-1 gap-1 border border-slate-800">
          {(['donut', 'bar'] as ChartMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200',
                mode === m
                  ? 'bg-brand-500 text-white shadow-glow-brand'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {m === 'donut' ? 'Danh mục' : 'Theo tháng'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="transition-all duration-300">
        {mode === 'donut' ? <DonutChart /> : <MonthlyBarChart />}
      </div>
    </div>
  );
}

