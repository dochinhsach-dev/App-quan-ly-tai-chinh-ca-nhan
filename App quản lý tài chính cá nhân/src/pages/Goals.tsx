// ─────────────────────────────────────────────────────────────────
//  Goals Page – Mục tiêu Tài chính
// ─────────────────────────────────────────────────────────────────
import { useState, useMemo, useCallback } from 'react';
import {
  Plus, Target, Trash2, X, Check, ChevronDown,
  Calendar, Wallet, Clock, Edit2,
  ArrowUpCircle, ArrowDownCircle,
  CheckCircle2, AlertTriangle,
  Flame, Zap, Home, Car, Monitor, Plane, GraduationCap,
  User, ShieldAlert, TrendingUp, Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useGoals, useFinanceStore } from '../stores/useFinanceStore';
import type {
  FinancialGoal, GoalContribution, GoalCategory, GoalLifecycleStatus,
} from '../types/finance';

// ─── Helpers ──────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const fmtC = (n: number): string => {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + ' tỷ';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + ' tr';
  if (Math.abs(n) >= 1e3) return Math.round(n / 1e3) + 'k';
  return String(Math.round(n));
};

const toDate = (d: Date) => d.toISOString().split('T')[0];
const cn = (...cls: (string | false | undefined | null)[]) => cls.filter(Boolean).join(' ');

function daysLeft(dl: string) {
  const d = new Date(dl), t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - t.getTime()) / 86400000);
}

function fmtVI(iso: string) {
  const d = new Date(iso);
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

// ─── Constants ────────────────────────────────────────────────────
const CATS: { value: GoalCategory; label: string }[] = [
  { value: 'housing',    label: 'Nhà ở' },
  { value: 'vehicle',   label: 'Phương tiện' },
  { value: 'tech',      label: 'Thiết bị' },
  { value: 'travel',    label: 'Du lịch' },
  { value: 'education', label: 'Học tập' },
  { value: 'personal',  label: 'Cá nhân' },
  { value: 'emergency', label: 'Quỹ khẩn cấp' },
  { value: 'investment',label: 'Đầu tư' },
  { value: 'other',     label: 'Khác' },
];

const STATUS: Record<GoalLifecycleStatus, { label: string; bg: string }> = {
  active:    { label: 'Đang thực hiện', bg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' },
  paused:    { label: 'Tạm dừng',       bg: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' },
  completed: { label: 'Hoàn thành',     bg: 'bg-green-500/15 text-green-400 border border-green-500/20' },
  cancelled: { label: 'Đã hủy',         bg: 'bg-red-500/15 text-red-400 border border-red-500/20' },
  overdue:   { label: 'Quá hạn',        bg: 'bg-orange-500/15 text-orange-400 border border-orange-500/20' },
};

const PRI = {
  low:    { label: 'Thấp',       color: 'text-slate-400' },
  medium: { label: 'Trung bình', color: 'text-yellow-400' },
  high:   { label: 'Cao',        color: 'text-red-400' },
};

// Map goalCategory → Lucide icon + accent color
const CAT_ICON_MAP: Record<string, { Icon: LucideIcon; color: string }> = {
  housing:    { Icon: Home,         color: '#4ade80' },
  vehicle:    { Icon: Car,          color: '#fb923c' },
  tech:       { Icon: Monitor,      color: '#22d3ee' },
  travel:     { Icon: Plane,        color: '#818cf8' },
  education:  { Icon: GraduationCap,color: '#facc15' },
  personal:   { Icon: User,         color: '#f472b6' },
  emergency:  { Icon: ShieldAlert,  color: '#f87171' },
  investment: { Icon: TrendingUp,   color: '#34d399' },
  other:      { Icon: Star,         color: '#a78bfa' },
};
const DEFAULT_CAT = { Icon: Target, color: '#6366f1' };
function getCatIconCfg(cat?: string) { return CAT_ICON_MAP[cat ?? ''] ?? DEFAULT_CAT; }

const COLORS = ['#6366f1','#818cf8','#4ade80','#22d3ee','#f472b6','#fb923c','#facc15','#f87171','#34d399','#a78bfa','#38bdf8','#f59e0b'];
const iCls = 'w-full bg-[#090e1a] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors';
const lCls = 'text-xs font-medium text-slate-400 mb-1.5 block';

// ─── GoalsDashboard ───────────────────────────────────────────────
function GoalsDashboard({ goals }: { goals: FinancialGoal[] }) {
  const total     = goals.length;
  const active    = goals.filter(g => g.status === 'active').length;
  const completed = goals.filter(g => g.status === 'completed').length;
  const saved     = goals.reduce((s, g) => s + g.currentAmount, 0);
  const needed    = goals.filter(g => g.status === 'active').reduce((s, g) => s + Math.max(0, g.targetAmount - g.currentAmount), 0);
  const cards = [
    { label: 'Tổng mục tiêu',  val: String(total),       bg: 'from-indigo-500/10', border: 'border-indigo-500/20', icBg: 'bg-indigo-500/20 text-indigo-400' },
    { label: 'Đang thực hiện', val: String(active),      bg: 'from-cyan-500/10',   border: 'border-cyan-500/20',   icBg: 'bg-cyan-500/20 text-cyan-400' },
    { label: 'Đã hoàn thành',  val: String(completed),   bg: 'from-green-500/10',  border: 'border-green-500/20',  icBg: 'bg-green-500/20 text-green-400' },
    { label: 'Đã tiết kiệm',   val: fmtC(saved) + 'đ',   bg: 'from-purple-500/10', border: 'border-purple-500/20', icBg: 'bg-purple-500/20 text-purple-400' },
  ];
  const icons = [
    <Target key="t" className="w-5 h-5" />,
    <Flame key="f" className="w-5 h-5" />,
    <CheckCircle2 key="c" className="w-5 h-5" />,
    <Wallet key="w" className="w-5 h-5" />,
  ];
  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className={cn('relative overflow-hidden rounded-2xl border p-4 bg-gradient-to-br to-transparent', c.bg, c.border)}>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', c.icBg)}>{icons[i]}</div>
            <div className="text-2xl font-bold text-slate-100 mb-0.5">{c.val}</div>
            <div className="text-xs text-slate-400">{c.label}</div>
          </div>
        ))}
      </div>
      {needed > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-orange-500/20 bg-orange-500/5">
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span className="text-sm text-slate-300">Tổng tiền cần tiết kiệm: <span className="font-bold text-orange-400">{fmt(needed)}</span></span>
        </div>
      )}
    </div>
  );
}

// ─── GoalCard ─────────────────────────────────────────────────────
function GoalCard({ goal, onOpen, onDelete }: { goal: FinancialGoal; onOpen: () => void; onDelete: () => void }) {
  const pct  = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  const left = daysLeft(goal.deadline);
  const rem  = Math.max(0, goal.targetAmount - goal.currentAmount);
  const st   = STATUS[goal.status];
  const pr   = PRI[goal.priority];
  const cat  = CATS.find(c => c.value === goal.goalCategory);
  return (
    <div className="group relative rounded-2xl border border-slate-800/60 bg-[#0f172a]/80 overflow-hidden cursor-pointer hover:border-slate-700 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(99,102,241,0.15)]" onClick={onOpen}>
      <div className="h-1" style={{ background: `linear-gradient(90deg,${goal.color},${goal.color}80)` }} />
      {goal.imageUrl && (
        <div className="relative w-full h-28 overflow-hidden">
          <img src={goal.imageUrl} alt={goal.title} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f172a]" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {(() => { const { Icon, color } = getCatIconCfg(goal.goalCategory); return (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
            );})()} 
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">{goal.title}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-500">{cat?.label}</span>
                <span className="text-slate-700">·</span>
                <span className={cn('text-[10px]', pr.color)}>{pr.label}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', st.bg)}>{st.label}</span>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-slate-400">Tiến độ</span>
            <span className="text-sm font-bold" style={{ color: goal.color }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${goal.color},${goal.color}cc)`, boxShadow: `0 0 8px ${goal.color}60` }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div><div className="text-[11px] text-slate-500 mb-0.5">Đã có</div><div className="text-xs font-semibold text-slate-200">{fmtC(goal.currentAmount)}đ</div></div>
          <div><div className="text-[11px] text-slate-500 mb-0.5">Mục tiêu</div><div className="text-xs font-semibold text-slate-200">{fmtC(goal.targetAmount)}đ</div></div>
          <div><div className="text-[11px] text-slate-500 mb-0.5">Còn thiếu</div><div className="text-xs font-semibold text-orange-400">{fmtC(rem)}đ</div></div>
        </div>
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/60">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{left > 0 ? `Còn ${left} ngày` : left === 0 ? 'Hôm nay là hạn' : `Quá hạn ${Math.abs(left)} ngày`}</span>
          </div>
          {left > 0 && rem > 0 && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] text-yellow-400 font-medium">{fmtC(Math.ceil(rem / (left / 30)))}đ/th</span>
            </div>
          )}
          {pct >= 100 && <div className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="w-3 h-3" /><span>Hoàn thành!</span></div>}
        </div>
      </div>
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────
interface FD {
  title: string; description: string; targetAmount: string; initialAmount: string;
  startDate: string; deadline: string; goalCategory: GoalCategory;
  priority: 'low' | 'medium' | 'high'; iconEmoji: string; color: string;
  reminderEnabled: boolean; reminderFrequency: 'weekly' | 'monthly'; imageUrl: string;
}
const EMPTY_FD: FD = {
  title: '', description: '', targetAmount: '', initialAmount: '0',
  startDate: toDate(new Date()), deadline: toDate(new Date(Date.now() + 365 * 86400000)),
  goalCategory: 'other', priority: 'medium', iconEmoji: '🎯', color: '#6366f1',
  reminderEnabled: false, reminderFrequency: 'monthly', imageUrl: '',
};

function GoalFormModal({ initial, onClose, onSave }: { initial?: FinancialGoal; onClose: () => void; onSave: (d: FD) => void }) {
  const [form, setForm] = useState<FD>(initial ? {
    title: initial.title, description: initial.description ?? '',
    targetAmount: String(initial.targetAmount), initialAmount: String(initial.initialAmount),
    startDate: initial.startDate, deadline: initial.deadline,
    goalCategory: initial.goalCategory, priority: initial.priority,
    iconEmoji: initial.iconEmoji, color: initial.color,
    reminderEnabled: initial.reminderEnabled,
    reminderFrequency: initial.reminderFrequency ?? 'monthly',
    imageUrl: initial.imageUrl ?? '',
  } : EMPTY_FD);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const upd = (k: keyof FD, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Vui lòng nhập tên';
    const t = Number(form.targetAmount);
    if (!t || t <= 0) e.targetAmount = 'Phải lớn hơn 0';
    const i2 = Number(form.initialAmount);
    if (i2 < 0) e.initialAmount = 'Không được âm';
    if (i2 >= t && t > 0) e.initialAmount = 'Phải nhỏ hơn mục tiêu';
    if (form.deadline <= form.startDate) e.deadline = 'Phải sau ngày bắt đầu';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-100">{initial ? 'Chỉnh sửa mục tiêu' : 'Tạo mục tiêu mới'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="flex gap-3 items-start">
            {/* Icon preview – auto-derived from category */}
            {(() => { const { Icon, color } = getCatIconCfg(form.goalCategory); return (
              <div className="w-14 h-14 flex-shrink-0 rounded-xl flex items-center justify-center border border-slate-700" style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-7 h-7" style={{ color }} />
              </div>
            );})()} 
            <div className="flex-1">
              <label className={lCls}>Tên mục tiêu *</label>
              <input className={iCls} placeholder="VD: Mua MacBook Pro" value={form.title} onChange={e => upd('title', e.target.value)} />
              {errs.title && <p className="text-[11px] text-red-400 mt-1">{errs.title}</p>}
            </div>
          </div>
          <div>
            <label className={lCls}>Màu sắc</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => <button key={c} onClick={() => upd('color', c)} className="w-7 h-7 rounded-full border-2 transition-all" style={{ background: c, borderColor: form.color === c ? '#fff' : 'transparent' }} />)}
            </div>
          </div>
          <div>
            <label className={lCls}>Mô tả</label>
            <textarea className={cn(iCls, 'resize-none h-16')} placeholder="Mô tả chi tiết..." value={form.description} onChange={e => upd('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lCls}>Số tiền mục tiêu (đ) *</label>
              <input type="number" min={0} className={iCls} placeholder="30000000" value={form.targetAmount} onChange={e => upd('targetAmount', e.target.value)} />
              {errs.targetAmount && <p className="text-[11px] text-red-400 mt-1">{errs.targetAmount}</p>}
            </div>
            <div>
              <label className={lCls}>Số tiền đã có (đ)</label>
              <input type="number" min={0} className={iCls} placeholder="0" value={form.initialAmount} onChange={e => upd('initialAmount', e.target.value)} />
              {errs.initialAmount && <p className="text-[11px] text-red-400 mt-1">{errs.initialAmount}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lCls}>Ngày bắt đầu</label>
              <input type="date" className={iCls} value={form.startDate} onChange={e => upd('startDate', e.target.value)} />
            </div>
            <div>
              <label className={lCls}>Hạn hoàn thành *</label>
              <input type="date" className={iCls} value={form.deadline} onChange={e => upd('deadline', e.target.value)} />
              {errs.deadline && <p className="text-[11px] text-red-400 mt-1">{errs.deadline}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lCls}>Danh mục</label>
              <div className="relative">
                <select className={cn(iCls, 'appearance-none pr-8')} value={form.goalCategory} onChange={e => upd('goalCategory', e.target.value)}>
                  {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={lCls}>Mức ưu tiên</label>
              <div className="relative">
                <select className={cn(iCls, 'appearance-none pr-8')} value={form.priority} onChange={e => upd('priority', e.target.value as FD['priority'])}>
                  <option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className={lCls}>Ảnh đại diện URL (tùy chọn)</label>
            <input className={iCls} placeholder="https://..." value={form.imageUrl} onChange={e => upd('imageUrl', e.target.value)} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/40">
            <div>
              <div className="text-sm font-medium text-slate-200">Nhắc nhở</div>
              <div className="text-xs text-slate-500">Nhận thông báo nhắc tiết kiệm</div>
            </div>
            <div className="flex items-center gap-3">
              {form.reminderEnabled && (
                <select className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 appearance-none focus:outline-none" value={form.reminderFrequency} onChange={e => upd('reminderFrequency', e.target.value)}>
                  <option value="weekly">Hàng tuần</option><option value="monthly">Hàng tháng</option>
                </select>
              )}
              <button onClick={() => upd('reminderEnabled', !form.reminderEnabled)} className="relative rounded-full transition-all flex-shrink-0" style={{ height: '22px', width: '40px', background: form.reminderEnabled ? '#6366f1' : '#334155' }}>
                <span className="absolute top-0.5 rounded-full bg-white shadow transition-all" style={{ width: '18px', height: '18px', left: form.reminderEnabled ? '18px' : '2px' }} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors">Hủy</button>
          <button onClick={() => { if (validate()) onSave(form); }} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" />{initial ? 'Lưu thay đổi' : 'Tạo mục tiêu'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ContributionForm ─────────────────────────────────────────────
function ContribForm({ initial, onClose, onSave }: {
  initial?: GoalContribution; onClose: () => void;
  onSave: (data: { amount: number; note: string; date: string }, id?: string) => void;
}) {
  const [tp, setTp]     = useState<'deposit' | 'withdraw'>(initial ? (initial.amount >= 0 ? 'deposit' : 'withdraw') : 'deposit');
  const [amt, setAmt]   = useState(initial ? String(Math.abs(initial.amount)) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(initial?.date.split('T')[0] ?? toDate(new Date()));
  const [err, setErr]   = useState('');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100">{initial ? 'Chỉnh sửa giao dịch' : 'Nạp / Rút tiền'}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['deposit', 'withdraw'] as const).map(t => (
              <button key={t} onClick={() => setTp(t)} className={cn('flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all border',
                tp === t ? (t === 'deposit' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30') : 'bg-slate-800/60 text-slate-400 border-slate-700/60')}>
                {t === 'deposit' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                {t === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
              </button>
            ))}
          </div>
          <div>
            <label className={lCls}>Số tiền (đ) *</label>
            <input type="number" min={0} className={iCls} placeholder="0" value={amt} onChange={e => { setAmt(e.target.value); setErr(''); }} />
            {err && <p className="text-[11px] text-red-400 mt-1">{err}</p>}
          </div>
          <div><label className={lCls}>Ghi chú</label><input className={iCls} placeholder="VD: Tiền thưởng tháng 8" value={note} onChange={e => setNote(e.target.value)} /></div>
          <div><label className={lCls}>Ngày</label><input type="date" className={iCls} value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-slate-800">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors">Hủy</button>
          <button onClick={() => { const n = Number(amt); if (!n || n <= 0) { setErr('Nhập số tiền hợp lệ'); return; } onSave({ amount: tp === 'deposit' ? n : -n, note, date }, initial?.id); }}
            className={cn('flex-1 py-2 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5', tp === 'deposit' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500')}>
            <Check className="w-3.5 h-3.5" />{initial ? 'Lưu' : tp === 'deposit' ? 'Nạp' : 'Rút'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DetailModal ──────────────────────────────────────────────────
type Tab = 'overview' | 'contributions' | 'stats';

function DetailModal({ goal, onClose, onEdit, onAddC, onUpdC, onDelC, onUpdStatus }: {
  goal: FinancialGoal; onClose: () => void; onEdit: () => void;
  onAddC: (d: { amount: number; note: string; date: string }) => void;
  onUpdC: (id: string, d: { amount: number; note: string; date: string }) => void;
  onDelC: (id: string) => void;
  onUpdStatus: (s: GoalLifecycleStatus) => void;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [showCF, setShowCF] = useState(false);
  const [editC, setEditC]   = useState<GoalContribution | null>(null);
  const [mode, setMode]     = useState<'monthly' | 'weekly' | 'daily'>('monthly');

  const pct  = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  const rem  = Math.max(0, goal.targetAmount - goal.currentAmount);
  const left = daysLeft(goal.deadline);
  const st   = STATUS[goal.status];
  const spd  = left > 0 && rem > 0 ? Math.ceil(rem / left) : 0;

  const contribs = useMemo(() => [...(goal.contributions ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [goal.contributions]);

  const predicted = useMemo(() => {
    const deps = contribs.filter(c => c.amount > 0);
    if (deps.length < 2 || rem <= 0) return null;
    const tot = deps.reduce((s, c) => s + c.amount, 0);
    const months = Math.max(1, (new Date(deps[0].date).getTime() - new Date(deps[deps.length - 1].date).getTime()) / (30 * 86400000));
    const avg = tot / months;
    if (avg <= 0) return null;
    const dt = new Date();
    dt.setMonth(dt.getMonth() + Math.ceil(rem / avg));
    return dt;
  }, [contribs, rem]);

  const chartData = useMemo(() => {
    const sorted = [...(goal.contributions ?? [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let running = goal.initialAmount;
    const pts: { name: string; amount: number }[] = [{ name: fmtVI(goal.startDate), amount: running }];
    sorted.forEach(c => { running += c.amount; pts.push({ name: fmtVI(c.date), amount: running }); });
    return pts;
  }, [goal.contributions, goal.initialAmount, goal.startDate]);

  const TABS = [
    { key: 'overview' as Tab, label: 'Tổng quan' },
    { key: 'contributions' as Tab, label: 'Nạp tiền' },
    { key: 'stats' as Tab, label: 'Thống kê' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
          <div className="h-1 flex-shrink-0" style={{ background: `linear-gradient(90deg,${goal.color},${goal.color}60)` }} />
          <div className="flex items-start justify-between px-6 pt-4 pb-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              {(() => { const { Icon, color } = getCatIconCfg(goal.goalCategory); return (
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
              );})()} 
              <div>
                <h2 className="text-base font-semibold text-slate-100">{goal.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', st.bg)}>{st.label}</span>
                  <span className="text-xs text-slate-500">Hạn: {fmtVI(goal.deadline)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex gap-1 px-6 pb-3 flex-shrink-0 border-b border-slate-800">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', tab === t.key ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60')}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto flex-1 p-6">
            {tab === 'overview' && (
              <div className="space-y-5">
                {goal.description && <p className="text-sm text-slate-400">{goal.description}</p>}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-300">Tiến độ</span>
                    <span className="text-xl font-bold" style={{ color: goal.color }}>{pct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden mb-3">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${goal.color},${goal.color}cc)`, boxShadow: `0 0 10px ${goal.color}60`, transition: 'width 0.7s' }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[{ l: 'Đã có', v: fmt(goal.currentAmount), c: 'text-green-400' }, { l: 'Mục tiêu', v: fmt(goal.targetAmount), c: 'text-slate-200' }, { l: 'Còn thiếu', v: fmt(rem), c: 'text-orange-400' }].map((r, i) => (
                      <div key={i}><div className="text-[10px] text-slate-500 mb-0.5">{r.l}</div><div className={cn('text-xs font-semibold', r.c)}>{r.v}</div></div>
                    ))}
                  </div>
                </div>
                {goal.milestones.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Các cột mốc</h4>
                    <div className="space-y-2">
                      {goal.milestones.map(m => (
                        <div key={m.id} className={cn('flex items-center gap-3 p-3 rounded-xl border', m.isAchieved ? 'border-green-500/20 bg-green-500/5' : 'border-slate-800/60 bg-slate-900/40')}>
                          <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0', m.isAchieved ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500')}>
                            {m.isAchieved ? <Check className="w-3 h-3" /> : <span className="text-[8px] font-bold">{Math.min(100, Math.round((goal.currentAmount / m.targetAmount) * 100))}%</span>}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-slate-300">{m.title}</div>
                            <div className="text-[10px] text-slate-500">{fmt(m.targetAmount)}</div>
                          </div>
                          {m.isAchieved && m.achievedAt && <div className="text-[10px] text-green-400">{fmtVI(m.achievedAt)}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {rem > 0 && left > 0 && (
                  <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                    <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-yellow-400" /><h4 className="text-sm font-medium text-slate-200">Kế hoạch tiết kiệm</h4></div>
                    <div className="flex gap-1.5 mb-4">
                      {(['monthly', 'weekly', 'daily'] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)} className={cn('flex-1 py-1 rounded-lg text-xs font-medium transition-all border', mode === m ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-800/60 text-slate-500 border-slate-700/60')}>
                          {m === 'monthly' ? 'Tháng' : m === 'weekly' ? 'Tuần' : 'Ngày'}
                        </button>
                      ))}
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-400 mb-1">{fmtC(mode === 'monthly' ? spd * 30 : mode === 'weekly' ? spd * 7 : spd)}đ</div>
                      <div className="text-xs text-slate-400">cần tiết kiệm mỗi {mode === 'monthly' ? 'tháng' : mode === 'weekly' ? 'tuần' : 'ngày'}</div>
                    </div>
                  </div>
                )}
                {predicted && rem > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                    <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-slate-300 mb-0.5">Dự đoán ngày hoàn thành</div>
                      <div className="text-xs text-slate-400">Với tốc độ hiện tại, bạn sẽ đạt mục tiêu vào <span className="text-cyan-400 font-semibold">{fmtVI(predicted.toISOString())}</span></div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-xs"><Calendar className="w-3 h-3" /> Bắt đầu</div>
                    <div className="text-sm font-medium text-slate-200">{fmtVI(goal.startDate)}</div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-xs"><Clock className="w-3 h-3" /> Hạn chót</div>
                    <div className={cn('text-sm font-medium', left < 0 ? 'text-red-400' : left < 30 ? 'text-orange-400' : 'text-slate-200')}>{fmtVI(goal.deadline)} {left >= 0 ? `(còn ${left} ngày)` : `(quá ${Math.abs(left)} ngày)`}</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-400 mb-2">Trạng thái</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(STATUS) as GoalLifecycleStatus[]).map(s => (
                      <button key={s} onClick={() => onUpdStatus(s)} className={cn('text-[10px] font-medium px-2.5 py-1.5 rounded-full border transition-all', goal.status === s ? STATUS[s].bg : 'border-slate-700/60 text-slate-500 hover:border-slate-600 bg-slate-800/40')}>
                        {STATUS[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {tab === 'contributions' && (
              <div className="space-y-4">
                <button onClick={() => setShowCF(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4" /> Thêm giao dịch
                </button>
                {contribs.length === 0 ? <div className="text-center py-8 text-slate-500 text-sm">Chưa có giao dịch nào</div> : (
                  <div className="space-y-2">
                    {contribs.map(c => (
                      <div key={c.id} className={cn('group flex items-center gap-3 p-3 rounded-xl border transition-all', c.amount >= 0 ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5')}>
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', c.amount >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                          {c.amount >= 0 ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-sm font-semibold', c.amount >= 0 ? 'text-green-400' : 'text-red-400')}>{c.amount >= 0 ? '+' : ''}{fmt(c.amount)}</span>
                            {c.note && <span className="text-xs text-slate-500 truncate">{c.note}</span>}
                          </div>
                          <div className="text-[10px] text-slate-500">{fmtVI(c.date)}</div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditC(c)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => onDelC(c.id)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === 'stats' && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'Tổng đóng góp', v: `${fmtC(contribs.filter(c => c.amount > 0).reduce((s, c) => s + c.amount, 0))}đ`, color: 'text-green-400' },
                    { l: 'Số lần nạp',    v: String(contribs.filter(c => c.amount > 0).length),                                  color: 'text-indigo-400' },
                    { l: 'TB / tháng',   v: (() => { const d2 = contribs.filter(c => c.amount > 0); if (d2.length === 0) return '--'; const tot = d2.reduce((s, c) => s + c.amount, 0); const m = Math.max(1, (new Date(d2[0].date).getTime() - new Date(d2[d2.length - 1].date).getTime()) / (30 * 86400000)); return `${fmtC(tot / m)}đ`; })(), color: 'text-cyan-400' },
                  ].map((s, i) => <div key={i} className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/40 text-center"><div className={cn('text-lg font-bold mb-0.5', s.color)}>{s.v}</div><div className="text-[10px] text-slate-500">{s.l}</div></div>)}
                </div>
                {chartData.length > 1 ? (
                  <div>
                    <h4 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wide">Tiến độ tiết kiệm</h4>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                          <defs>
                            <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={goal.color} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={goal.color} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtC} width={48} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} formatter={(v) => [fmt(Number(v)), 'Đã có']} />
                          <Area type="monotone" dataKey="amount" stroke={goal.color} strokeWidth={2} fill="url(#goalGrad)" dot={{ fill: goal.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: goal.color }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : <div className="text-center py-10 text-slate-600 text-sm">Cần ít nhất 2 giao dịch để hiển thị biểu đồ</div>}
              </div>
            )}
          </div>
        </div>
      </div>
      {showCF && <ContribForm onClose={() => setShowCF(false)} onSave={(d) => { onAddC(d); setShowCF(false); }} />}
      {editC && <ContribForm initial={editC} onClose={() => setEditC(null)} onSave={(d, id) => { if (id) onUpdC(id, d); setEditC(null); }} />}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
type FS = 'all' | GoalLifecycleStatus;
type SK = 'deadline' | 'pct' | 'amount' | 'priority';

export default function GoalsPage() {
  const goals = useGoals();
  const { addGoal, updateGoal, deleteGoal, addContribution, updateContribution, deleteContribution } = useFinanceStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal]     = useState<FinancialGoal | null>(null);
  const [detailId, setDetailId]     = useState<string | null>(null);
  const [fStatus, setFStatus]       = useState<FS>('all');
  const [fCat, setFCat]             = useState<GoalCategory | 'all'>('all');
  const [sortK, setSortK]           = useState<SK>('deadline');
  const [asc, setAsc]               = useState(true);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  const detailGoal = goals.find(g => g.id === detailId) ?? null;

  const effective = useMemo(() => goals.map(g => {
    if (g.status === 'active' && daysLeft(g.deadline) < 0 && g.currentAmount < g.targetAmount)
      return { ...g, status: 'overdue' as GoalLifecycleStatus };
    return g;
  }), [goals]);

  const filtered = useMemo(() => {
    let list = effective;
    if (fStatus !== 'all') list = list.filter(g => g.status === fStatus);
    if (fCat !== 'all') list = list.filter(g => g.goalCategory === fCat);
    return [...list].sort((a, b) => {
      let v = 0;
      if (sortK === 'deadline') v = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      else if (sortK === 'pct') v = (a.currentAmount / a.targetAmount) - (b.currentAmount / b.targetAmount);
      else if (sortK === 'amount') v = b.targetAmount - a.targetAmount;
      else { const p: Record<string, number> = { high: 0, medium: 1, low: 2 }; v = p[a.priority] - p[b.priority]; }
      return asc ? v : -v;
    });
  }, [effective, fStatus, fCat, sortK, asc]);

  const handleCreate = useCallback(async (d: FD) => {
    await addGoal({ title: d.title, description: d.description, targetAmount: Number(d.targetAmount), currentAmount: Number(d.initialAmount), initialAmount: Number(d.initialAmount), currency: 'VND', startDate: d.startDate, deadline: d.deadline, status: 'active', goalCategory: d.goalCategory, priority: d.priority, iconEmoji: d.iconEmoji, color: d.color, imageUrl: d.imageUrl || undefined, contributions: [], milestones: [], reminderEnabled: d.reminderEnabled, reminderFrequency: d.reminderEnabled ? d.reminderFrequency : undefined });
    setShowCreate(false);
  }, [addGoal]);

  const handleEdit = useCallback(async (d: FD) => {
    if (!editGoal) return;
    const cs = (editGoal.contributions ?? []).reduce((s, c) => s + c.amount, 0);
    await updateGoal(editGoal.id, { title: d.title, description: d.description, targetAmount: Number(d.targetAmount), initialAmount: Number(d.initialAmount), currentAmount: Number(d.initialAmount) + cs, startDate: d.startDate, deadline: d.deadline, goalCategory: d.goalCategory, priority: d.priority, iconEmoji: d.iconEmoji, color: d.color, imageUrl: d.imageUrl || undefined, reminderEnabled: d.reminderEnabled, reminderFrequency: d.reminderEnabled ? d.reminderFrequency : undefined });
    setEditGoal(null); setDetailId(null);
  }, [editGoal, updateGoal]);

  const handleDel = useCallback(async (id: string) => {
    await deleteGoal(id);
    setDelConfirm(null);
    if (detailId === id) setDetailId(null);
  }, [deleteGoal, detailId]);

  return (
    <div className="min-h-screen p-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><Target className="w-6 h-6 text-indigo-400" />Mục tiêu Tài chính</h1>
          <p className="text-sm text-slate-400 mt-1">Theo dõi và đạt được các mục tiêu tài chính của bạn</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95">
          <Plus className="w-4 h-4" /> Tạo mục tiêu
        </button>
      </div>

      <GoalsDashboard goals={effective} />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 overflow-x-auto">
          {(['all', 'active', 'completed', 'paused', 'overdue', 'cancelled'] as FS[]).map(s => (
            <button key={s} onClick={() => setFStatus(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap', fStatus === s ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300')}>
              {s === 'all' ? 'Tất cả' : STATUS[s].label}
            </button>
          ))}
        </div>
        <div className="relative">
          <select className="text-xs bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 appearance-none pr-7 focus:outline-none" value={fCat} onChange={e => setFCat(e.target.value as GoalCategory | 'all')}>
            <option value="all">Mọi danh mục</option>
            {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-slate-500">Sắp xếp:</span>
          {([{ key: 'deadline' as SK, l: 'Hạn' }, { key: 'pct' as SK, l: '% xong' }, { key: 'priority' as SK, l: 'Ưu tiên' }, { key: 'amount' as SK, l: 'Số tiền' }]).map(o => (
            <button key={o.key} onClick={() => { if (sortK === o.key) setAsc(a => !a); else { setSortK(o.key); setAsc(true); } }} className={cn('px-2.5 py-1 rounded-lg text-xs transition-all', sortK === o.key ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300')}>
              {o.l}{sortK === o.key ? (asc ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"><Target className="w-8 h-8 text-indigo-400" /></div>
          <div className="text-center">
            <h3 className="text-slate-200 font-medium mb-1">Chưa có mục tiêu nào</h3>
            <p className="text-slate-500 text-sm">Tạo mục tiêu đầu tiên để bắt đầu hành trình tiết kiệm!</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors"><Plus className="w-4 h-4" /> Tạo ngay</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(g => <GoalCard key={g.id} goal={g} onOpen={() => setDetailId(g.id)} onDelete={() => setDelConfirm(g.id)} />)}
        </div>
      )}

      {showCreate && <GoalFormModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {editGoal && <GoalFormModal initial={editGoal} onClose={() => setEditGoal(null)} onSave={handleEdit} />}
      {detailGoal && (
        <DetailModal goal={detailGoal} onClose={() => setDetailId(null)} onEdit={() => { setEditGoal(detailGoal); setDetailId(null); }}
          onAddC={d => addContribution(detailGoal.id, d)}
          onUpdC={(id, d) => updateContribution(detailGoal.id, id, d)}
          onDelC={id => deleteContribution(detailGoal.id, id)}
          onUpdStatus={s => updateGoal(detailGoal.id, { status: s })} />
      )}

      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDelConfirm(null)} />
          <div className="relative bg-[#0f172a] border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
              <h3 className="text-base font-semibold text-slate-100">Xóa mục tiêu?</h3>
            </div>
            <p className="text-sm text-slate-400 mb-5">Bạn có chắc muốn xóa mục tiêu này? Tất cả lịch sử giao dịch sẽ bị mất.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)} className="flex-1 py-2 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors">Hủy</button>
              <button onClick={() => handleDel(delConfirm!)} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
