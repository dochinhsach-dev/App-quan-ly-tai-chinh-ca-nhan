// ─────────────────────────────────────────────────────────────────
//  Transactions Page – Full CRUD: list, add, edit, delete + filters
// ─────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from "react";
import {
  Search, Plus, Filter, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  Trash2, Edit2, X, Check, ChevronDown, Calendar,
  TrendingUp, TrendingDown,
  SlidersHorizontal, AlertCircle, RotateCcw, Receipt,
  Tag, Repeat, Building2, MapPin, FileText, Clock,
} from "lucide-react";
import { cn, formatVND, formatDate } from "../utils/helpers";
import { useTransactions, useCategories, useFinanceStore } from "../stores/useFinanceStore";
import type { Transaction, TransactionType, Category, RecurringInterval } from "../types/finance";

// ── Constants ─────────────────────────────────────────────────────
const TYPE_CFG = {
  income:   { label: "Thu nhập",     color: "#4ade80", bg: "#4ade8015", icon: ArrowDownLeft,  sign: "+" },
  expense:  { label: "Chi tiêu",     color: "#f87171", bg: "#f8717115", icon: ArrowUpRight,   sign: "-" },
  transfer: { label: "Chuyển khoản", color: "#818cf8", bg: "#818cf815", icon: ArrowLeftRight, sign: "⇄" },
} as const;

const MONTHS_VI = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
];

const RECURRING_LABELS: Record<RecurringInterval, string> = {
  daily: "Hằng ngày", weekly: "Hằng tuần",
  monthly: "Hằng tháng", yearly: "Hằng năm",
};

const PAGE_SIZE = 12;
const inputCls = "w-full bg-surface-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors";
const labelCls = "text-xs font-medium text-slate-400";
const errCls   = "text-[11px] text-danger-400 mt-1";

// ── Form types ────────────────────────────────────────────────────
interface TxForm {
  type: TransactionType; amount: string; categoryId: string;
  description: string; note: string; date: string;
  merchantName: string; location: string; tags: string;
  isRecurring: boolean; recurringInterval: RecurringInterval;
}

const emptyForm = (): TxForm => ({
  type: "expense", amount: "", categoryId: "", description: "",
  note: "", date: new Date().toISOString().split("T")[0],
  merchantName: "", location: "", tags: "",
  isRecurring: false, recurringInterval: "monthly",
});

function txToForm(tx: Transaction): TxForm {
  return {
    type: tx.type, amount: String(tx.amount), categoryId: tx.categoryId,
    description: tx.description, note: tx.note ?? "",
    date: tx.date.split("T")[0], merchantName: tx.merchantName ?? "",
    location: tx.location ?? "", tags: (tx.tags ?? []).join(", "),
    isRecurring: tx.isRecurring, recurringInterval: tx.recurringInterval ?? "monthly",
  };
}

// ── TransactionModal ──────────────────────────────────────────────
function TransactionModal({ mode, init, txId, onClose }: {
  mode: "add" | "edit"; init?: TxForm; txId?: string; onClose: () => void;
}) {
  const categories        = useCategories();
  const addTransaction    = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const [form, setForm]   = useState<TxForm>(init ?? emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof TxForm, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof TxForm, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const filteredCats = categories.filter((c) =>
    form.type === "income" ? ["cat-09","cat-10"].includes(c.id) : !["cat-09","cat-10"].includes(c.id)
  );

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = "Số tiền phải lớn hơn 0";
    if (!form.description.trim()) e.description = "Mô tả không được trống";
    if (!form.categoryId) e.categoryId = "Vui lòng chọn danh mục";
    if (!form.date) e.date = "Vui lòng chọn ngày";
    setErrors(e); return !Object.keys(e).length;
  }

  function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    const p = {
      type: form.type, amount: +form.amount, currency: "VND",
      categoryId: form.categoryId, description: form.description.trim(),
      note: form.note.trim() || undefined, date: `${form.date}T12:00:00Z`,
      merchantName: form.merchantName.trim() || undefined,
      location: form.location.trim() || undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      isRecurring: form.isRecurring,
      recurringInterval: form.isRecurring ? form.recurringInterval : undefined,
    };
    setTimeout(() => {
      if (mode === "add") addTransaction(p);
      else if (txId) updateTransaction(txId, p);
      setSaving(false); onClose();
    }, 400);
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-900 border border-slate-700/60 rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/70 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
              {mode === "add" ? <Plus className="w-4 h-4 text-brand-400" /> : <Edit2 className="w-4 h-4 text-brand-400" />}
            </div>
            <h2 className="text-base font-semibold text-slate-100">
              {mode === "add" ? "Thêm giao dịch mới" : "Chỉnh sửa giao dịch"}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Type tabs */}
          <div>
            <p className={labelCls}>Loại giao dịch</p>
            <div className="flex gap-2 mt-2">
              {(["expense","income","transfer"] as TransactionType[]).map((t) => {
                const cfg = TYPE_CFG[t]; const Ico = cfg.icon;
                return (
                  <button key={t} onClick={() => { set("type", t); set("categoryId", ""); }}
                    className={cn("flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all duration-200",
                      form.type === t ? "shadow-inner" : "border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200")}
                    style={form.type === t ? { color: cfg.color, backgroundColor: cfg.bg, borderColor: `${cfg.color}40` } : {}}>
                    <Ico className="w-4 h-4" />{cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <p className={labelCls}>Số tiền (VND) *</p>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₫</span>
              <input type="number" placeholder="0" value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                className={cn(inputCls, "pl-7", errors.amount && "border-danger-500/60")} />
            </div>
            {errors.amount && <p className={errCls}>{errors.amount}</p>}
            {form.amount && !errors.amount && <p className="text-[11px] text-slate-500 mt-1">{formatVND(+form.amount)}</p>}
          </div>

          {/* Description */}
          <div>
            <p className={labelCls}>Mô tả *</p>
            <div className="relative mt-1">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input type="text" placeholder="VD: Ăn tối với gia đình" value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={cn(inputCls, "pl-8", errors.description && "border-danger-500/60")} />
            </div>
            {errors.description && <p className={errCls}>{errors.description}</p>}
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelCls}>Danh mục *</p>
              <div className="relative mt-1">
                <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}
                  className={cn(inputCls, "appearance-none pr-8", errors.categoryId && "border-danger-500/60")}>
                  <option value="">Chọn danh mục</option>
                  {filteredCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              {errors.categoryId && <p className={errCls}>{errors.categoryId}</p>}
            </div>
            <div>
              <p className={labelCls}>Ngày *</p>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  className={cn(inputCls, "pl-8", errors.date && "border-danger-500/60")} />
              </div>
              {errors.date && <p className={errCls}>{errors.date}</p>}
            </div>
          </div>

          {/* Merchant + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelCls}>Thương nhân</p>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type="text" placeholder="VD: Circle K" value={form.merchantName}
                  onChange={(e) => set("merchantName", e.target.value)} className={cn(inputCls, "pl-8")} />
              </div>
            </div>
            <div>
              <p className={labelCls}>Địa điểm</p>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type="text" placeholder="VD: Quận 1, HCM" value={form.location}
                  onChange={(e) => set("location", e.target.value)} className={cn(inputCls, "pl-8")} />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className={labelCls}>Tags (phân cách bằng dấu phẩy)</p>
            <div className="relative mt-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input type="text" placeholder="VD: ăn uống, bạn bè" value={form.tags}
                onChange={(e) => set("tags", e.target.value)} className={cn(inputCls, "pl-8")} />
            </div>
          </div>

          {/* Note */}
          <div>
            <p className={labelCls}>Ghi chú</p>
            <textarea placeholder="Thêm ghi chú…" value={form.note}
              onChange={(e) => set("note", e.target.value)} rows={2}
              className={cn(inputCls, "mt-1 resize-none")} />
          </div>

          {/* Recurring toggle */}
          <div className="p-3.5 bg-surface-950 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-medium text-slate-200">Giao dịch định kỳ</span>
              </div>
              <button type="button" onClick={() => set("isRecurring", !form.isRecurring)}
                className={cn("relative rounded-full transition-colors duration-200", form.isRecurring ? "bg-brand-500" : "bg-slate-700")}
                style={{ width: 40, height: 22 }}>
                <span className="absolute bg-white rounded-full shadow transition-all duration-200"
                  style={{ width: 18, height: 18, top: 2, left: form.isRecurring ? 20 : 2 }} />
              </button>
            </div>
            {form.isRecurring && (
              <div className="mt-3 relative">
                <select value={form.recurringInterval} onChange={(e) => set("recurringInterval", e.target.value)}
                  className={cn(inputCls, "appearance-none pr-8")}>
                  {(Object.entries(RECURRING_LABELS) as [RecurringInterval, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800/70 bg-surface-950/60 flex-shrink-0">
          <button onClick={onClose} className="btn flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">Hủy</button>
          <button onClick={handleSubmit} disabled={saving}
            className="btn flex-1 bg-brand-500 hover:bg-brand-400 text-white text-sm shadow-glow-brand disabled:opacity-60 flex items-center justify-center gap-2">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Check className="w-4 h-4" />}
            {mode === "add" ? "Thêm giao dịch" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DeleteConfirmModal ────────────────────────────────────────────
function DeleteConfirmModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const [deleting, setDeleting] = useState(false);
  function handleDelete() {
    setDeleting(true);
    setTimeout(() => { deleteTransaction(tx.id); setDeleting(false); onClose(); }, 300);
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
            <h3 className="text-base font-bold text-slate-100">Xoá giao dịch?</h3>
            <p className="text-sm text-slate-400 mt-1">
              Bạn sẽ xoá <span className="text-slate-200 font-medium">"{tx.description}"</span>. Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="btn flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">Giữ lại</button>
            <button onClick={handleDelete} disabled={deleting}
              className="btn flex-1 bg-danger-500 hover:bg-danger-400 text-white text-sm flex items-center justify-center gap-2">
              {deleting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Trash2 className="w-3.5 h-3.5" />Xoá
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TxRow ─────────────────────────────────────────────────────────
function TxRow({ tx, category, onEdit, onDelete }: {
  tx: Transaction; category: Category | undefined;
  onEdit: () => void; onDelete: () => void;
}) {
  const cfg = TYPE_CFG[tx.type];
  const Icon = cfg.icon;
  const catColor = category?.color ?? "#818cf8";
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800/30 rounded-xl transition-colors group">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${catColor}18`, border: `1px solid ${catColor}35` }}>
        <Icon className="w-4 h-4" style={{ color: catColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-slate-200 truncate">{tx.description}</p>
          {tx.isRecurring && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-md flex-shrink-0">
              <Repeat className="w-2.5 h-2.5" />
              {tx.recurringInterval && RECURRING_LABELS[tx.recurringInterval]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {category && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0"
              style={{ color: catColor, backgroundColor: `${catColor}15` }}>{category.name}</span>
          )}
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />{formatDate(tx.date)}
          </span>
          {tx.merchantName && <span className="text-[10px] text-slate-500">· {tx.merchantName}</span>}
          {tx.tags && tx.tags.length > 0 && (
            <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
              <Tag className="w-2.5 h-2.5" />{tx.tags.slice(0, 2).join(", ")}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0 mr-2">
        <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.sign}{formatVND(tx.amount)}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{tx.currency}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all" title="Chỉnh sửa">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-500 hover:text-danger-400 hover:bg-danger-500/10 transition-all" title="Xoá">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── SummaryBar ────────────────────────────────────────────────────
function SummaryBar({ txs }: { txs: Transaction[] }) {
  const inc = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const exp = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = inc - exp;
  const cards = [
    { label: "Tổng thu",   value: inc,          color: "#4ade80", Icon: TrendingUp,   sign: "+" },
    { label: "Tổng chi",   value: exp,          color: "#f87171", Icon: TrendingDown, sign: "-" },
    { label: "Chênh lệch", value: Math.abs(net), color: net >= 0 ? "#4ade80" : "#f87171", Icon: net >= 0 ? TrendingUp : TrendingDown, sign: net >= 0 ? "+" : "-" },
  ] as const;
  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(({ label, value, color, Icon, sign }) => (
        <div key={label} className="rounded-2xl border p-4 flex items-center gap-3"
          style={{ backgroundColor: `${color}08`, borderColor: `${color}25` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-bold truncate" style={{ color }}>{sign}{formatVND(value)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function Transactions() {
  const transactions = useTransactions();
  const categories   = useCategories();
  const n = new Date();

  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<TransactionType | "all">("all");
  const [catFilter,   setCatFilter]   = useState("all");
  const [monthFilter, setMonthFilter] = useState(n.getMonth());
  const [yearFilter,  setYearFilter]  = useState(n.getFullYear());
  const [sortBy,      setSortBy]      = useState<"date" | "amount">("date");
  const [sortDir,     setSortDir]     = useState<"desc" | "asc">("desc");
  const [page,        setPage]        = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [addOpen,     setAddOpen]     = useState(false);
  const [editTx,      setEditTx]      = useState<Transaction | null>(null);
  const [deleteTx,    setDeleteTx]    = useState<Transaction | null>(null);

  const getCat = (id: string) => categories.find((c) => c.id === id);

  const filtered = useMemo(() => {
    let list = transactions.filter((tx) => {
      const d = new Date(tx.date);
      if (d.getMonth() !== monthFilter || d.getFullYear() !== yearFilter) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (catFilter !== "all" && tx.categoryId !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!tx.description.toLowerCase().includes(q) &&
            !(tx.merchantName ?? "").toLowerCase().includes(q) &&
            !(tx.note ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      const d = sortBy === "date"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : b.amount - a.amount;
      return sortDir === "desc" ? d : -d;
    });
    return list;
  }, [transactions, monthFilter, yearFilter, typeFilter, catFilter, search, sortBy, sortDir]);

  const paginated  = filtered.slice(0, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasFilters = typeFilter !== "all" || catFilter !== "all" || !!search;

  useEffect(() => { setPage(1); }, [search, typeFilter, catFilter, monthFilter, yearFilter]);

  function resetFilters() {
    setSearch(""); setTypeFilter("all"); setCatFilter("all");
    setMonthFilter(n.getMonth()); setYearFilter(n.getFullYear());
    setSortBy("date"); setSortDir("desc");
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-400" />
            Quản lý Giao dịch
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} giao dịch trong{" "}
            <span className="text-slate-300">{MONTHS_VI[monthFilter]} {yearFilter}</span>
          </p>
        </div>
        <button id="btn-add-transaction" onClick={() => setAddOpen(true)}
          className="btn bg-brand-500 hover:bg-brand-400 text-white text-sm shadow-glow-brand flex items-center gap-2">
          <Plus className="w-4 h-4" />Thêm giao dịch
        </button>
      </div>

      {/* Summary */}
      <SummaryBar txs={filtered} />

      {/* Filter card */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input type="text" placeholder="Tìm theo mô tả, thương nhân…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Month/Year */}
          <div className="flex items-center gap-2 bg-surface-950 border border-slate-800 rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select value={monthFilter} onChange={(e) => setMonthFilter(+e.target.value)}
              className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer">
              {MONTHS_VI.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={yearFilter} onChange={(e) => setYearFilter(+e.target.value)}
              className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer">
              {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Filter toggle */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all",
              showFilters ? "bg-brand-500/15 border-brand-500/30 text-brand-400" : "bg-surface-950 border-slate-800 text-slate-400 hover:text-slate-200")}>
            <SlidersHorizontal className="w-3.5 h-3.5" />Bộ lọc
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />}
          </button>

          {hasFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <RotateCcw className="w-3 h-3" />Đặt lại
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-slate-800/60 animate-fade-in">
            {/* Type */}
            <div className="flex items-center bg-surface-950 rounded-xl p-1 gap-0.5 border border-slate-800">
              {(["all", "income", "expense", "transfer"] as const).map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                    typeFilter === t ? "bg-brand-500 text-white" : "text-slate-400 hover:text-slate-200")}>
                  {t === "all" ? "Tất cả" : TYPE_CFG[t].label}
                </button>
              ))}
            </div>

            {/* Category */}
            <div className="relative">
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                className="bg-surface-950 border border-slate-800 rounded-xl pl-3 pr-8 py-1.5 text-xs text-slate-300 outline-none appearance-none cursor-pointer">
                <option value="all">Tất cả danh mục</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Sắp xếp:</span>
              <button onClick={() => setSortBy(sortBy === "date" ? "amount" : "date")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-950 border border-slate-800 text-xs text-slate-300 hover:text-slate-100 transition-colors">
                {sortBy === "date" ? <Calendar className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                {sortBy === "date" ? "Ngày" : "Số tiền"}
              </button>
              <button onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
                className="px-2.5 py-1.5 rounded-lg bg-surface-950 border border-slate-800 text-xs text-slate-300 hover:text-slate-100 transition-colors">
                {sortDir === "desc" ? "↓ Giảm dần" : "↑ Tăng dần"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{filtered.length} kết quả</p>
          <div className="flex items-center gap-1 text-[10px] text-slate-600">
            <Filter className="w-3 h-3" />
            {typeFilter !== "all" ? TYPE_CFG[typeFilter].label : "Tất cả"} · {MONTHS_VI[monthFilter]}
          </div>
        </div>

        {paginated.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-400">Không tìm thấy giao dịch nào</p>
              <p className="text-xs text-slate-600 mt-0.5">Thử thay đổi bộ lọc hoặc thêm giao dịch mới</p>
            </div>
            <button onClick={() => setAddOpen(true)}
              className="mt-1 btn bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 border border-brand-500/20 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" />Thêm giao dịch
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40 p-2">
            {paginated.map((tx) => (
              <TxRow key={tx.id} tx={tx} category={getCat(tx.categoryId)}
                onEdit={() => setEditTx(tx)} onDelete={() => setDeleteTx(tx)} />
            ))}
          </div>
        )}

        {page < totalPages && (
          <div className="px-4 py-3 border-t border-slate-800/60 flex justify-center">
            <button onClick={() => setPage((p) => p + 1)}
              className="btn bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-xs gap-2">
              <ChevronDown className="w-3.5 h-3.5" />
              Tải thêm ({filtered.length - paginated.length} giao dịch còn lại)
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {addOpen  && <TransactionModal mode="add" onClose={() => setAddOpen(false)} />}
      {editTx   && <TransactionModal mode="edit" init={txToForm(editTx)} txId={editTx.id} onClose={() => setEditTx(null)} />}
      {deleteTx && <DeleteConfirmModal tx={deleteTx} onClose={() => setDeleteTx(null)} />}
    </div>
  );
}