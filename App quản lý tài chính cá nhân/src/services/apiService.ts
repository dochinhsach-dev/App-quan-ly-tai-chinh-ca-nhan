// ─────────────────────────────────────────────────────────────────
//  JSON Server API Service
//  Tất cả CRUD với json-server chạy tại http://localhost:3001
// ─────────────────────────────────────────────────────────────────
import type {
  Transaction, Budget, Category,
  Alert, AIInsight, FinancialGoal,
  UserProfile, HealthScore, SpendingHabit,
} from '../types/finance';

const BASE = 'http://localhost:3001';

// ── Generic Helpers ───────────────────────────────────────────────
async function http<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText} – ${url}`);
  return res.json() as Promise<T>;
}

function get<T>(path: string)         { return http<T>(`${BASE}${path}`); }
function post<T>(path: string, body: unknown)  { return http<T>(`${BASE}${path}`, { method: 'POST',   body: JSON.stringify(body) }); }
function put<T>(path: string, body: unknown)   { return http<T>(`${BASE}${path}`, { method: 'PUT',    body: JSON.stringify(body) }); }
function patch<T>(path: string, body: unknown) { return http<T>(`${BASE}${path}`, { method: 'PATCH',  body: JSON.stringify(body) }); }
function del(path: string)            { return http<unknown>(`${BASE}${path}`, { method: 'DELETE' }); }

// ── Record type mở rộng với userId ────────────────────────────────
type WithUserId<T> = T & { userId: string };

// ── Users ─────────────────────────────────────────────────────────
export const usersApi = {
  getByUserId: (userId: string) =>
    get<WithUserId<UserProfile>[]>(`/users?userId=${encodeURIComponent(userId)}`),
  create: (user: WithUserId<UserProfile>) =>
    post<WithUserId<UserProfile>>('/users', user),
  update: (id: string, updates: Partial<UserProfile>) =>
    patch<WithUserId<UserProfile>>(`/users/${id}`, updates),
};

// ── Categories ────────────────────────────────────────────────────
export const categoriesApi = {
  getByUser: (userId: string) =>
    get<WithUserId<Category>[]>(`/categories?userId=${encodeURIComponent(userId)}`),
  create: (cat: WithUserId<Category>) =>
    post<WithUserId<Category>>('/categories', cat),
  update: (id: string, updates: Partial<Category>) =>
    patch<WithUserId<Category>>(`/categories/${id}`, updates),
  remove: (id: string) => del(`/categories/${id}`),
  // Seed default categories for a new user
  seedDefaults: async (userId: string, defaults: Category[]) => {
    const seeded: WithUserId<Category>[] = [];
    for (const cat of defaults) {
      const record = await post<WithUserId<Category>>('/categories', { ...cat, userId });
      seeded.push(record);
    }
    return seeded;
  },
};

// ── Transactions ──────────────────────────────────────────────────
export const transactionsApi = {
  getByUser: (userId: string) =>
    get<WithUserId<Transaction>[]>(`/transactions?userId=${encodeURIComponent(userId)}&_sort=date&_order=desc`),
  create: (tx: WithUserId<Omit<Transaction, 'id'>>) =>
    post<WithUserId<Transaction>>('/transactions', tx),
  update: (id: string, updates: Partial<Transaction>) =>
    patch<WithUserId<Transaction>>(`/transactions/${id}`, updates),
  remove: (id: string) => del(`/transactions/${id}`),
};

// ── Budgets ───────────────────────────────────────────────────────
export const budgetsApi = {
  getByUser: (userId: string) =>
    get<WithUserId<Budget>[]>(`/budgets?userId=${encodeURIComponent(userId)}`),
  create: (budget: WithUserId<Omit<Budget, 'id'>>) =>
    post<WithUserId<Budget>>('/budgets', budget),
  update: (id: string, updates: Partial<Budget>) =>
    patch<WithUserId<Budget>>(`/budgets/${id}`, updates),
  remove: (id: string) => del(`/budgets/${id}`),
};

// ── Goals ─────────────────────────────────────────────────────────
export const goalsApi = {
  getByUser: (userId: string) =>
    get<WithUserId<FinancialGoal>[]>(`/goals?userId=${encodeURIComponent(userId)}`),
  create: (goal: WithUserId<Omit<FinancialGoal, 'id'>>) =>
    post<WithUserId<FinancialGoal>>('/goals', goal),
  update: (id: string, updates: Partial<FinancialGoal>) =>
    patch<WithUserId<FinancialGoal>>(`/goals/${id}`, updates),
  remove: (id: string) => del(`/goals/${id}`),
};

// ── Alerts ────────────────────────────────────────────────────────
export const alertsApi = {
  getByUser: (userId: string) =>
    get<WithUserId<Alert>[]>(`/alerts?userId=${encodeURIComponent(userId)}`),
  create: (alert: WithUserId<Omit<Alert, 'id'>>) =>
    post<WithUserId<Alert>>('/alerts', alert),
  update: (id: string, updates: Partial<Alert>) =>
    patch<WithUserId<Alert>>(`/alerts/${id}`, updates),
  remove: (id: string) => del(`/alerts/${id}`),
};

// ── Insights ──────────────────────────────────────────────────────
export const insightsApi = {
  getByUser: (userId: string) =>
    get<WithUserId<AIInsight>[]>(`/insights?userId=${encodeURIComponent(userId)}`),
  create: (insight: WithUserId<Omit<AIInsight, 'id'>>) =>
    post<WithUserId<AIInsight>>('/insights', insight),
  update: (id: string, updates: Partial<AIInsight>) =>
    patch<WithUserId<AIInsight>>(`/insights/${id}`, updates),
  remove: (id: string) => del(`/insights/${id}`),
};

// ── Health Scores ─────────────────────────────────────────────────
export const healthScoresApi = {
  getByUser: (userId: string) =>
    get<(WithUserId<HealthScore> & { id: string })[]>(`/healthScores?userId=${encodeURIComponent(userId)}`),
  create: (hs: WithUserId<HealthScore>) =>
    post<WithUserId<HealthScore> & { id: string }>('/healthScores', hs),
  update: (id: string, updates: Partial<HealthScore>) =>
    patch<WithUserId<HealthScore>>(`/healthScores/${id}`, updates),
};

// ── Spending Habits ───────────────────────────────────────────────
export const spendingHabitsApi = {
  getByUser: (userId: string) =>
    get<(WithUserId<SpendingHabit> & { id: string })[]>(`/spendingHabits?userId=${encodeURIComponent(userId)}`),
  create: (sh: WithUserId<SpendingHabit>) =>
    post<WithUserId<SpendingHabit> & { id: string }>('/spendingHabits', sh),
};

// ── Check if json-server is running ──────────────────────────────
export async function checkServerOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/users`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}
