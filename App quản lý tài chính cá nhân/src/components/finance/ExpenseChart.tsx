// ─────────────────────────────────────────────────────────────────
//  ExpenseChart – Recharts donut + bar computed dynamically from DB
// ─────────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { cn, formatVND, formatCompact } from '../../utils/helpers';
import { useTransactions, useCategories } from '../../stores/useFinanceStore';
import { PieChart as PieChartIcon, Plus } from 'lucide-react';

type ChartMode = 'donut' | 'bar';

// ── Custom Tooltips ───────────────────────────────────────────────
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const { name, value, percent } = payload[0].payload;
    return (
      <div className="card px-3 py-2 text-xs shadow-xl border border-slate-700 bg-slate-900/90">
        <p className="font-semibold text-slate-100 mb-0.5">{name}</p>
        <p className="text-slate-300">{formatVND(value)}</p>
        {percent !== undefined && (
          <p className="text-slate-400">{(percent * 100).toFixed(1)}% tổng chi</p>
        )}
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="card px-3 py-2 text-xs shadow-xl border border-slate-700 space-y-1 bg-slate-900/90">
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

// ── Main Component ────────────────────────────────────────────────
export default function ExpenseChart() {
  const [mode, setMode] = useState<ChartMode>('donut');
  const transactions = useTransactions();
  const categories = useCategories();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 1. Dynamic Donut Data (Category Expenses for Active Month)
  const categoryExpenses = useMemo(() => {
    const expenseTx = transactions.filter((t) => t.type === 'expense');
    const catMap = new Map<string, number>();

    expenseTx.forEach((tx) => {
      catMap.set(tx.categoryId, (catMap.get(tx.categoryId) || 0) + tx.amount);
    });

    const result: { name: string; value: number; color: string }[] = [];
    catMap.forEach((val, catId) => {
      const cat = categories.find((c) => c.id === catId);
      result.push({
        name: cat?.name || 'Khác',
        value: val,
        color: cat?.color || '#818cf8',
      });
    });

    return result.sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const totalExpense = useMemo(() => {
    return categoryExpenses.reduce((s, d) => s + d.value, 0);
  }, [categoryExpenses]);

  // 2. Dynamic Monthly Bar Chart Data
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { income: number; expenses: number }>();
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `Thg ${d.getMonth() + 1}`;
      monthMap.set(key, { income: 0, expenses: 0 });
    }

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `Thg ${d.getMonth() + 1}`;
      if (monthMap.has(key)) {
        const curr = monthMap.get(key)!;
        if (tx.type === 'income') curr.income += tx.amount;
        if (tx.type === 'expense') curr.expenses += tx.amount;
      }
    });

    return Array.from(monthMap.entries()).map(([month, val]) => ({
      month,
      income: val.income,
      expenses: val.expenses,
      savings: Math.max(0, val.income - val.expenses),
    }));
  }, [transactions]);

  return (
    <div className="card p-6 flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Phân tích chi tiêu</h3>
          <p className="text-xs text-slate-400 mt-0.5">Biểu đồ thống kê dữ liệu thực tế</p>
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

      {/* Chart Area */}
      {mode === 'donut' ? (
        categoryExpenses.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl">
            <PieChartIcon className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-300">Chưa có dữ liệu chi tiêu</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Hãy thêm giao dịch chi tiêu đầu tiên để xem phân tích biểu đồ danh mục
            </p>
            <a
              href="/transactions"
              className="inline-flex items-center gap-1.5 mt-4 btn-brand text-xs px-4 py-2 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm giao dịch
            </a>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-6 py-2">
            {/* Donut Chart */}
            <div className="relative w-52 h-52 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryExpenses}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, i) => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {categoryExpenses.map((entry, i) => (
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

              {/* Center Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] text-slate-500 font-medium">Tổng chi</p>
                <p className="text-sm font-bold text-slate-100">{formatCompact(totalExpense)}đ</p>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 flex-1 w-full">
              {categoryExpenses.map((item, i) => {
                const pct = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(1) : '0';
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
        )
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 12 }}
            />
            <Bar dataKey="income" name="Thu nhập" fill="#4ade80" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Chi tiêu" fill="#f87171" radius={[4, 4, 0, 0]} />
            <Bar dataKey="savings" name="Tiết kiệm" fill="#818cf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
