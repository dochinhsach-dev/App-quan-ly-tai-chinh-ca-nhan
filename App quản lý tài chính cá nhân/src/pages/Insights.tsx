// ─────────────────────────────────────────────────────────────────
//  Insights Page – AI Hub: Savings Advisor + Habit Analysis
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Brain, Sparkles, Activity } from 'lucide-react';
import { cn } from '../utils/helpers';
import AISavingsAdvisor from '../components/finance/AISavingsAdvisor';
import HabitAnalysis from '../components/finance/HabitAnalysis';
import { useInsights, useHealthScore } from '../stores/useFinanceStore';

type InsightsTab = 'advisor' | 'habits';

// ── Insights Score Banner ─────────────────────────────────────────
function InsightsBanner() {
  const health   = useHealthScore();
  const insights = useInsights();
  const active   = insights.filter((i) => !i.isApplied);

  return (
    <div className="card p-6 bg-gradient-to-r from-brand-600/20 via-surface-900 to-surface-900 border-brand-500/20 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-brand flex-shrink-0">
          <Brain className="w-7 h-7 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-100">AI Insights Hub</h2>
            <span className="badge-brand text-[10px] flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />BETA
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Phân tích thông minh giúp bạn chi tiêu hiệu quả và đạt tự do tài chính sớm hơn.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-center px-4 py-3 bg-surface-950 rounded-xl border border-slate-800">
            <p className="text-lg font-bold text-brand-400">{active.length}</p>
            <p className="text-[10px] text-slate-500">Gợi ý mới</p>
          </div>
          <div className="text-center px-4 py-3 bg-surface-950 rounded-xl border border-slate-800">
            <p className="text-lg font-bold text-success-400">{health.overall}</p>
            <p className="text-[10px] text-slate-500">Điểm sức khỏe</p>
          </div>
          <div className="text-center px-4 py-3 bg-surface-950 rounded-xl border border-slate-800">
            <p className="text-lg font-bold text-warning-400">{health.savingsRate}%</p>
            <p className="text-[10px] text-slate-500">Tỷ lệ tiết kiệm</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab Bar ───────────────────────────────────────────────────────
const TABS: { id: InsightsTab; label: string; icon: typeof Brain }[] = [
  { id: 'advisor', label: 'AI Savings Advisor', icon: Sparkles },
  { id: 'habits',  label: 'Phân tích thói quen', icon: Activity },
];

// ── Main Insights Page ────────────────────────────────────────────
export default function Insights() {
  const [activeTab, setActiveTab] = useState<InsightsTab>('advisor');

  return (
    <div className="space-y-6 animate-in">
      {/* Banner */}
      <InsightsBanner />

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-surface-900 rounded-2xl border border-slate-800/60 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              activeTab === id
                ? 'bg-brand-500 text-white shadow-glow-brand'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in" key={activeTab}>
        {activeTab === 'advisor' && <AISavingsAdvisor />}
        {activeTab === 'habits'  && <HabitAnalysis />}
      </div>
    </div>
  );
}
