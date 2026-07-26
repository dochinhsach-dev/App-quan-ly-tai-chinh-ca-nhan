// ─────────────────────────────────────────────────────────────────
//  Dashboard Page – Main grid with summary cards + charts
// ─────────────────────────────────────────────────────────────────
import { useLiveSummary, useHealthScore, useGoals } from '../stores/useFinanceStore';
import { cn, formatVND, formatCompact, getProgressColor, getScoreColor, getTrend } from '../utils/helpers';
import ExpenseChart from '../components/finance/ExpenseChart';
import RecentTransactions from '../components/finance/RecentTransactions';
import SmartAlerts from '../components/finance/SmartAlerts';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank,
  Heart, ArrowUpRight, ArrowDownRight, Target, Trophy,
} from 'lucide-react';

// ── Summary Card ──────────────────────────────────────────────────
interface SummaryCardProps {
  label: string;
  value: number;
  change: number;
  icon: typeof Wallet;
  iconBg: string;
  iconColor: string;
  format?: 'currency' | 'percent' | 'score';
}

function SummaryCard({ label, value, change, icon: Icon, iconBg, iconColor, format = 'currency' }: SummaryCardProps) {
  const trend = getTrend(change);
  const TrendIcon = change > 0 ? ArrowUpRight : ArrowDownRight;

  const displayValue = () => {
    if (format === 'score')   return `${value}/100`;
    if (format === 'percent') return `${value.toFixed(1)}%`;
    return formatVND(value);
  };

  return (
    <div className="stat-card card-hover group">
      <div className="flex items-center justify-between">
        <p className="stat-label">{label}</p>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>

      <div>
        <p className={cn(
          'stat-value',
          format === 'score' && getScoreColor(value),
        )}>
          {displayValue()}
        </p>
        <div className={cn('stat-change flex items-center gap-1 mt-1', trend.color)}>
          <TrendIcon className="w-3 h-3" />
          <span>{trend.label} so với tháng trước</span>
        </div>
      </div>
    </div>
  );
}

// ── Greeting helper ─────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

// ── Health Score Ring ─────────────────────────────────────────────
function HealthScoreCard() {
  const health = useHealthScore();
  const color  = health.overall >= 80 ? '#4ade80' : health.overall >= 60 ? '#eab308' : '#ef4444';
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (health.overall / 100) * circ;

  return (
    <div className="stat-card card-hover col-span-1">
      <div className="flex items-center justify-between">
        <p className="stat-label">Sức khỏe tài chính</p>
        <Heart className="w-4 h-4 text-danger-400" />
      </div>

      <div className="flex items-center gap-4">
        {/* SVG ring */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="44" cy="44" r={r} fill="none"
              stroke={color} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              style={{ transition: 'stroke-dasharray 1s ease-out', filter: `drop-shadow(0 0 6px ${color}60)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-slate-100">{health.overall}</span>
            <span className="text-[9px] text-slate-500">điểm</span>
          </div>
        </div>

        {/* Breakdown mini list */}
        <div className="flex-1 space-y-2">
          {health.breakdown.slice(0, 3).map((item) => (
            <div key={item.label}>
              <div className="flex justify-between mb-0.5">
                <span className="text-[10px] text-slate-400 truncate">{item.label}</span>
                <span className="text-[10px] font-medium text-slate-300">{item.score}/{item.maxScore}</span>
              </div>
              <div className="progress-track h-1">
                <div
                  className={cn('progress-fill', getProgressColor((item.score / item.maxScore) * 100))}
                  style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Goal Progress Card ────────────────────────────────────────────
function GoalProgressCard() {
  const goals = useGoals();
  const active = goals.filter((g) => g.status !== 'achieved').slice(0, 3);

  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-100">Tiến độ mục tiêu</h3>
        </div>
        <button className="btn-ghost text-xs text-brand-400 px-2 py-1">Xem tất cả</button>
      </div>

      <div className="space-y-4">
        {active.map((goal) => {
          const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{goal.iconEmoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{goal.title}</p>
                    <p className="text-[10px] text-slate-500">
                      {formatCompact(goal.currentAmount)}đ / {formatCompact(goal.targetAmount)}đ
                    </p>
                  </div>
                </div>
                <span className={cn(
                  'text-xs font-bold',
                  goal.status === 'on-track' ? 'text-success-400' : 'text-warning-400',
                )}>{pct}%</span>
              </div>
              <div className="progress-track h-1.5">
                <div
                  className="progress-fill"
                  style={{ width: `${pct}%`, backgroundColor: goal.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Gamification badge */}
      <div className="mt-4 p-3 bg-gradient-brand/10 border border-brand-500/20 rounded-xl flex items-center gap-2">
        <Trophy className="w-4 h-4 text-warning-400" />
        <p className="text-[11px] text-slate-300">
          <span className="font-semibold text-warning-400">1 mục tiêu</span> đã hoàn thành tháng 6! 🎉
        </p>
      </div>
    </div>
  );
}

// ── Balance Card (large) ─────────────────────────────────────────────────────
function BalanceHeroCard() {
  const summary = useLiveSummary();
  const monthLabel = `T${new Date().getMonth() + 1}`;

  return (
    <div className="card p-6 bg-gradient-to-br from-brand-600/20 via-surface-900 to-surface-900 border-brand-500/20 animate-fade-in col-span-full md:col-span-2 lg:col-span-1">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Tổng tài sản ròng</p>
      <p className="text-3xl font-black text-gradient-brand mb-1">
        {formatCompact(summary.totalBalance)}đ
      </p>
      <p className="text-[11px] text-slate-500 mb-4">Cập nhật lần cuối: hôm nay</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-success-500/10 border border-success-500/20 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 mb-1">Thu nhập {monthLabel}</p>
          <p className="text-sm font-bold text-success-400">+{formatCompact(summary.monthlyIncome)}đ</p>
        </div>
        <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 mb-1">Chi tiêu {monthLabel}</p>
          <p className="text-sm font-bold text-danger-400">-{formatCompact(summary.monthlyExpenses)}đ</p>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────
export default function Dashboard() {
  const summary = useLiveSummary();
  const { user } = useClerkUser();

  // Pick the friendliest name available from Clerk
  const firstName =
    user?.firstName ||
    user?.fullName?.split(' ').at(-1) ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'bạn';

  return (
    <div className="space-y-6 animate-in">
      {/* Welcome banner */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={firstName}
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-brand-500/30 flex-shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              {firstName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {getGreeting()}, {firstName}! 👋
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">Đây là tổng quan tài chính của bạn hôm nay.</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-surface-900 border border-slate-800/70 rounded-xl px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse flex-shrink-0" />
          Dữ liệu cập nhật theo thời gian thực
        </div>
      </div>

      {/* ── Row 1: Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <BalanceHeroCard />

        <SummaryCard
          label="Thu nhập tháng này"
          value={summary.monthlyIncome}
          change={summary.comparedToLastMonth.income}
          icon={TrendingUp}
          iconBg="bg-success-500/15"
          iconColor="text-success-400"
        />
        <SummaryCard
          label="Chi tiêu tháng này"
          value={summary.monthlyExpenses}
          change={-summary.comparedToLastMonth.expenses}
          icon={TrendingDown}
          iconBg="bg-danger-500/15"
          iconColor="text-danger-400"
        />
        <SummaryCard
          label="Tiết kiệm"
          value={summary.monthlySavings}
          change={summary.comparedToLastMonth.savings}
          icon={PiggyBank}
          iconBg="bg-brand-500/15"
          iconColor="text-brand-400"
        />
        <HealthScoreCard />
      </div>

      {/* ── Row 2: Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExpenseChart />
        </div>
        <div>
          <SmartAlerts maxItems={3} />
        </div>
      </div>

      {/* ── Row 3: Goals + Transactions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <GoalProgressCard />
        </div>
        <div className="lg:col-span-2">
          <RecentTransactions limit={6} />
        </div>
      </div>
    </div>
  );
}
