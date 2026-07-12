// ─────────────────────────────────────────────────────────────────
//  HabitAnalysis – Spending behavior analysis component
// ─────────────────────────────────────────────────────────────────
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Clock, ShoppingBag } from 'lucide-react';
import { cn, formatVND, formatCompact } from '../../utils/helpers';
import { useSpendingHabits, useCategories } from '../../stores/useFinanceStore';
import { mockMonthlyData } from '../../data/mockData';
import type { SpendingHabit } from '../../types/finance';

// ── Day heatmap data ──────────────────────────────────────────────
const dayHeatmapData = [
  { day: 'CN', hours: [0,0,0,0,0,0,0,0,1,1,2,3,2,1,1,2,1,0,1,2,3,2,1,0] },
  { day: 'T2', hours: [0,0,0,0,0,0,1,2,1,0,0,0,1,2,1,0,0,1,0,0,0,0,0,0] },
  { day: 'T3', hours: [0,0,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,0,0,1,0,0,0,0] },
  { day: 'T4', hours: [0,0,0,0,0,0,0,1,0,0,0,1,2,1,0,0,1,0,0,0,0,0,0,0] },
  { day: 'T5', hours: [0,0,0,0,0,0,0,1,1,0,0,0,1,1,1,0,0,0,1,1,0,0,0,0] },
  { day: 'T6', hours: [0,0,0,0,0,0,1,1,0,0,1,1,2,1,2,2,3,2,3,4,3,2,1,0] },
  { day: 'T7', hours: [0,0,0,0,0,0,1,2,3,2,3,2,2,3,2,3,4,3,4,5,4,3,2,1] },
];

// ── Radar chart data (spending balance) ──────────────────────────
const radarData = [
  { subject: 'Ăn uống',    score: 70 },
  { subject: 'Mua sắm',    score: 85 },
  { subject: 'Giải trí',   score: 55 },
  { subject: 'Tiết kiệm',  score: 40 },
  { subject: 'Đầu tư',     score: 60 },
  { subject: 'Sức khỏe',   score: 30 },
];

// ── Trend Icon ────────────────────────────────────────────────────
function TrendIcon({ trend, pct }: { trend: SpendingHabit['trend']; pct: number }) {
  if (trend === 'increasing') return (
    <span className="flex items-center gap-0.5 text-danger-400 text-[11px] font-medium">
      <TrendingUp className="w-3 h-3" />+{pct}%
    </span>
  );
  if (trend === 'decreasing') return (
    <span className="flex items-center gap-0.5 text-success-400 text-[11px] font-medium">
      <TrendingDown className="w-3 h-3" />{pct}%
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-slate-400 text-[11px]">
      <Minus className="w-3 h-3" />Ổn định
    </span>
  );
}

// ── Category Habit Row ────────────────────────────────────────────
function HabitRow({ habit, categoryName, categoryColor }: {
  habit: SpendingHabit;
  categoryName: string;
  categoryColor: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-800/50 last:border-none">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${categoryColor}20` }}
      >
        <ShoppingBag className="w-3.5 h-3.5" style={{ color: categoryColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-200">{categoryName}</p>
        <p className="text-[10px] text-slate-500">TB: {formatVND(habit.averageMonthly)}/tháng</p>
      </div>
      <TrendIcon trend={habit.trend} pct={Math.abs(habit.trendPercentage)} />
    </div>
  );
}

// ── Spending Heatmap ──────────────────────────────────────────────
function SpendingHeatmap() {
  const getColor = (val: number) => {
    if (val === 0) return 'bg-slate-800/50';
    if (val === 1) return 'bg-brand-500/25';
    if (val === 2) return 'bg-brand-500/50';
    if (val === 3) return 'bg-brand-500/75';
    return 'bg-brand-500';
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-slate-400" />
        <h4 className="text-xs font-semibold text-slate-300">Mật độ chi tiêu theo giờ</h4>
      </div>
      <div className="space-y-1">
        {dayHeatmapData.map((row) => (
          <div key={row.day} className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 w-4 flex-shrink-0">{row.day}</span>
            <div className="flex gap-0.5 flex-1">
              {row.hours.map((val, h) => (
                <div
                  key={h}
                  title={`${row.day} ${h}:00 – mức ${val}`}
                  className={cn('h-3 rounded-sm flex-1 transition-all hover:opacity-80 cursor-pointer', getColor(val))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-[10px] text-slate-500">Ít</span>
        {[0, 1, 2, 3, 4].map((v) => (
          <div key={v} className={cn('w-3 h-3 rounded-sm', getColor(v))} />
        ))}
        <span className="text-[10px] text-slate-500">Nhiều</span>
      </div>
    </div>
  );
}

// ── Area chart custom tooltip ─────────────────────────────────────
const AreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="card px-3 py-2 text-xs border border-slate-700 shadow-xl">
        <p className="font-medium text-slate-200 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCompact(p.value)}đ</p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Main Component ────────────────────────────────────────────────
export default function HabitAnalysis() {
  const habits     = useSpendingHabits();
  const categories = useCategories();

  const getCat = (id: string) => categories.find((c) => c.id === id);

  return (
    <div className="space-y-5">
      {/* Spending trend area chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-1">Xu hướng chi tiêu 6 tháng</h3>
        <p className="text-xs text-slate-500 mb-4">So sánh thu – chi – tiết kiệm</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={mockMonthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f87171" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<AreaTooltip />} />
            <Area type="monotone" dataKey="income"   name="Thu nhập" stroke="#4ade80" fill="url(#incomeGrad)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="expenses" name="Chi tiêu" stroke="#f87171" fill="url(#expGrad)"    strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Radar chart */}
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-slate-100 mb-1">Chân dung chi tiêu</h4>
          <p className="text-xs text-slate-500 mb-3">Điểm theo danh mục (0–100)</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name="Chi tiêu" dataKey="score" stroke="#818cf8" fill="#818cf8" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Habit rows */}
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-slate-100 mb-4">Xu hướng theo danh mục</h4>
          <div>
            {habits.map((h) => {
              const cat = getCat(h.categoryId);
              return cat ? (
                <HabitRow
                  key={h.categoryId}
                  habit={h}
                  categoryName={cat.name}
                  categoryColor={cat.color}
                />
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card p-5">
        <SpendingHeatmap />
      </div>
    </div>
  );
}
