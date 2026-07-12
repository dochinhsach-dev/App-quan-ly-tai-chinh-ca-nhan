// ─────────────────────────────────────────────────────────────────
//  Zustand Finance Store
// ─────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { devtools, persist } from 'zustand/middleware';
import type {
  Transaction,
  Budget,
  Category,
  Alert,
  AIInsight,
  FinancialGoal,
  UserProfile,
  DashboardSummary,
  HealthScore,
  SpendingHabit,
  BudgetWithCategory,
} from '../types/finance';
import {
  mockTransactions,
  mockBudgets,
  mockCategories,
  mockAlerts,
  mockAIInsights,
  mockGoals,
  mockUser,
  mockDashboardSummary,
  mockHealthScore,
  mockSpendingHabits,
} from '../data/mockData';

// ── UI State ──────────────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  isLoading: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setLoading: (loading: boolean) => void;
}

// ── Finance State ─────────────────────────────────────────────────
interface FinanceState {
  // Data
  user: UserProfile;
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  alerts: Alert[];
  insights: AIInsight[];
  goals: FinancialGoal[];
  summary: DashboardSummary;
  healthScore: HealthScore;
  spendingHabits: SpendingHabit[];

  // Derived Selectors (computed on the fly)
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getBudgetWithCategory: (budgetId: string) => BudgetWithCategory | undefined;
  getAllBudgetsWithCategories: () => BudgetWithCategory[];
  getUnreadAlerts: () => Alert[];
  getUnreadAlertsCount: () => number;
  getActiveInsights: () => AIInsight[];

  // Transaction Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Budget Actions
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Category Actions
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;

  // Alert Actions
  markAlertRead: (id: string) => void;
  dismissAlert: (id: string) => void;
  markAllAlertsRead: () => void;

  // Insight Actions
  applyInsight: (id: string) => void;
  dismissInsight: (id: string) => void;

  // Goal Actions
  addGoal: (goal: Omit<FinancialGoal, 'id' | 'createdAt'>) => void;
  updateGoalProgress: (id: string, amount: number) => void;
  deleteGoal: (id: string) => void;

  // User Actions
  updateUser: (updates: Partial<UserProfile>) => void;
}

type FinanceStore = UIState & FinanceState;

// ── Helpers ───────────────────────────────────────────────────────
const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const now = () => new Date().toISOString();

// ── Store ─────────────────────────────────────────────────────────
export const useFinanceStore = create<FinanceStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ── UI State ──────────────────────────────────────────────
        sidebarOpen: true,
        activeModal: null,
        isLoading: false,

        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        openModal: (modalId) => set({ activeModal: modalId }),
        closeModal: () => set({ activeModal: null }),
        setLoading: (loading) => set({ isLoading: loading }),

        // ── Finance Data ──────────────────────────────────────────
        user: mockUser,
        transactions: mockTransactions,
        budgets: mockBudgets,
        categories: mockCategories,
        alerts: mockAlerts,
        insights: mockAIInsights,
        goals: mockGoals,
        summary: mockDashboardSummary,
        healthScore: mockHealthScore,
        spendingHabits: mockSpendingHabits,

        // ── Derived Selectors ─────────────────────────────────────
        getTransactionsByCategory: (categoryId) =>
          get().transactions.filter((tx) => tx.categoryId === categoryId),

        getBudgetWithCategory: (budgetId) => {
          const { budgets, categories } = get();
          const budget = budgets.find((b) => b.id === budgetId);
          if (!budget) return undefined;
          const category = categories.find((c) => c.id === budget.categoryId);
          if (!category) return undefined;
          const percentage = Math.round((budget.spent / budget.amount) * 100);
          return {
            ...budget,
            category,
            percentage,
            remaining: budget.amount - budget.spent,
            isOverBudget: budget.spent > budget.amount,
            isNearLimit: percentage >= budget.alertThreshold,
          };
        },

        getAllBudgetsWithCategories: () => {
          const { budgets, categories } = get();
          return budgets.map((budget) => {
            const category = categories.find((c) => c.id === budget.categoryId)!;
            const percentage = Math.round((budget.spent / budget.amount) * 100);
            return {
              ...budget,
              category,
              percentage,
              remaining: budget.amount - budget.spent,
              isOverBudget: budget.spent > budget.amount,
              isNearLimit: percentage >= budget.alertThreshold,
            };
          });
        },

        getUnreadAlerts: () =>
          get().alerts.filter((a) => !a.isRead && !a.isDismissed),

        getUnreadAlertsCount: () =>
          get().alerts.filter((a) => !a.isRead && !a.isDismissed).length,

        getActiveInsights: () =>
          get().insights.filter((i) => !i.isApplied),

        // ── Transaction Actions ───────────────────────────────────
        addTransaction: (tx) =>
          set((s) => ({
            transactions: [
              {
                ...tx,
                id: generateId('tx'),
                createdAt: now(),
                updatedAt: now(),
              },
              ...s.transactions,
            ],
          })),

        updateTransaction: (id, updates) =>
          set((s) => ({
            transactions: s.transactions.map((tx) =>
              tx.id === id ? { ...tx, ...updates, updatedAt: now() } : tx,
            ),
          })),

        deleteTransaction: (id) =>
          set((s) => ({
            transactions: s.transactions.filter((tx) => tx.id !== id),
          })),

        // ── Budget Actions ────────────────────────────────────────
        addBudget: (budget) =>
          set((s) => ({
            budgets: [...s.budgets, { ...budget, id: generateId('bud') }],
          })),

        updateBudget: (id, updates) =>
          set((s) => ({
            budgets: s.budgets.map((b) =>
              b.id === id ? { ...b, ...updates } : b,
            ),
          })),

        deleteBudget: (id) =>
          set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

        // ── Category Actions ──────────────────────────────────────
        addCategory: (category) =>
          set((s) => ({
            categories: [...s.categories, { ...category, id: generateId('cat') }],
          })),

        updateCategory: (id, updates) =>
          set((s) => ({
            categories: s.categories.map((c) =>
              c.id === id ? { ...c, ...updates } : c,
            ),
          })),

        // ── Alert Actions ─────────────────────────────────────────
        markAlertRead: (id) =>
          set((s) => ({
            alerts: s.alerts.map((a) =>
              a.id === id ? { ...a, isRead: true } : a,
            ),
          })),

        dismissAlert: (id) =>
          set((s) => ({
            alerts: s.alerts.map((a) =>
              a.id === id ? { ...a, isDismissed: true } : a,
            ),
          })),

        markAllAlertsRead: () =>
          set((s) => ({
            alerts: s.alerts.map((a) => ({ ...a, isRead: true })),
          })),

        // ── Insight Actions ───────────────────────────────────────
        applyInsight: (id) =>
          set((s) => ({
            insights: s.insights.map((i) =>
              i.id === id ? { ...i, isApplied: true } : i,
            ),
          })),

        dismissInsight: (id) =>
          set((s) => ({
            insights: s.insights.filter((i) => i.id !== id),
          })),

        // ── Goal Actions ──────────────────────────────────────────
        addGoal: (goal) =>
          set((s) => ({
            goals: [
              ...s.goals,
              { ...goal, id: generateId('goal'), createdAt: now() },
            ],
          })),

        updateGoalProgress: (id, amount) =>
          set((s) => ({
            goals: s.goals.map((g) =>
              g.id === id
                ? {
                    ...g,
                    currentAmount: Math.min(g.currentAmount + amount, g.targetAmount),
                    status:
                      g.currentAmount + amount >= g.targetAmount ? 'achieved' : g.status,
                  }
                : g,
            ),
          })),

        deleteGoal: (id) =>
          set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

        // ── User Actions ──────────────────────────────────────────
        updateUser: (updates) =>
          set((s) => ({ user: { ...s.user, ...updates } })),
      }),
      {
        name: 'finance-store',
        // Only persist user preferences and goals, not transient UI state
        partialize: (state) => ({
          user: state.user,
          goals: state.goals,
          categories: state.categories,
        }),
      },
    ),
    { name: 'FinanceStore' },
  ),
);
// ── Convenience hooks ─────────────────────────────────
// Primitive / stable-reference selectors – safe without useShallow
export const useUser           = () => useFinanceStore((s) => s.user);
export const useTransactions   = () => useFinanceStore((s) => s.transactions);
export const useAlerts         = () => useFinanceStore((s) => s.alerts);
export const useInsights       = () => useFinanceStore((s) => s.insights);
export const useGoals          = () => useFinanceStore((s) => s.goals);
export const useSummary        = () => useFinanceStore((s) => s.summary);
export const useHealthScore    = () => useFinanceStore((s) => s.healthScore);
export const useSpendingHabits = () => useFinanceStore((s) => s.spendingHabits);
export const useCategories     = () => useFinanceStore((s) => s.categories);

// Count – returns a number (primitive), always safe
export const useUnreadAlertsCount = () =>
  useFinanceStore((s) => s.alerts.filter((a) => !a.isRead && !a.isDismissed).length);

// Derived array hooks – use useShallow so Zustand compares element-by-element
// instead of by reference, preventing infinite re-render loops.
export const useUnreadAlerts = () =>
  useFinanceStore(useShallow((s) => s.alerts.filter((a) => !a.isRead && !a.isDismissed)));

export const useActiveInsights = () =>
  useFinanceStore(useShallow((s) => s.insights.filter((i) => !i.isApplied)));

// useBudgets: select raw slices first, then derive – each individual
// selector returns a stable reference (same array object when unchanged).
export const useBudgets = () => {
  const budgets    = useFinanceStore((s) => s.budgets);
  const categories = useFinanceStore((s) => s.categories);
  return budgets.map((budget) => {
    const category   = categories.find((c) => c.id === budget.categoryId)!;
    const percentage = Math.round((budget.spent / budget.amount) * 100);
    return {
      ...budget,
      category,
      percentage,
      remaining:    budget.amount - budget.spent,
      isOverBudget: budget.spent > budget.amount,
      isNearLimit:  percentage >= budget.alertThreshold,
    };
  });
};
