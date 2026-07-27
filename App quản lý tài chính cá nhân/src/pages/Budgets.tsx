// ─────────────────────────────────────────────────────────────────
//  Budgets Page – Quản lý ngân sách toàn diện
// ─────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, X, Check, AlertCircle, AlertTriangle,
  ChevronDown, Calendar, RotateCcw, Wallet, Repeat, Sparkles,
  TrendingUp, Info, ChevronLeft, ChevronRight,
  CheckCircle2, PieChart as PieIcon, BarChart2,
  BookOpen, Lightbulb, ShieldAlert, Copy, ArrowUpDown,
  Flame, Clock, Zap, DollarSign, Activity,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line, Area, AreaChart,
} from 'recharts';
import { cn, formatVND, formatCompact } from '../utils/helpers';
import { useTransactions, useCategories, useFinanceStore } from '../stores/useFinanceStore';
import type { Budget, Category, Transaction } from '../types/finance';

// ── Category Icon Map ─────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  'UtensilsCrossed': '🍜', 'Car': '🚗', 'Gamepad2': '🎮',
  'ShoppingBag': '🛍️', 'Receipt': '🧾', 'HeartPulse': '❤️‍🩹',
  'BookOpen': '📚', 'TrendingUp': '📈', 'Banknote': '💵',
  'Laptop': '💻', 'Home': '🏠', 'Coffee': '☕',
  'Plane': '✈️', 'Gift': '🎁', 'Music': '🎵',
};
function getCatEmoji(iconName?: string): string {
  return iconName ? (CATEGORY_EMOJI[iconName] ?? '💰') : '💰';
}

// ── Constants ─────────────────────────────────────────────────────
const MONTHS_VI = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
];

const PERIOD_OPTIONS = [
  { value: 'monthly',   label: 'Hàng tháng' },
  { value: 'weekly',    label: 'Hàng tuần' },
  { value: 'quarterly', label: 'Hàng quý' },
  { value: 'yearly',    label: 'Hàng năm' },
  { value: 'custom',    label: 'Tùy chỉnh' },
] as const;

type SortKey = 'pct' | 'amount' | 'name' | 'remaining' | 'status';

const ALERT_THRESHOLDS = [70, 80, 90, 100];
const iCls = 'w-full bg-surface-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors';
const lCls = 'text-xs font-medium text-slate-400 mb-1 block';
const eCls = 'text-[11px] text-danger-400 mt-1';

// ── Helpers ───────────────────────────────────────────────────────
function getPeriodDates(period: string, baseDate = new Date()) {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  switch (period) {
    case 'monthly':   return { startDate: fmt(new Date(y, m, 1)), endDate: fmt(new Date(y, m + 1, 0)) };
    case 'weekly': {
      const day = baseDate.getDay();
      const s = new Date(baseDate); s.setDate(baseDate.getDate() - day);
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return { startDate: fmt(s), endDate: fmt(e) };
    }
    case 'quarterly': {
      const q = Math.floor(m / 3);
      return { startDate: fmt(new Date(y, q * 3, 1)), endDate: fmt(new Date(y, q * 3 + 3, 0)) };
    }
    case 'yearly':    return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
    default:          return { startDate: fmt(new Date(y, m, 1)), endDate: fmt(new Date(y, m + 1, 0)) };
  }
}

function computeSpent(budget: Budget, transactions: Transaction[]): number {
  return transactions
    .filter(tx => {
      const d = tx.date.split('T')[0];
      return tx.categoryId === budget.categoryId && tx.type === 'expense'
        && d >= budget.startDate && d <= budget.endDate;
    })
    .reduce((s, tx) => s + tx.amount, 0);
}

function getStatus(pct: number, threshold: number) {
  if (pct > 100)       return 'over'    as const;
  if (pct >= threshold) return 'warning' as const;
  return                       'ok'      as const;
}

function getSuggested(categoryId: string, transactions: Transaction[]): number {
  const now = new Date();
  let total = 0, months = 0;
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const sum = transactions
      .filter(tx => tx.categoryId === categoryId && tx.type === 'expense' && tx.date.startsWith(prefix))
      .reduce((s, tx) => s + tx.amount, 0);
    if (sum > 0) { total += sum; months++; }
  }
  if (months === 0) return 0;
  return Math.ceil((total / months) / 100_000) * 100_000;
}

function getBreakdown(budget: Budget, spent: number, transactions: Transaction[]) {
  const txs = transactions.filter(tx => {
    const d = tx.date.split('T')[0];
    return tx.categoryId === budget.categoryId && tx.type === 'expense'
      && d >= budget.startDate && d <= budget.endDate;
  });
  const map = new Map<string, number>();
  for (const tx of txs) {
    const k = tx.merchantName || tx.description.slice(0, 20) || 'Khác';
    map.set(k, (map.get(k) ?? 0) + tx.amount);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, amount]) => ({ name, amount, pct: spent > 0 ? Math.round((amount / spent) * 100) : 0 }));
}

/** Days remaining in the budget period */
function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));
}

/** Total days in budget period */
function getTotalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1);
}

/** Daily budget vs daily actual spend */
function getBurnRate(budget: Budget, spent: number): { daily: number; dailyBudget: number; status: 'low' | 'ok' | 'high' } {
  const totalDays = getTotalDays(budget.startDate, budget.endDate);
  const daysRemaining = getDaysRemaining(budget.endDate);
  const daysElapsed = Math.max(1, totalDays - daysRemaining);
  const dailyBudget = budget.amount / totalDays;
  const daily = spent / daysElapsed;
  const ratio = dailyBudget > 0 ? daily / dailyBudget : 0;
  return {
    daily,
    dailyBudget,
    status: ratio > 1.2 ? 'high' : ratio > 0.8 ? 'ok' : 'low',
  };
}

/** Predict end-of-period spend based on burn rate */
function getPredictedSpend(budget: Budget, spent: number): number {
  const totalDays = getTotalDays(budget.startDate, budget.endDate);
  const daysRemaining = getDaysRemaining(budget.endDate);
  const daysElapsed = Math.max(1, totalDays - daysRemaining);
  const dailyRate = spent / daysElapsed;
  return spent + (dailyRate * daysRemaining);
}

// ── Extended budget type ──────────────────────────────────────────
interface BudgetEx extends Budget {
  computedSpent: number;
  pct: number;
  remaining: number;
  status: 'ok' | 'warning' | 'over';
  category?: Category;
  displayName: string;
  daysRemaining: number;
  totalDays: number;
  burnRate: { daily: number; dailyBudget: number; status: 'low' | 'ok' | 'high' };
  predictedSpend: number;
}

// ─────────────────────────────────────────────────────────────────
//  QuickAddModal – Add transaction fast from a budget card
// ─────────────────────────────────────────────────────────────────
function QuickAddModal({ budget, onClose }: { budget: BudgetEx; onClose: () => void }) {
  const addTransaction = useFinanceStore(s => s.addTransaction);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!amount || +amount <= 0) return;
    setSaving(true);
    try {
      await addTransaction({
        type: 'expense',
        amount: +amount,
        currency: 'VND',
        categoryId: budget.categoryId,
        description: desc.trim() || `Chi tiêu ${budget.displayName}`,
        date: new Date().toISOString(),
        isRecurring: false,
      });
    } finally {
      setSaving(false);
      onClose();
    }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const catColor = budget.category?.color ?? '#818cf8';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-900 border border-slate-700/60 rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${catColor}20`, border: `1px solid ${catColor}35` }}>
              <span className="text-base">{getCatEmoji(budget.category?.icon)}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Thêm nhanh giao dịch</p>
              <p className="text-[11px] text-slate-500">{budget.displayName}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Remaining info */}
          <div className="flex items-center justify-between p-3 bg-surface-950 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Còn lại</span>
            <span className={cn('text-sm font-bold', budget.remaining < 0 ? 'text-danger-400' : 'text-success-400')}>
              {budget.remaining < 0 ? '-' : ''}{formatVND(Math.abs(budget.remaining))}
            </span>
          </div>

          {/* Amount */}
          <div>
            <p className={lCls}>Số tiền (VND) *</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₫</span>
              <input type="number" min={0} placeholder="0" value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
                className={cn(iCls, 'pl-7')} />
            </div>
            {amount && +amount > 0 && (
              <p className="text-[11px] text-slate-500 mt-1">{formatVND(+amount)}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <p className={lCls}>Mô tả (tùy chọn)</p>
            <input type="text" placeholder="Mô tả giao dịch…" value={desc}
              onChange={e => setDesc(e.target.value)} className={iCls} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-slate-800/70">
          <button onClick={onClose} className="btn flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">Hủy</button>
          <button onClick={handleAdd} disabled={saving || !amount || +amount <= 0}
            className="btn flex-1 bg-brand-500 hover:bg-brand-400 text-white text-sm shadow-glow-brand disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            Thêm giao dịch
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  BudgetModal – Add / Edit
// ─────────────────────────────────────────────────────────────────
type BudgetForm = {
  name: string; categoryId: string; amount: string;
  period: string; startDate: string; endDate: string;
  alertThreshold: number; isRecurring: boolean; note: string;
};

function BudgetModal({ mode, init, budgetId, onClose }: {
  mode: 'add' | 'edit'; init?: BudgetForm; budgetId?: string; onClose: () => void;
}) {
  const categories  = useCategories();
  const transactions = useTransactions();
  const addBudget   = useFinanceStore(s => s.addBudget);
  const updateBudget = useFinanceStore(s => s.updateBudget);

  const defaultPeriod = getPeriodDates('monthly');
  const [form, setForm] = useState<BudgetForm>(init ?? {
    name: '', categoryId: '', amount: '', period: 'monthly',
    startDate: defaultPeriod.startDate, endDate: defaultPeriod.endDate,
    alertThreshold: 80, isRecurring: false, note: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BudgetForm, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof BudgetForm, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const handlePeriodChange = (p: string) => {
    if (p === 'custom') { setForm(f => ({ ...f, period: p })); return; }
    const dates = getPeriodDates(p);
    setForm(f => ({ ...f, period: p, ...dates }));
  };

  const expenseCats = categories.filter(c => !['cat-09', 'cat-10'].includes(c.id));
  const selectedCat = categories.find(c => c.id === form.categoryId);
  const suggested = useMemo(() =>
    form.categoryId ? getSuggested(form.categoryId, transactions) : 0,
  [form.categoryId, transactions]);

  function validate() {
    const e: typeof errors = {};
    if (!form.categoryId) e.categoryId = 'Vui lòng chọn danh mục';
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = 'Số tiền phải > 0';
    if (!form.startDate) e.startDate = 'Chọn ngày bắt đầu';
    if (!form.endDate)   e.endDate   = 'Chọn ngày kết thúc';
    if (form.startDate > form.endDate) e.endDate = 'Ngày KT phải sau BĐ';
    setErrors(e); return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    const cat = categories.find(c => c.id === form.categoryId);
    const payload = {
      name: form.name.trim() || cat?.name || 'Ngân sách',
      categoryId: form.categoryId, amount: +form.amount, spent: 0,
      period: form.period as Budget['period'],
      startDate: form.startDate, endDate: form.endDate,
      alertThreshold: form.alertThreshold,
      isRecurring: form.isRecurring,
      note: form.note.trim() || undefined, currency: 'VND',
    };
    try {
      if (mode === 'add') await addBudget(payload);
      else if (budgetId)  await updateBudget(budgetId, payload);
    } finally { setSaving(false); onClose(); }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-900 border border-slate-700/60 rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/70 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
              {selectedCat
                ? <span className="text-base">{getCatEmoji(selectedCat.icon)}</span>
                : (mode === 'add' ? <Plus className="w-4 h-4 text-brand-400" /> : <Edit2 className="w-4 h-4 text-brand-400" />)
              }
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              {mode === 'add' ? 'Tạo ngân sách mới' : 'Chỉnh sửa ngân sách'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Category */}
          <div>
            <p className={lCls}>Danh mục *</p>
            <div className="relative">
              <select value={form.categoryId}
                onChange={e => { set('categoryId', e.target.value); }}
                className={cn(iCls, 'appearance-none pr-8', errors.categoryId && 'border-danger-500/60')}>
                <option value="">Chọn danh mục</option>
                {expenseCats.map(c => (
                  <option key={c.id} value={c.id}>{getCatEmoji(c.icon)} {c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
            {errors.categoryId && <p className={eCls}>{errors.categoryId}</p>}
          </div>

          {/* AI Suggestion */}
          {suggested > 0 && form.categoryId && (
            <div className="flex items-center gap-3 p-3 bg-brand-500/8 border border-brand-500/20 rounded-xl animate-fade-in">
              <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-400">Gợi ý từ chi tiêu 3 tháng gần đây</p>
                <p className="text-sm font-bold text-brand-300">{formatVND(suggested)}/tháng</p>
              </div>
              <button onClick={() => set('amount', String(suggested))}
                className="text-xs text-brand-400 hover:text-brand-300 bg-brand-500/15 px-2.5 py-1 rounded-lg font-medium flex-shrink-0">
                Áp dụng
              </button>
            </div>
          )}

          {/* Name */}
          <div>
            <p className={lCls}>Tên ngân sách (tùy chọn)</p>
            <input type="text" placeholder="VD: Ăn uống tháng 7" value={form.name}
              onChange={e => set('name', e.target.value)} className={iCls} />
          </div>

          {/* Amount */}
          <div>
            <p className={lCls}>Số tiền giới hạn (VND) *</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₫</span>
              <input type="number" min={0} placeholder="0" value={form.amount}
                onChange={e => set('amount', e.target.value)}
                className={cn(iCls, 'pl-7', errors.amount && 'border-danger-500/60')} />
            </div>
            {errors.amount && <p className={eCls}>{errors.amount}</p>}
            {form.amount && !errors.amount && (
              <p className="text-[11px] text-slate-500 mt-1">{formatVND(+form.amount)}</p>
            )}
          </div>

          {/* Period tabs */}
          <div>
            <p className={lCls}>Chu kỳ</p>
            <div className="flex gap-1.5 flex-wrap">
              {PERIOD_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => handlePeriodChange(opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    form.period === opt.value
                      ? 'bg-brand-500 text-white border-brand-500 shadow-glow-brand'
                      : 'bg-surface-950 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={lCls}>Ngày bắt đầu *</p>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type="date" value={form.startDate}
                  onChange={e => set('startDate', e.target.value)}
                  disabled={form.period !== 'custom'}
                  className={cn(iCls, 'pl-8', form.period !== 'custom' && 'opacity-60 cursor-not-allowed', errors.startDate && 'border-danger-500/60')} />
              </div>
              {errors.startDate && <p className={eCls}>{errors.startDate}</p>}
            </div>
            <div>
              <p className={lCls}>Ngày kết thúc *</p>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type="date" value={form.endDate}
                  onChange={e => set('endDate', e.target.value)}
                  disabled={form.period !== 'custom'}
                  className={cn(iCls, 'pl-8', form.period !== 'custom' && 'opacity-60 cursor-not-allowed', errors.endDate && 'border-danger-500/60')} />
              </div>
              {errors.endDate && <p className={eCls}>{errors.endDate}</p>}
            </div>
          </div>

          {/* Alert threshold */}
          <div>
            <p className={lCls}>Cảnh báo khi chi tiêu đạt</p>
            <div className="flex gap-1.5">
              {ALERT_THRESHOLDS.map(t => (
                <button key={t} onClick={() => set('alertThreshold', t)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                    form.alertThreshold === t
                      ? 'bg-warning-500/20 text-warning-300 border-warning-500/40'
                      : 'bg-surface-950 text-slate-500 border-slate-700 hover:text-slate-300'
                  )}>
                  {t}%
                </button>
              ))}
            </div>
          </div>

          {/* Recurring toggle */}
          <div className="p-3.5 bg-surface-950 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-brand-400" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Tự động lặp lại</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tự tạo ngân sách mới vào đầu mỗi kỳ</p>
                </div>
              </div>
              <button type="button" onClick={() => set('isRecurring', !form.isRecurring)}
                className={cn('relative rounded-full transition-colors duration-200', form.isRecurring ? 'bg-brand-500' : 'bg-slate-700')}
                style={{ width: 40, height: 22 }}>
                <span className="absolute bg-white rounded-full shadow transition-all duration-200"
                  style={{ width: 18, height: 18, top: 2, left: form.isRecurring ? 20 : 2 }} />
              </button>
            </div>
          </div>

          {/* Note */}
          <div>
            <p className={lCls}>Ghi chú (tùy chọn)</p>
            <textarea placeholder="Thêm ghi chú…" value={form.note}
              onChange={e => set('note', e.target.value)} rows={2}
              className={cn(iCls, 'resize-none')} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800/70 bg-surface-950/60 flex-shrink-0">
          <button onClick={onClose} className="btn flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">Hủy</button>
          <button onClick={handleSubmit} disabled={saving}
            className="btn flex-1 bg-brand-500 hover:bg-brand-400 text-white text-sm shadow-glow-brand disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            {mode === 'add' ? 'Tạo ngân sách' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  DeleteModal
// ─────────────────────────────────────────────────────────────────
function DeleteModal({ budget, onClose }: { budget: BudgetEx; onClose: () => void }) {
  const deleteBudget = useFinanceStore(s => s.deleteBudget);
  const [deleting, setDeleting] = useState(false);

  async function handle() {
    setDeleting(true);
    try { await deleteBudget(budget.id); } finally { setDeleting(false); onClose(); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-900 border border-danger-500/30 rounded-2xl shadow-2xl animate-fade-in p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-danger-500/15 border border-danger-500/25 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-danger-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Xóa ngân sách?</h3>
            <p className="text-sm text-slate-400 mt-1">
              Xóa <span className="font-semibold text-slate-200">"{budget.displayName}"</span>.
              Giao dịch sẽ không bị ảnh hưởng.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="btn flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">Giữ lại</button>
            <button onClick={handle} disabled={deleting}
              className="btn flex-1 bg-danger-500 hover:bg-danger-400 text-white text-sm flex items-center justify-center gap-2">
              {deleting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Trash2 className="w-3.5 h-3.5" />Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  OverspendPanel – Phân tích vượt ngân sách
// ─────────────────────────────────────────────────────────────────
function OverspendPanel({ budget, onClose }: { budget: BudgetEx; onClose: () => void }) {
  const transactions = useTransactions();
  const breakdown = useMemo(() =>
    getBreakdown(budget, budget.computedSpent, transactions),
  [budget, transactions]);

  const COLORS = ['#f87171','#fb923c','#facc15','#a78bfa','#34d399'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-900 border border-danger-500/30 rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/70">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-danger-400" />
            <h3 className="text-sm font-bold text-slate-100">Phân tích chi tiêu – {budget.displayName}</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Giới hạn', value: budget.amount, color: 'text-slate-200' },
              { label: 'Đã chi',   value: budget.computedSpent, color: 'text-danger-300' },
              { label: 'Vượt',     value: Math.max(0, budget.computedSpent - budget.amount), color: 'text-danger-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface-950 rounded-xl p-3 text-center border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
                <p className={cn('text-sm font-bold mt-0.5', color)}>{formatCompact(value)}đ</p>
              </div>
            ))}
          </div>

          {/* Burn rate */}
          <div className="p-3 bg-surface-950 rounded-xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-danger-400" />Tốc độ chi tiêu / ngày
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Thực tế</span>
              <span className="text-sm font-bold text-danger-300">{formatCompact(budget.burnRate.daily)}đ/ngày</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-400">Kế hoạch</span>
              <span className="text-sm font-bold text-slate-300">{formatCompact(budget.burnRate.dailyBudget)}đ/ngày</span>
            </div>
          </div>

          {/* Breakdown */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Phân tích theo nguồn chi</p>
            {breakdown.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Không có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {breakdown.map(({ name, amount, pct }, i) => (
                  <div key={name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-300 truncate max-w-[60%]">{name}</span>
                      <span className="text-xs font-semibold" style={{ color: COLORS[i % COLORS.length] }}>
                        {pct}% · {formatCompact(amount)}đ
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggestion */}
          <div className="p-3 bg-warning-500/8 border border-warning-500/20 rounded-xl">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-warning-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-warning-300">Gợi ý cắt giảm</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tập trung giảm chi tiêu tại <span className="text-slate-200 font-medium">"{breakdown[0]?.name}"</span> có thể giúp bạn tiết kiệm được {formatCompact(breakdown[0]?.amount ?? 0)}đ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  BudgetCard – Redesigned
// ─────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  ok:      { color: '#4ade80', bg: '#4ade8015', border: '#4ade8030', label: 'Bình thường',    Icon: CheckCircle2 },
  warning: { color: '#facc15', bg: '#facc1515', border: '#facc1530', label: 'Sắp vượt',       Icon: AlertTriangle },
  over:    { color: '#f87171', bg: '#f8717115', border: '#f8717130', label: 'Vượt ngân sách', Icon: AlertCircle },
} as const;

const BURN_CFG = {
  low:  { color: '#4ade80', label: 'Thấp' },
  ok:   { color: '#818cf8', label: 'Ổn định' },
  high: { color: '#f87171', label: 'Cao' },
};

function BudgetCard({ budget, onEdit, onDelete, onAnalyze, onQuickAdd, onCopy }: {
  budget: BudgetEx;
  onEdit: () => void; onDelete: () => void; onAnalyze: () => void;
  onQuickAdd: () => void; onCopy: () => void;
}) {
  const cfg = STATUS_CFG[budget.status];
  const Icon = cfg.Icon;
  const catColor = budget.category?.color ?? '#818cf8';
  const displayPct = Math.min(budget.pct, 100);
  const burnCfg = BURN_CFG[budget.burnRate.status];
  const catEmoji = getCatEmoji(budget.category?.icon);
  const isActive = budget.daysRemaining > 0 && new Date(budget.startDate) <= new Date();
  const predictedOverBudget = budget.predictedSpend > budget.amount;

  return (
    <div className="card group hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300 animate-fade-in relative overflow-hidden flex flex-col">
      {/* Top color bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ backgroundColor: catColor }} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
              style={{ backgroundColor: `${catColor}20`, border: `1px solid ${catColor}35` }}>
              {catEmoji}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">{budget.displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                  <Calendar className="w-2.5 h-2.5" />
                  {budget.startDate.slice(5)} → {budget.endDate.slice(5)}
                </span>
                {budget.isRecurring && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-md">
                    <Repeat className="w-2.5 h-2.5" />Lặp lại
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={onQuickAdd} title="Thêm giao dịch nhanh"
              className="p-1.5 rounded-lg text-slate-500 hover:text-success-400 hover:bg-success-500/10 transition-all">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={onCopy} title="Sao chép sang tháng sau"
              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={onEdit} title="Chỉnh sửa"
              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} title="Xóa"
              className="p-1.5 rounded-lg text-slate-500 hover:text-danger-400 hover:bg-danger-500/10 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between mb-1.5">
            <span className="text-[11px] text-slate-400">Đã sử dụng</span>
            <span className="text-[11px] font-bold" style={{ color: cfg.color }}>{budget.pct}%</span>
          </div>
          <div className="h-2.5 bg-slate-800/80 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${displayPct}%`, backgroundColor: catColor }}
            />
            {/* Threshold marker */}
            {budget.alertThreshold < 100 && (
              <div className="absolute top-0 bottom-0 w-0.5 bg-warning-400/60"
                style={{ left: `${budget.alertThreshold}%` }} />
            )}
          </div>
          {budget.status === 'over' && (
            <div className="h-1 bg-danger-500/30 rounded-full overflow-hidden mt-0.5">
              <div className="h-full bg-danger-500 rounded-full"
                style={{ width: `${Math.min((budget.computedSpent - budget.amount) / budget.amount * 100, 100)}%` }} />
            </div>
          )}
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-surface-950 rounded-xl p-2 text-center">
            <p className="text-[9px] text-slate-500 uppercase">Giới hạn</p>
            <p className="text-xs font-bold text-slate-200 mt-0.5">{formatCompact(budget.amount)}đ</p>
          </div>
          <div className="bg-surface-950 rounded-xl p-2 text-center">
            <p className="text-[9px] text-slate-500 uppercase">Đã dùng</p>
            <p className="text-xs font-bold mt-0.5" style={{ color: cfg.color }}>{formatCompact(budget.computedSpent)}đ</p>
          </div>
          <div className="bg-surface-950 rounded-xl p-2 text-center">
            <p className="text-[9px] text-slate-500 uppercase">Còn lại</p>
            <p className={cn('text-xs font-bold mt-0.5', budget.remaining < 0 ? 'text-danger-400' : 'text-success-400')}>
              {budget.remaining < 0 ? '-' : ''}{formatCompact(Math.abs(budget.remaining))}đ
            </p>
          </div>
        </div>

        {/* Extra info: days remaining + burn rate */}
        {isActive && (
          <div className="flex gap-2 mb-3">
            {/* Days remaining */}
            <div className="flex-1 flex items-center gap-1.5 bg-surface-950 rounded-xl px-2.5 py-2 border border-slate-800/60">
              <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-[9px] text-slate-500">Còn</p>
                <p className="text-xs font-bold text-slate-200">{budget.daysRemaining} ngày</p>
              </div>
            </div>
            {/* Burn rate */}
            <div className="flex-1 flex items-center gap-1.5 bg-surface-950 rounded-xl px-2.5 py-2 border border-slate-800/60">
              <Flame className="w-3 h-3 flex-shrink-0" style={{ color: burnCfg.color }} />
              <div>
                <p className="text-[9px] text-slate-500">Tốc độ</p>
                <p className="text-xs font-bold" style={{ color: burnCfg.color }}>{burnCfg.label}</p>
              </div>
            </div>
            {/* Predicted */}
            {budget.daysRemaining > 0 && (
              <div className="flex-1 flex items-center gap-1.5 bg-surface-950 rounded-xl px-2.5 py-2 border border-slate-800/60">
                <Activity className="w-3 h-3 flex-shrink-0" style={{ color: predictedOverBudget ? '#f87171' : '#4ade80' }} />
                <div>
                  <p className="text-[9px] text-slate-500">Dự báo</p>
                  <p className="text-xs font-bold" style={{ color: predictedOverBudget ? '#f87171' : '#4ade80' }}>
                    {formatCompact(budget.predictedSpend)}đ
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status + actions */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg"
            style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <Icon className="w-3 h-3" />{cfg.label}
          </div>
          <div className="flex items-center gap-2">
            {budget.status === 'over' && (
              <button onClick={onAnalyze}
                className="text-[11px] text-danger-400 hover:text-danger-300 flex items-center gap-1 transition-colors">
                <Info className="w-3 h-3" />Phân tích
              </button>
            )}
            {budget.note && (
              <span className="text-[10px] text-slate-600 flex items-center gap-0.5 truncate max-w-24">
                <BookOpen className="w-2.5 h-2.5" />{budget.note}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick add button - visible on hover at bottom */}
      <div className="px-5 pb-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onQuickAdd}
          className="w-full py-2 rounded-xl text-xs font-medium text-success-400 bg-success-500/10 hover:bg-success-500/20 border border-success-500/20 transition-all flex items-center justify-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />Thêm chi tiêu nhanh
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Charts Section
// ─────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-xl border border-slate-700 space-y-1">
      {label && <p className="font-semibold text-slate-200">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatCompact(p.value)}đ
        </p>
      ))}
    </div>
  );
};

function BudgetCharts({ budgets }: { budgets: BudgetEx[] }) {
  const [chartMode, setChartMode] = useState<'pie' | 'bar' | 'predict'>('bar');

  const barData = budgets.map(b => ({
    name: b.displayName.length > 8 ? b.displayName.slice(0, 8) + '…' : b.displayName,
    'Ngân sách': b.amount,
    'Đã chi': b.computedSpent,
    'Dự báo': Math.round(b.predictedSpend),
    color: b.category?.color ?? '#818cf8',
  }));

  const pieData = budgets.map(b => ({
    name: b.displayName,
    value: b.computedSpent,
    color: b.category?.color ?? '#818cf8',
  })).filter(d => d.value > 0);

  const predictData = budgets.map(b => ({
    name: b.displayName.length > 8 ? b.displayName.slice(0, 8) + '…' : b.displayName,
    'Giới hạn': b.amount,
    'Dự báo': Math.round(b.predictedSpend),
    over: b.predictedSpend > b.amount,
  }));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-100">Biểu đồ ngân sách</h3>
        <div className="flex bg-surface-950 rounded-xl p-1 gap-0.5 border border-slate-800">
          {[
            { k: 'bar', label: 'So sánh', Icon: BarChart2 },
            { k: 'pie', label: 'Tỷ lệ', Icon: PieIcon },
            { k: 'predict', label: 'Dự báo', Icon: Activity },
          ].map(({ k, label, Icon }) => (
            <button key={k} onClick={() => setChartMode(k as any)}
              className={cn('flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all',
                chartMode === k ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200')}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {chartMode === 'bar' && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 10 }} />
            <Bar dataKey="Ngân sách" fill="#334155" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Đã chi"    fill="#818cf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {chartMode === 'pie' && (
        <div className="flex items-center gap-4">
          <div className="relative w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[10px] text-slate-500 text-center">Chi tiêu<br />tháng này</p>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <p className="text-xs text-slate-400 flex-1 truncate">{d.name}</p>
                <p className="text-xs font-semibold text-slate-200">{formatCompact(d.value)}đ</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {chartMode === 'predict' && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-500">Dự báo chi tiêu cuối kỳ dựa trên tốc độ hiện tại</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={predictData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 10 }} />
              <Bar dataKey="Giới hạn" fill="#334155" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Dự báo" radius={[4, 4, 0, 0]}>
                {predictData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.over ? '#f87171' : '#4ade80'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  BudgetHistory – Feature 12
// ─────────────────────────────────────────────────────────────────
function BudgetHistory({ budget }: { budget: BudgetEx; }) {
  const transactions = useTransactions();

  const history = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const spent = transactions
        .filter(tx => tx.categoryId === budget.categoryId && tx.type === 'expense' && tx.date.startsWith(prefix))
        .reduce((s, tx) => s + tx.amount, 0);
      return { label: `${MONTHS_VI[d.getMonth()]} ${d.getFullYear()}`, spent, target: budget.amount };
    });
  }, [budget, transactions]);

  return (
    <div className="space-y-2">
      {history.map(({ label, spent, target }) => {
        const p = target > 0 ? Math.round((spent / target) * 100) : 0;
        const isOver = spent > target;
        return (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-400">{label}</span>
              <span className={cn('text-xs font-semibold', isOver ? 'text-danger-400' : 'text-slate-300')}>
                {formatCompact(spent)}đ / {formatCompact(target)}đ
                {isOver && <span className="ml-1 text-[10px] text-danger-400">(+{Math.round(((spent - target) / target) * 100)}%)</span>}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(p, 100)}%`, backgroundColor: isOver ? '#f87171' : '#818cf8' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Main Budgets Page
// ─────────────────────────────────────────────────────────────────
export default function Budgets() {
  const n = new Date();
  const rawBudgets   = useFinanceStore(s => s.budgets);
  const addBudget    = useFinanceStore(s => s.addBudget);
  const transactions = useTransactions();
  const categories   = useCategories();

  // Filters
  const [filterMonth, setFilterMonth] = useState(n.getMonth());
  const [filterYear,  setFilterYear]  = useState(n.getFullYear());
  const [filterCat,   setFilterCat]   = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'warning' | 'over'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('pct');
  const [sortAsc, setSortAsc] = useState(false);
  const [showHistory, setShowHistory] = useState<BudgetEx | null>(null);

  // Modals
  const [addOpen,     setAddOpen]     = useState(false);
  const [editBudget,  setEditBudget]  = useState<BudgetEx | null>(null);
  const [deleteBgt,   setDeleteBgt]   = useState<BudgetEx | null>(null);
  const [analyzeBgt,  setAnalyzeBgt]  = useState<BudgetEx | null>(null);
  const [quickAddBgt, setQuickAddBgt] = useState<BudgetEx | null>(null);

  // Compute budgets with real spent from transactions
  const budgetsEx = useMemo<BudgetEx[]>(() => {
    return rawBudgets.map(b => {
      const computedSpent = computeSpent(b, transactions);
      const pct = b.amount > 0 ? Math.round((computedSpent / b.amount) * 100) : 0;
      const status = getStatus(pct, b.alertThreshold);
      const category = categories.find(c => c.id === b.categoryId);
      const daysRem = getDaysRemaining(b.endDate);
      const totalD = getTotalDays(b.startDate, b.endDate);
      const burnRate = getBurnRate(b, computedSpent);
      const predictedSpend = getPredictedSpend(b, computedSpent);
      return {
        ...b,
        computedSpent,
        pct,
        remaining: b.amount - computedSpent,
        status,
        category,
        displayName: b.name || category?.name || 'Ngân sách',
        daysRemaining: daysRem,
        totalDays: totalD,
        burnRate,
        predictedSpend,
      };
    });
  }, [rawBudgets, transactions, categories]);

  // Filter
  const filtered = useMemo(() => {
    let result = budgetsEx.filter(b => {
      const startM = new Date(b.startDate).getMonth();
      const startY = new Date(b.startDate).getFullYear();
      const endM   = new Date(b.endDate).getMonth();
      const endY   = new Date(b.endDate).getFullYear();
      const inPeriod = (startY < filterYear || (startY === filterYear && startM <= filterMonth))
                    && (endY > filterYear || (endY === filterYear && endM >= filterMonth));
      if (!inPeriod) return false;
      if (filterCat !== 'all' && b.categoryId !== filterCat) return false;
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;
      return true;
    });

    // Sort
    result = [...result].sort((a, b_) => {
      let cmp = 0;
      switch (sortKey) {
        case 'pct':       cmp = a.pct - b_.pct; break;
        case 'amount':    cmp = a.amount - b_.amount; break;
        case 'name':      cmp = a.displayName.localeCompare(b_.displayName); break;
        case 'remaining': cmp = a.remaining - b_.remaining; break;
        case 'status': {
          const ord = { over: 0, warning: 1, ok: 2 };
          cmp = ord[a.status] - ord[b_.status];
          break;
        }
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [budgetsEx, filterMonth, filterYear, filterCat, filterStatus, sortKey, sortAsc]);

  // Stats
  const totalBudget   = filtered.reduce((s, b) => s + b.amount, 0);
  const totalSpent    = filtered.reduce((s, b) => s + b.computedSpent, 0);
  const totalRemain   = totalBudget - totalSpent;
  const overCount     = filtered.filter(b => b.status === 'over').length;
  const warningCount  = filtered.filter(b => b.status === 'warning').length;
  const totalPredicted = filtered.reduce((s, b) => s + b.predictedSpend, 0);

  // Recurring budgets missing for this month
  const recurringMissing = useMemo(() => {
    const currentPrefix = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}`;
    return budgetsEx.filter(b =>
      b.isRecurring &&
      !rawBudgets.some(rb => rb.categoryId === b.categoryId && rb.startDate.startsWith(currentPrefix) && rb.id !== b.id)
      && !b.startDate.startsWith(currentPrefix)
    );
  }, [budgetsEx, rawBudgets, filterMonth, filterYear]);

  async function handleCreateRecurring() {
    const { startDate, endDate } = getPeriodDates('monthly', new Date(filterYear, filterMonth));
    for (const b of recurringMissing) {
      await addBudget({
        name: b.name, categoryId: b.categoryId, amount: b.amount, spent: 0,
        period: 'monthly', startDate, endDate,
        alertThreshold: b.alertThreshold, isRecurring: true, currency: 'VND',
      });
    }
  }

  function budgetToForm(b: BudgetEx): {form: BudgetForm, id: string} {
    return {
      id: b.id,
      form: {
        name: b.name ?? '', categoryId: b.categoryId, amount: String(b.amount),
        period: b.period, startDate: b.startDate, endDate: b.endDate,
        alertThreshold: b.alertThreshold, isRecurring: b.isRecurring ?? false,
        note: b.note ?? '',
      },
    };
  }

  // Copy budget to next period
  const handleCopyBudget = useCallback(async (b: BudgetEx) => {
    const nextMonth = new Date(filterYear, filterMonth + 1);
    const { startDate, endDate } = getPeriodDates('monthly', nextMonth);
    await addBudget({
      name: b.name, categoryId: b.categoryId, amount: b.amount, spent: 0,
      period: 'monthly', startDate, endDate,
      alertThreshold: b.alertThreshold, isRecurring: b.isRecurring ?? false,
      currency: 'VND', note: b.note,
    });
  }, [addBudget, filterYear, filterMonth]);

  const prevMonth = () => {
    if (filterMonth === 0) { setFilterMonth(11); setFilterYear(y => y - 1); }
    else setFilterMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (filterMonth === 11) { setFilterMonth(0); setFilterYear(y => y + 1); }
    else setFilterMonth(m => m + 1);
  };

  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const predictedPct = totalBudget > 0 ? Math.round((totalPredicted / totalBudget) * 100) : 0;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-400" />Ngân sách & Chi tiêu
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} ngân sách · {MONTHS_VI[filterMonth]} {filterYear}
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} id="btn-add-budget"
          className="btn bg-brand-500 hover:bg-brand-400 text-white text-sm shadow-glow-brand flex items-center gap-2">
          <Plus className="w-4 h-4" />Tạo ngân sách
        </button>
      </div>

      {/* ── Auto-create banner ── */}
      {recurringMissing.length > 0 && filterMonth === n.getMonth() && filterYear === n.getFullYear() && (
        <div className="flex items-center gap-3 p-4 bg-brand-500/8 border border-brand-500/25 rounded-2xl animate-fade-in">
          <Repeat className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-200">
              {recurringMissing.length} ngân sách định kỳ chưa được tạo cho tháng này
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {recurringMissing.map(b => b.displayName).join(', ')}
            </p>
          </div>
          <button onClick={handleCreateRecurring}
            className="btn bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 border border-brand-500/20 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />Tạo ngay
          </button>
        </div>
      )}

      {/* ── Stats Header ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng ngân sách', value: totalBudget,  color: '#818cf8', sub: `${filtered.length} danh mục`, Icon: Wallet },
          { label: 'Đã sử dụng',    value: totalSpent,   color: overallPct > 100 ? '#f87171' : '#facc15', sub: `${overallPct}% tổng`, Icon: DollarSign },
          { label: 'Còn lại',       value: Math.abs(totalRemain), color: totalRemain >= 0 ? '#4ade80' : '#f87171', sub: totalRemain < 0 ? 'Đã vượt!' : 'Chưa dùng', Icon: TrendingUp },
          { label: 'Dự báo cuối kỳ', value: totalPredicted, color: predictedPct > 100 ? '#f87171' : '#22d3ee', sub: `${predictedPct}% ngân sách`, Icon: Zap },
        ].map(({ label, value, color, sub, Icon }) => (
          <div key={label} className="card p-4 border-l-2" style={{ borderLeftColor: color }}>
            <div className="flex items-start justify-between">
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</p>
              <Icon className="w-3.5 h-3.5 opacity-40" style={{ color }} />
            </div>
            <p className="text-lg font-black mt-1" style={{ color }}>
              {formatCompact(value)}đ
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Overall progress ── */}
      <div className="card p-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-slate-400">Tổng chi tiêu / Tổng ngân sách</span>
          <div className="flex items-center gap-3">
            <span className={cn('text-xs font-bold', overallPct > 100 ? 'text-danger-400' : 'text-slate-200')}>
              {formatCompact(totalSpent)}đ / {formatCompact(totalBudget)}đ · {overallPct}%
            </span>
            {totalPredicted > totalBudget && (
              <span className="text-[10px] text-warning-400 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />Dự báo vượt {Math.round(predictedPct - 100)}%
              </span>
            )}
          </div>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
          {/* Actual */}
          <div className="h-full rounded-full transition-all duration-700 absolute left-0"
            style={{
              width: `${Math.min(overallPct, 100)}%`,
              background: overallPct > 100 ? '#f87171' : overallPct >= 80 ? '#facc15' : '#818cf8',
            }} />
          {/* Predicted overlay */}
          {predictedPct > overallPct && (
            <div className="h-full rounded-full absolute left-0 opacity-30"
              style={{
                width: `${Math.min(predictedPct, 100)}%`,
                backgroundColor: predictedPct > 100 ? '#f87171' : '#22d3ee',
              }} />
          )}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-600">0đ</span>
          <span className="text-[10px] text-slate-600">{formatCompact(totalBudget)}đ</span>
        </div>
      </div>

      {/* ── Alert summary ── */}
      {(overCount > 0 || warningCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {overCount > 0 && (
            <div className="flex items-center gap-3 p-3.5 bg-danger-500/8 border border-danger-500/20 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-danger-300">{overCount} ngân sách vượt giới hạn</p>
                <p className="text-xs text-slate-500">Click "Phân tích" để xem chi tiết</p>
              </div>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-3 p-3.5 bg-warning-500/8 border border-warning-500/20 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-warning-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-warning-300">{warningCount} ngân sách sắp vượt giới hạn</p>
                <p className="text-xs text-slate-500">Hãy kiểm soát chi tiêu các danh mục này</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Month navigation */}
          <div className="flex items-center gap-1 bg-surface-950 border border-slate-800 rounded-xl px-2 py-1.5">
            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium text-slate-300 w-28 text-center">
              {MONTHS_VI[filterMonth]} {filterYear}
            </span>
            <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Category filter */}
          <div className="relative">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="bg-surface-950 border border-slate-800 rounded-xl pl-3 pr-7 py-1.5 text-xs text-slate-300 outline-none appearance-none cursor-pointer">
              <option value="all">Tất cả danh mục</option>
              {categories.filter(c => !['cat-09','cat-10'].includes(c.id)).map(c => (
                <option key={c.id} value={c.id}>{getCatEmoji(c.icon)} {c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="flex items-center bg-surface-950 rounded-xl p-1 gap-0.5 border border-slate-800">
            {([
              { v: 'all',     l: 'Tất cả' },
              { v: 'ok',      l: '✅ OK' },
              { v: 'warning', l: '⚠️ Cảnh báo' },
              { v: 'over',    l: '🔴 Vượt' },
            ] as const).map(({ v, l }) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                  filterStatus === v ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200')}>
                {l}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative ml-auto">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500">Sắp xếp:</span>
              {([
                { k: 'pct' as SortKey, l: '% dùng' },
                { k: 'amount' as SortKey, l: 'Số tiền' },
                { k: 'status' as SortKey, l: 'Trạng thái' },
              ]).map(({ k, l }) => (
                <button key={k} onClick={() => toggleSort(k)}
                  className={cn('px-2 py-0.5 rounded-lg text-xs transition-all',
                    sortKey === k ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300')}>
                  {l}{sortKey === k ? (sortAsc ? ' ↑' : ' ↓') : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          {(filterCat !== 'all' || filterStatus !== 'all') && (
            <button onClick={() => { setFilterCat('all'); setFilterStatus('all'); }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <RotateCcw className="w-3 h-3" />Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* ── Budget Grid ── */}
      {filtered.length === 0 ? (
        <div className="card py-16 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">Chưa có ngân sách</p>
            <p className="text-xs text-slate-600 mt-0.5">Tạo ngân sách đầu tiên để bắt đầu theo dõi chi tiêu</p>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="mt-1 btn bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 border border-brand-500/20 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" />Tạo ngân sách
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(b => (
            <BudgetCard key={b.id} budget={b}
              onEdit={() => setEditBudget(b)}
              onDelete={() => setDeleteBgt(b)}
              onAnalyze={() => setAnalyzeBgt(b)}
              onQuickAdd={() => setQuickAddBgt(b)}
              onCopy={() => handleCopyBudget(b)}
            />
          ))}
        </div>
      )}

      {/* ── Charts + History ── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetCharts budgets={filtered} />

          {/* History panel */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-400" />Lịch sử ngân sách
              </h3>
              <div className="relative">
                <select value={showHistory?.id ?? ''}
                  onChange={e => setShowHistory(filtered.find(b => b.id === e.target.value) ?? null)}
                  className="bg-surface-950 border border-slate-800 rounded-xl pl-3 pr-7 py-1 text-xs text-slate-300 outline-none appearance-none cursor-pointer">
                  <option value="">Chọn ngân sách…</option>
                  {filtered.map(b => <option key={b.id} value={b.id}>{b.displayName}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
              </div>
            </div>
            {showHistory
              ? <BudgetHistory budget={showHistory} />
              : (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-600">
                  <TrendingUp className="w-8 h-8" />
                  <p className="text-xs">Chọn một ngân sách để xem lịch sử</p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {addOpen && <BudgetModal mode="add" onClose={() => setAddOpen(false)} />}
      {editBudget && (
        <BudgetModal mode="edit"
          init={budgetToForm(editBudget).form}
          budgetId={editBudget.id}
          onClose={() => setEditBudget(null)} />
      )}
      {deleteBgt && <DeleteModal budget={deleteBgt} onClose={() => setDeleteBgt(null)} />}
      {analyzeBgt && <OverspendPanel budget={analyzeBgt} onClose={() => setAnalyzeBgt(null)} />}
      {quickAddBgt && <QuickAddModal budget={quickAddBgt} onClose={() => setQuickAddBgt(null)} />}
    </div>
  );
}
