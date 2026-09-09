// ─────────────────────────────────────────────────────────────────
//  Finance Types  – Central type definitions for the entire app
// ─────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type AlertSeverity = 'info' | 'warning' | 'danger' | 'success';
export type InsightType = 'saving' | 'spending' | 'goal' | 'habit' | 'budget';

// Legacy – kept for backward compat with existing store code
export type GoalStatus = 'on-track' | 'at-risk' | 'achieved' | 'paused';

// ── Category ──────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  icon: string;           // Lucide icon name
  color: string;          // Tailwind color key or hex
  parentId?: string;      // For sub-categories
  budget?: number;        // Monthly budget cap
}

// ── Transaction ───────────────────────────────────────────────────
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;       // e.g. 'VND' | 'USD'
  categoryId: string;
  description: string;
  note?: string;
  date: string;           // ISO 8601
  tags?: string[];
  isRecurring: boolean;
  recurringInterval?: RecurringInterval;
  attachmentUrl?: string;
  merchantName?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Budget ────────────────────────────────────────────────────────
export interface Budget {
  id: string;
  name?: string;          // Display name (optional, falls back to category name)
  categoryId: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'quarterly' | 'yearly' | 'custom';
  startDate: string;
  endDate: string;
  alertThreshold: number; // 0–100 (%)
  currency: string;
  isRecurring?: boolean;  // Auto-create for next period
  note?: string;          // Optional notes
}

export interface BudgetWithCategory extends Budget {
  category: Category;
  percentage: number;     // spent / amount * 100
  remaining: number;
  isOverBudget: boolean;
  isNearLimit: boolean;   // percentage >= alertThreshold
}

// ── Alert ─────────────────────────────────────────────────────────
export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  categoryId?: string;
  budgetId?: string;
  transactionId?: string;
  isRead: boolean;
  isDismissed: boolean;
  actionLabel?: string;
  actionRoute?: string;
  createdAt: string;
  expiresAt?: string;
}

// ── AI Insight ────────────────────────────────────────────────────
export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  summary: string;        // 1-2 sentence summary
  detail: string;         // Full markdown-compatible body
  potentialSaving?: number;
  confidenceScore: number; // 0–1
  tags: string[];
  relatedCategoryIds: string[];
  actionItems: string[];
  generatedAt: string;
  isApplied: boolean;
}

// ── Habit Analysis ────────────────────────────────────────────────
export interface SpendingHabit {
  categoryId: string;
  averageMonthly: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;  // % change vs last period
  peakDayOfWeek: number;    // 0=Sun … 6=Sat
  peakHourOfDay: number;
  topMerchants: string[];
}

// ── Financial Health Score ────────────────────────────────────────
export interface HealthScore {
  overall: number;          // 0–100
  savingsRate: number;      // % of income saved
  debtRatio: number;        // debt / income
  budgetAdherence: number;  // % of budgets on track
  emergencyFundMonths: number;
  lastUpdated: string;
  breakdown: {
    label: string;
    score: number;
    maxScore: number;
    description: string;
  }[];
}

// ── Goal Category ─────────────────────────────────────────────────
export type GoalCategory =
  | 'housing'
  | 'vehicle'
  | 'tech'
  | 'travel'
  | 'education'
  | 'personal'
  | 'emergency'
  | 'investment'
  | 'other';

// ── Goal Contribution (nạp/rút tiền vào mục tiêu) ────────────────
export interface GoalContribution {
  id: string;
  amount: number;    // dương = nạp tiền, âm = rút tiền
  note?: string;
  date: string;      // ISO 8601
  createdAt: string;
}

// ── Goal Lifecycle Status ─────────────────────────────────────────
export type GoalLifecycleStatus =
  | 'active'      // Đang thực hiện
  | 'paused'      // Tạm dừng
  | 'completed'   // Hoàn thành
  | 'cancelled'   // Đã hủy
  | 'overdue';    // Quá hạn

// ── Goal / Milestone ──────────────────────────────────────────────
export interface FinancialGoal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;   // = initialAmount + sum(contributions)
  initialAmount: number;   // số tiền có ban đầu khi tạo
  currency: string;
  startDate: string;       // ISO 8601 date
  deadline: string;        // ISO 8601 date
  status: GoalLifecycleStatus;
  goalCategory: GoalCategory;
  priority: 'low' | 'medium' | 'high';
  imageUrl?: string;       // ảnh đại diện (URL)
  iconEmoji: string;
  color: string;
  contributions: GoalContribution[];
  reminderEnabled: boolean;
  reminderFrequency?: 'weekly' | 'monthly';
  milestones: GoalMilestone[];
  createdAt: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetAmount: number;
  achievedAt?: string;
  isAchieved: boolean;
}

// ── User Profile ──────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currency: string;
  monthlyIncome: number;
  timezone: string;
  notificationsEnabled: boolean;
  aiInsightsEnabled: boolean;
  createdAt: string;
}

// ── Dashboard Summary ─────────────────────────────────────────────
export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  comparedToLastMonth: {
    income: number;
    expenses: number;
    savings: number;
  };
}

// ── Chart Data ────────────────────────────────────────────────────
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface MonthlyChartData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

// ── Reminder / Bill Calendar ──────────────────────────────────────
export type ReminderType =
  | 'auto_recurring'  // Giao dịch định kỳ hệ thống phát hiện
  | 'auto_bill'       // Hóa đơn sắp đến hạn
  | 'auto_budget'     // Nhắc nhở/Cảnh báo ngân sách (70%, 85%, 100%)
  | 'auto_anomaly'    // Phát hiện chi tiêu bất thường
  | 'auto_goal'       // Nhắc nhở mục tiêu tài chính
  | 'personal';       // Lời nhắc cá nhân người dùng tự tạo

export type ReminderCategory = 'critical' | 'detected' | 'upcoming' | 'personal';

export type ReminderStatus = 'pending' | 'confirmed' | 'dismissed' | 'paid';

export interface Reminder {
  id: string;
  title: string;
  type: ReminderType;
  categorySection: ReminderCategory;
  amount: number;
  dueDate: string;           // ISO date (YYYY-MM-DD) or ISO string
  categoryId?: string;
  status: ReminderStatus;
  frequency?: 'once' | 'monthly' | 'weekly' | 'yearly';
  note?: string;
  isAutoGenerated: boolean;
  alertLevel?: 'info' | 'warning' | 'danger';
  detectedPattern?: {
    description?: string;
    detectedAmount?: number;
    estimatedDay?: number;
    confidence?: number;
    merchantName?: string;
    lastOccurrences?: string[];
  };
  budgetId?: string;
  goalId?: string;
  createdAt: string;
  updatedAt: string;
}

