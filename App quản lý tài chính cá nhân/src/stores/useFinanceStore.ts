// ─────────────────────────────────────────────────────────────────
//  Zustand Finance Store  –  JSON Server backed, per-Clerk-user
// ─────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { devtools } from 'zustand/middleware';
import { useMemo } from 'react';
import type {
  Transaction, Budget, Category, Alert,
  AIInsight, FinancialGoal, UserProfile,
  DashboardSummary, HealthScore, SpendingHabit, BudgetWithCategory,
} from '../types/finance';
import {
  mockCategories, mockBudgets, mockAlerts,
  mockAIInsights, mockGoals, mockHealthScore, mockSpendingHabits,
} from '../data/mockData';
import {
  transactionsApi, budgetsApi, categoriesApi,
  goalsApi, alertsApi, insightsApi,
  healthScoresApi, spendingHabitsApi, usersApi,
} from '../services/apiService';

// ── Helpers ───────────────────────────────────────────────────────
const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

// ── UI State ──────────────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  isLoading: boolean;
  isSyncing: boolean;         // ← API call in progress
  serverOnline: boolean;      // ← json-server reachable?
  currentUserId: string | null;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setLoading: (v: boolean) => void;
  setSyncing: (v: boolean) => void;
  setServerOnline: (v: boolean) => void;
}

// ── Finance State ─────────────────────────────────────────────────
interface FinanceState {
  user: UserProfile;
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  alerts: Alert[];
  insights: AIInsight[];
  goals: FinancialGoal[];
  healthScore: HealthScore;
  spendingHabits: SpendingHabit[];
  summary: DashboardSummary;

  // Derived Selectors
  getAllBudgetsWithCategories: () => BudgetWithCategory[];
  getUnreadAlertsCount: () => number;

  // Bootstrap – gọi khi user login
  initializeUserData: (clerkUser: {
    id: string;
    firstName?: string | null;
    fullName?: string | null;
    primaryEmailAddress?: { emailAddress: string } | null;
    imageUrl?: string;
  }) => Promise<void>;

  // Transaction Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budget Actions
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Category Actions
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;

  // Alert Actions
  markAlertRead: (id: string) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  markAllAlertsRead: () => Promise<void>;

  // Insight Actions
  applyInsight: (id: string) => Promise<void>;
  dismissInsight: (id: string) => Promise<void>;

  // Goal Actions
  addGoal: (goal: Omit<FinancialGoal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoalProgress: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // User Actions
  updateUser: (updates: Partial<UserProfile>) => void;
}

type FinanceStore = UIState & FinanceState;

// ── Default HealthScore ───────────────────────────────────────────
const DEFAULT_HEALTH: HealthScore = mockHealthScore;

// ── Dummy summary (recomputed live) ──────────────────────────────
const EMPTY_SUMMARY: DashboardSummary = {
  totalBalance: 0, monthlyIncome: 0, monthlyExpenses: 0,
  monthlySavings: 0, savingsRate: 0,
  comparedToLastMonth: { income: 0, expenses: 0, savings: 0 },
};

// ── Default user profile ──────────────────────────────────────────
const DEFAULT_USER: UserProfile = {
  id: 'guest', name: 'Người dùng', email: '',
  currency: 'VND', monthlyIncome: 0,
  timezone: 'Asia/Ho_Chi_Minh',
  notificationsEnabled: true, aiInsightsEnabled: true,
  createdAt: now(),
};

// ── Store ─────────────────────────────────────────────────────────
export const useFinanceStore = create<FinanceStore>()(
  devtools(
    (set, get) => ({
      // ── UI ────────────────────────────────────────────────────
      sidebarOpen: true,
      activeModal: null,
      isLoading: false,
      isSyncing: false,
      serverOnline: true,
      currentUserId: null,

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
      setLoading: (v) => set({ isLoading: v }),
      setSyncing: (v) => set({ isSyncing: v }),
      setServerOnline: (v) => set({ serverOnline: v }),

      // ── Finance Data ──────────────────────────────────────────
      user: DEFAULT_USER,
      transactions: [],
      budgets: [],
      categories: [],
      alerts: [],
      insights: [],
      goals: [],
      healthScore: DEFAULT_HEALTH,
      spendingHabits: [],
      summary: EMPTY_SUMMARY,

      // ── Derived ───────────────────────────────────────────────
      getAllBudgetsWithCategories: () => {
        const { budgets, categories } = get();
        return budgets.map((budget) => {
          const category = categories.find((c) => c.id === budget.categoryId)!;
          const percentage = Math.round((budget.spent / budget.amount) * 100);
          return {
            ...budget, category, percentage,
            remaining: budget.amount - budget.spent,
            isOverBudget: budget.spent > budget.amount,
            isNearLimit: percentage >= budget.alertThreshold,
          };
        });
      },

      getUnreadAlertsCount: () =>
        get().alerts.filter((a) => !a.isRead && !a.isDismissed).length,

      // ── Bootstrap ─────────────────────────────────────────────
      initializeUserData: async (clerkUser) => {
        set({ isLoading: true, currentUserId: clerkUser.id });
        try {
          // 1. Resolve user profile ─────────────────────────────
          const userProfile: UserProfile = {
            id:                   clerkUser.id,
            name:                 clerkUser.fullName || clerkUser.firstName || 'Người dùng',
            email:                clerkUser.primaryEmailAddress?.emailAddress ?? '',
            avatarUrl:            clerkUser.imageUrl,
            currency:             'VND',
            monthlyIncome:        25_000_000,
            timezone:             'Asia/Ho_Chi_Minh',
            notificationsEnabled: true,
            aiInsightsEnabled:    true,
            createdAt:            now(),
          };

          const existingUsers = await usersApi.getByUserId(clerkUser.id);
          if (existingUsers.length === 0) {
            // ─── New user: seed default data ──────────────────
            await usersApi.create({ ...userProfile, userId: clerkUser.id });

            const catMap: Record<string, string> = {};
            for (const cat of mockCategories) {
              const created = await categoriesApi.create({ ...cat, userId: clerkUser.id });
              catMap[cat.id] = created.id;
            }

            for (const tx of get().transactions.length > 0 ? [] : []) {
              // transactions already empty for new user
              void tx;
            }

            const seedCats = await categoriesApi.getByUser(clerkUser.id);

            // Seed budgets with remapped category IDs
            for (const bud of mockBudgets) {
              const mappedCatId = catMap[bud.categoryId] ?? bud.categoryId;
              await budgetsApi.create({ ...bud, categoryId: mappedCatId, userId: clerkUser.id });
            }

            for (const goal of mockGoals) {
              await goalsApi.create({ ...goal, userId: clerkUser.id });
            }

            for (const alert of mockAlerts) {
              await alertsApi.create({ ...alert, userId: clerkUser.id });
            }

            for (const insight of mockAIInsights) {
              await insightsApi.create({ ...insight, userId: clerkUser.id });
            }

            await healthScoresApi.create({ ...mockHealthScore, userId: clerkUser.id });

            for (const habit of mockSpendingHabits) {
              const categoryId = catMap[habit.categoryId] ?? habit.categoryId;
              await spendingHabitsApi.create({ ...habit, categoryId, userId: clerkUser.id });
            }

            // Re-fetch seeded categories for store
            set({ categories: seedCats });
          } else {
            // ─── Returning user: load from server ─────────────
            const [cats, txs, buds, gls, alts, ins, hss, habits] = await Promise.all([
              categoriesApi.getByUser(clerkUser.id),
              transactionsApi.getByUser(clerkUser.id),
              budgetsApi.getByUser(clerkUser.id),
              goalsApi.getByUser(clerkUser.id),
              alertsApi.getByUser(clerkUser.id),
              insightsApi.getByUser(clerkUser.id),
              healthScoresApi.getByUser(clerkUser.id),
              spendingHabitsApi.getByUser(clerkUser.id),
            ]);
            set({
              categories:    cats,
              transactions:  txs,
              budgets:       buds,
              goals:         gls,
              alerts:        alts,
              insights:      ins,
              healthScore:   hss[0] ?? DEFAULT_HEALTH,
              spendingHabits: habits,
            });
          }

          set({ user: userProfile });
        } catch (err) {
          console.error('[FinanceStore] initializeUserData error:', err);
          set({ serverOnline: false });
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Transaction Actions ───────────────────────────────────
      addTransaction: async (tx) => {
        const { currentUserId } = get();
        const optimistic: Transaction = {
          ...tx, id: generateId('tx'),
          createdAt: now(), updatedAt: now(),
        };
        // Optimistic update
        set((s) => ({ transactions: [optimistic, ...s.transactions] }));
        try {
          const created = await transactionsApi.create({
            ...optimistic, userId: currentUserId ?? 'guest',
          });
          // Replace optimistic with server record (real id)
          set((s) => ({
            transactions: s.transactions.map((t) =>
              t.id === optimistic.id ? created : t,
            ),
          }));
        } catch (err) {
          console.error('[addTransaction] API error:', err);
          // Revert optimistic
          set((s) => ({ transactions: s.transactions.filter((t) => t.id !== optimistic.id) }));
        }
      },

      updateTransaction: async (id, updates) => {
        const prev = get().transactions.find((t) => t.id === id);
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: now() } : t,
          ),
        }));
        try {
          await transactionsApi.update(id, { ...updates, updatedAt: now() });
        } catch (err) {
          console.error('[updateTransaction] API error:', err);
          if (prev) set((s) => ({ transactions: s.transactions.map((t) => t.id === id ? prev : t) }));
        }
      },

      deleteTransaction: async (id) => {
        const prev = get().transactions.find((t) => t.id === id);
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
        try {
          await transactionsApi.remove(id);
        } catch (err) {
          console.error('[deleteTransaction] API error:', err);
          if (prev) set((s) => ({ transactions: [prev, ...s.transactions] }));
        }
      },

      // ── Budget Actions ────────────────────────────────────────
      addBudget: async (budget) => {
        const { currentUserId } = get();
        const optimistic: Budget = { ...budget, id: generateId('bud') };
        set((s) => ({ budgets: [...s.budgets, optimistic] }));
        try {
          const created = await budgetsApi.create({ ...optimistic, userId: currentUserId ?? 'guest' });
          set((s) => ({ budgets: s.budgets.map((b) => b.id === optimistic.id ? created : b) }));
        } catch (err) {
          console.error('[addBudget] API error:', err);
          set((s) => ({ budgets: s.budgets.filter((b) => b.id !== optimistic.id) }));
        }
      },

      updateBudget: async (id, updates) => {
        const prev = get().budgets.find((b) => b.id === id);
        set((s) => ({ budgets: s.budgets.map((b) => b.id === id ? { ...b, ...updates } : b) }));
        try {
          await budgetsApi.update(id, updates);
        } catch (err) {
          console.error('[updateBudget] API error:', err);
          if (prev) set((s) => ({ budgets: s.budgets.map((b) => b.id === id ? prev : b) }));
        }
      },

      deleteBudget: async (id) => {
        const prev = get().budgets.find((b) => b.id === id);
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
        try {
          await budgetsApi.remove(id);
        } catch (err) {
          console.error('[deleteBudget] API error:', err);
          if (prev) set((s) => ({ budgets: [...s.budgets, prev] }));
        }
      },

      // ── Category Actions ──────────────────────────────────────
      addCategory: async (category) => {
        const { currentUserId } = get();
        const optimistic: Category = { ...category, id: generateId('cat') };
        set((s) => ({ categories: [...s.categories, optimistic] }));
        try {
          const created = await categoriesApi.create({ ...optimistic, userId: currentUserId ?? 'guest' });
          set((s) => ({ categories: s.categories.map((c) => c.id === optimistic.id ? created : c) }));
        } catch (err) {
          console.error('[addCategory] API error:', err);
          set((s) => ({ categories: s.categories.filter((c) => c.id !== optimistic.id) }));
        }
      },

      updateCategory: async (id, updates) => {
        const prev = get().categories.find((c) => c.id === id);
        set((s) => ({ categories: s.categories.map((c) => c.id === id ? { ...c, ...updates } : c) }));
        try {
          await categoriesApi.update(id, updates);
        } catch (err) {
          console.error('[updateCategory] API error:', err);
          if (prev) set((s) => ({ categories: s.categories.map((c) => c.id === id ? prev : c) }));
        }
      },

      // ── Alert Actions ─────────────────────────────────────────
      markAlertRead: async (id) => {
        set((s) => ({ alerts: s.alerts.map((a) => a.id === id ? { ...a, isRead: true } : a) }));
        try { await alertsApi.update(id, { isRead: true }); }
        catch (err) { console.error('[markAlertRead]', err); }
      },

      dismissAlert: async (id) => {
        set((s) => ({ alerts: s.alerts.map((a) => a.id === id ? { ...a, isDismissed: true } : a) }));
        try { await alertsApi.update(id, { isDismissed: true }); }
        catch (err) { console.error('[dismissAlert]', err); }
      },

      markAllAlertsRead: async () => {
        set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, isRead: true })) }));
        try {
          await Promise.all(get().alerts.map((a) => alertsApi.update(a.id, { isRead: true })));
        } catch (err) { console.error('[markAllAlertsRead]', err); }
      },

      // ── Insight Actions ───────────────────────────────────────
      applyInsight: async (id) => {
        set((s) => ({ insights: s.insights.map((i) => i.id === id ? { ...i, isApplied: true } : i) }));
        try { await insightsApi.update(id, { isApplied: true }); }
        catch (err) { console.error('[applyInsight]', err); }
      },

      dismissInsight: async (id) => {
        set((s) => ({ insights: s.insights.filter((i) => i.id !== id) }));
        try { await insightsApi.remove(id); }
        catch (err) { console.error('[dismissInsight]', err); }
      },

      // ── Goal Actions ──────────────────────────────────────────
      addGoal: async (goal) => {
        const { currentUserId } = get();
        const optimistic: FinancialGoal = { ...goal, id: generateId('goal'), createdAt: now() };
        set((s) => ({ goals: [...s.goals, optimistic] }));
        try {
          const created = await goalsApi.create({ ...optimistic, userId: currentUserId ?? 'guest' });
          set((s) => ({ goals: s.goals.map((g) => g.id === optimistic.id ? created : g) }));
        } catch (err) {
          console.error('[addGoal] API error:', err);
          set((s) => ({ goals: s.goals.filter((g) => g.id !== optimistic.id) }));
        }
      },

      updateGoalProgress: async (id, amount) => {
        const prev = get().goals.find((g) => g.id === id);
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== id) return g;
            const newAmt = Math.min(g.currentAmount + amount, g.targetAmount);
            return {
              ...g,
              currentAmount: newAmt,
              status: newAmt >= g.targetAmount ? 'achieved' : g.status,
            };
          }),
        }));
        const updated = get().goals.find((g) => g.id === id);
        try {
          if (updated) await goalsApi.update(id, { currentAmount: updated.currentAmount, status: updated.status });
        } catch (err) {
          console.error('[updateGoalProgress]', err);
          if (prev) set((s) => ({ goals: s.goals.map((g) => g.id === id ? prev : g) }));
        }
      },

      deleteGoal: async (id) => {
        const prev = get().goals.find((g) => g.id === id);
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
        try { await goalsApi.remove(id); }
        catch (err) {
          console.error('[deleteGoal]', err);
          if (prev) set((s) => ({ goals: [...s.goals, prev] }));
        }
      },

      // ── User Actions ──────────────────────────────────────────
      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
    }),
    { name: 'FinanceStore' },
  ),
);

// ── Convenience hooks ─────────────────────────────────────────────
export const useUser           = () => useFinanceStore((s) => s.user);
export const useTransactions   = () => useFinanceStore((s) => s.transactions);
export const useCategories     = () => useFinanceStore((s) => s.categories);
export const useAlerts         = () => useFinanceStore((s) => s.alerts);
export const useInsights       = () => useFinanceStore((s) => s.insights);
export const useGoals          = () => useFinanceStore((s) => s.goals);
export const useHealthScore    = () => useFinanceStore((s) => s.healthScore);
export const useSpendingHabits = () => useFinanceStore((s) => s.spendingHabits);
export const useServerOnline   = () => useFinanceStore((s) => s.serverOnline);
export const useIsLoading      = () => useFinanceStore((s) => s.isLoading);

export const useUnreadAlertsCount = () =>
  useFinanceStore((s) => s.alerts.filter((a) => !a.isRead && !a.isDismissed).length);

export const useUnreadAlerts = () =>
  useFinanceStore(useShallow((s) => s.alerts.filter((a) => !a.isRead && !a.isDismissed)));

export const useActiveInsights = () =>
  useFinanceStore(useShallow((s) => s.insights.filter((i) => !i.isApplied)));

export const useBudgets = () => {
  const budgets    = useFinanceStore((s) => s.budgets);
  const categories = useFinanceStore((s) => s.categories);
  return budgets.map((budget) => {
    const category   = categories.find((c) => c.id === budget.categoryId)!;
    const percentage = Math.round((budget.spent / budget.amount) * 100);
    return {
      ...budget, category, percentage,
      remaining:    budget.amount - budget.spent,
      isOverBudget: budget.spent > budget.amount,
      isNearLimit:  percentage >= budget.alertThreshold,
    };
  });
};

// ── Live summary computed from real transactions ──────────────────
function _computeSummary(transactions: Transaction[]): DashboardSummary {
  const nd = new Date();
  const cm = nd.getMonth(), cy = nd.getFullYear();
  const lm = cm === 0 ? 11 : cm - 1;
  const ly = cm === 0 ? cy - 1 : cy;

  const pick = (m: number, y: number) =>
    transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === m && d.getFullYear() === y;
    });

  const inc = (list: Transaction[]) => list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp = (list: Transaction[]) => list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const pct = (curr: number, prev: number) => prev !== 0 ? Math.round(((curr - prev) / Math.abs(prev)) * 100) : 0;

  const thisMo = pick(cm, cy);
  const lastMo = pick(lm, ly);

  const monthlyIncome   = inc(thisMo);
  const monthlyExpenses = exp(thisMo);
  const monthlySavings  = monthlyIncome - monthlyExpenses;

  const totalBalance = transactions.reduce(
    (s, t) => t.type === 'income' ? s + t.amount : t.type === 'expense' ? s - t.amount : s, 0,
  );

  return {
    totalBalance, monthlyIncome, monthlyExpenses, monthlySavings,
    savingsRate: monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0,
    comparedToLastMonth: {
      income:   pct(monthlyIncome,   inc(lastMo)),
      expenses: pct(monthlyExpenses, exp(lastMo)),
      savings:  pct(monthlySavings,  inc(lastMo) - exp(lastMo)),
    },
  };
}

export const useLiveSummary = () => {
  const transactions = useFinanceStore((s) => s.transactions);
  return useMemo(() => _computeSummary(transactions), [transactions]);
};

// Legacy export for backward compatibility
export const useSummary = () => useFinanceStore((s) => s.summary);
