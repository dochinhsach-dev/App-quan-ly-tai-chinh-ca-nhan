// ─────────────────────────────────────────────────────────────────
//  AISavingsAdvisor – AI-powered savings recommendation cards
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Sparkles, TrendingDown, CheckCircle2, ChevronDown,
  ChevronUp, Zap, X, Star,
} from 'lucide-react';
import { cn, formatVND } from '../../utils/helpers';
import { useInsights, useFinanceStore } from '../../stores/useFinanceStore';
import type { AIInsight, InsightType } from '../../types/finance';

// ── Type Config ───────────────────────────────────────────────────
const typeConfig: Record<InsightType, { label: string; color: string; bg: string }> = {
  saving:  { label: 'Tiết kiệm',   color: 'text-success-400', bg: 'bg-success-500/10 border-success-500/20' },
  budget:  { label: 'Ngân sách',   color: 'text-brand-400',   bg: 'bg-brand-500/10 border-brand-500/20' },
  habit:   { label: 'Thói quen',   color: 'text-warning-400', bg: 'bg-warning-500/10 border-warning-500/20' },
  goal:    { label: 'Mục tiêu',    color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20' },
  spending:{ label: 'Chi tiêu',    color: 'text-danger-400',  bg: 'bg-danger-500/10 border-danger-500/20' },
};

// ── Confidence Bar ────────────────────────────────────────────────
function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 85 ? 'bg-success-500' : pct >= 70 ? 'bg-brand-500' : 'bg-warning-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 font-medium flex-shrink-0">{pct}% chắc chắn</span>
    </div>
  );
}

// ── Insight Card ──────────────────────────────────────────────────
function InsightCard({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false);
  const applyInsight   = useFinanceStore((s) => s.applyInsight);
  const dismissInsight = useFinanceStore((s) => s.dismissInsight);
  const config = typeConfig[insight.type];

  return (
    <div className={cn(
      'border rounded-2xl p-5 transition-all duration-300 animate-slide-up',
      insight.isApplied
        ? 'bg-success-500/5 border-success-500/20 opacity-60'
        : 'bg-surface-900 border-slate-800/60 hover:border-brand-500/30',
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          {/* AI icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-glow-brand">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn('badge text-[10px] border', config.bg, config.color)}>
                {config.label}
              </span>
              {insight.isApplied && (
                <span className="badge-success text-[10px]">✓ Đã áp dụng</span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-slate-100 leading-snug">{insight.title}</h4>
          </div>
        </div>

        {!insight.isApplied && (
          <button
            onClick={() => dismissInsight(insight.id)}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        )}
      </div>

      {/* Summary */}
      <p className="text-xs text-slate-400 leading-relaxed mb-3">{insight.summary}</p>

      {/* Saving amount */}
      {insight.potentialSaving !== undefined && insight.potentialSaving > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-success-500/8 border border-success-500/15 rounded-xl">
          <TrendingDown className="w-3.5 h-3.5 text-success-400 flex-shrink-0" />
          <span className="text-xs text-success-400 font-medium">
            Tiết kiệm tiềm năng: <span className="font-bold">{formatVND(insight.potentialSaving)}/tháng</span>
          </span>
        </div>
      )}

      {/* Confidence bar */}
      <ConfidenceBar score={insight.confidenceScore} />

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-3 animate-fade-in">
          <p className="text-xs text-slate-400 leading-relaxed">{insight.detail}</p>
          {insight.actionItems.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-warning-400" />
                Hành động đề xuất
              </p>
              <ul className="space-y-1.5">
                {insight.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Thu gọn' : 'Xem chi tiết'}
        </button>

        {!insight.isApplied && (
          <button
            onClick={() => applyInsight(insight.id)}
            className="btn bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 border border-brand-500/20 text-xs py-1.5 px-3"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Áp dụng ngay
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function AISavingsAdvisor() {
  const insights = useInsights();
  const [showApplied, setShowApplied] = useState(false);

  const active   = insights.filter((i) => !i.isApplied);
  const applied  = insights.filter((i) =>  i.isApplied);
  const visible  = showApplied ? insights : active;

  const totalSaving = active.reduce((s, i) => s + (i.potentialSaving ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Header banner */}
      <div className="card-gradient p-5 rounded-2xl border border-brand-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">AI Savings Advisor</h3>
            <p className="text-xs text-slate-400">Cập nhật lần cuối: hôm nay, 6:00</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-900/60 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-gradient-brand">{active.length}</p>
            <p className="text-[10px] text-slate-500">Gợi ý chờ</p>
          </div>
          <div className="bg-surface-900/60 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-success-400">{formatVND(totalSaving).replace('₫', '')}</p>
            <p className="text-[10px] text-slate-500">Tiết kiệm tiềm năng</p>
          </div>
          <div className="bg-surface-900/60 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-warning-400 flex items-center justify-center gap-1">
              <Star className="w-4 h-4" />4.2
            </p>
            <p className="text-[10px] text-slate-500">Độ chính xác</p>
          </div>
        </div>
      </div>

      {/* Insight cards */}
      <div className="space-y-3">
        {visible.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {/* Show applied toggle */}
      {applied.length > 0 && (
        <button
          onClick={() => setShowApplied(!showApplied)}
          className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 border border-slate-800 rounded-xl hover:border-slate-700 transition-all"
        >
          {showApplied ? '▲ Ẩn' : `▼ Hiện ${applied.length} gợi ý đã áp dụng`}
        </button>
      )}
    </div>
  );
}
