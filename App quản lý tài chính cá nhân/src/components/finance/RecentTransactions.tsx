// ─────────────────────────────────────────────────────────────────
//  RecentTransactions – Timeline view of latest transactions
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  Search, ChevronRight,
} from 'lucide-react';
import { cn, formatVND, formatRelativeTime } from '../../utils/helpers';
import { useTransactions, useCategories } from '../../stores/useFinanceStore';
import type { Transaction, TransactionType } from '../../types/finance';

// ── Transaction Row ───────────────────────────────────────────────
function TransactionRow({ tx, categoryName, categoryColor }: {
  tx: Transaction;
  categoryName: string;
  categoryColor: string;
}) {
  const isIncome = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';

  return (
    <div className="flex items-center gap-3 py-3 px-1 hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer group">
      {/* Category icon dot */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${categoryColor}20`, border: `1px solid ${categoryColor}40` }}
      >
        {isIncome    && <ArrowDownLeft  className="w-4 h-4" style={{ color: categoryColor }} />}
        {isTransfer  && <ArrowLeftRight className="w-4 h-4" style={{ color: categoryColor }} />}
        {!isIncome && !isTransfer && <ArrowUpRight className="w-4 h-4" style={{ color: categoryColor }} />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{tx.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
            style={{ color: categoryColor, backgroundColor: `${categoryColor}15` }}
          >
            {categoryName}
          </span>
          <span className="text-[10px] text-slate-500">{formatRelativeTime(tx.date)}</span>
          {tx.isRecurring && (
            <span className="text-[10px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-md">
              🔄 Định kỳ
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={cn(
          'text-sm font-semibold',
          isIncome ? 'text-success-400' : 'text-danger-400',
        )}>
          {isIncome ? '+' : '-'}{formatVND(tx.amount)}
        </p>
        {tx.merchantName && (
          <p className="text-[10px] text-slate-500 mt-0.5">{tx.merchantName}</p>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// ── Filter Tabs ───────────────────────────────────────────────────
const FILTER_TABS: { label: string; value: TransactionType | 'all' }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Thu',    value: 'income' },
  { label: 'Chi',    value: 'expense' },
];

// ── Main Component ────────────────────────────────────────────────
export default function RecentTransactions({ limit = 8 }: { limit?: number }) {
  const transactions = useTransactions();
  const categories   = useCategories();
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [search, setSearch] = useState('');

  const getCategoryInfo = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    return { name: cat?.name ?? '—', color: cat?.color ?? '#818cf8' };
  };

  const filtered = transactions
    .filter((tx) => filter === 'all' || tx.type === filter)
    .filter((tx) =>
      !search || tx.description.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, limit);

  return (
    <div className="card p-6 flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Giao dịch gần đây</h3>
          <p className="text-xs text-slate-400 mt-0.5">{transactions.length} giao dịch tháng này</p>
        </div>
        <button className="btn-ghost text-xs text-brand-400 hover:text-brand-300 px-2 py-1">
          Xem tất cả →
        </button>
      </div>

      {/* Search + Filter row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm giao dịch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center bg-surface-950 rounded-xl p-1 gap-0.5 border border-slate-800">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200',
                filter === tab.value
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="divide-y divide-slate-800/50">
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-slate-500 text-sm">Không tìm thấy giao dịch nào</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const { name, color } = getCategoryInfo(tx.categoryId);
            return <TransactionRow key={tx.id} tx={tx} categoryName={name} categoryColor={color} />;
          })
        )}
      </div>
    </div>
  );
}
