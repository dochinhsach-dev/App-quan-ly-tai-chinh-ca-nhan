// ─────────────────────────────────────────────────────────────────
//  Mock Data – Realistic Vietnamese user finance profile
// ─────────────────────────────────────────────────────────────────
import type {
  Category,
  Transaction,
  Budget,
  Alert,
  AIInsight,
  SpendingHabit,
  HealthScore,
  FinancialGoal,
  UserProfile,
  DashboardSummary,
  MonthlyChartData,
} from '../types/finance';

// ── User ──────────────────────────────────────────────────────────
export const mockUser: UserProfile = {
  id: 'user-001',
  name: 'Nguyễn Minh Anh',
  email: 'minhanh@example.com',
  currency: 'VND',
  monthlyIncome: 25_000_000,
  timezone: 'Asia/Ho_Chi_Minh',
  notificationsEnabled: true,
  aiInsightsEnabled: true,
  createdAt: '2024-01-15T00:00:00Z',
};

// ── Categories ────────────────────────────────────────────────────
export const mockCategories: Category[] = [
  { id: 'cat-01', name: 'Ăn uống',      icon: 'UtensilsCrossed', color: '#f87171', budget: 4_000_000 },
  { id: 'cat-02', name: 'Di chuyển',    icon: 'Car',             color: '#fb923c', budget: 1_500_000 },
  { id: 'cat-03', name: 'Giải trí',     icon: 'Gamepad2',        color: '#a78bfa', budget: 2_000_000 },
  { id: 'cat-04', name: 'Mua sắm',      icon: 'ShoppingBag',     color: '#f472b6', budget: 3_000_000 },
  { id: 'cat-05', name: 'Hóa đơn',      icon: 'Receipt',         color: '#34d399', budget: 2_500_000 },
  { id: 'cat-06', name: 'Sức khỏe',     icon: 'HeartPulse',      color: '#22d3ee', budget: 1_000_000 },
  { id: 'cat-07', name: 'Giáo dục',     icon: 'BookOpen',        color: '#818cf8', budget: 1_500_000 },
  { id: 'cat-08', name: 'Đầu tư',       icon: 'TrendingUp',      color: '#4ade80', budget: 5_000_000 },
  { id: 'cat-09', name: 'Lương',         icon: 'Banknote',        color: '#4ade80' },
  { id: 'cat-10', name: 'Freelance',    icon: 'Laptop',          color: '#818cf8' },
];

// ── Transactions ──────────────────────────────────────────────────
export const mockTransactions: Transaction[] = [
  {
    id: 'tx-001', type: 'income', amount: 25_000_000, currency: 'VND',
    categoryId: 'cat-09', description: 'Lương tháng 7/2025',
    date: '2025-07-01T08:00:00Z', isRecurring: true, recurringInterval: 'monthly',
    merchantName: 'Công ty ABC', createdAt: '2025-07-01T08:00:00Z', updatedAt: '2025-07-01T08:00:00Z',
  },
  {
    id: 'tx-002', type: 'expense', amount: 850_000, currency: 'VND',
    categoryId: 'cat-01', description: 'Nhà hàng Okura',
    note: 'Sinh nhật bạn bè', date: '2025-07-10T19:30:00Z',
    isRecurring: false, merchantName: 'Okura Restaurant', tags: ['social'],
    createdAt: '2025-07-10T19:30:00Z', updatedAt: '2025-07-10T19:30:00Z',
  },
  {
    id: 'tx-003', type: 'expense', amount: 320_000, currency: 'VND',
    categoryId: 'cat-02', description: 'Grab xe tháng',
    date: '2025-07-09T07:15:00Z', isRecurring: false, merchantName: 'Grab',
    createdAt: '2025-07-09T07:15:00Z', updatedAt: '2025-07-09T07:15:00Z',
  },
  {
    id: 'tx-004', type: 'expense', amount: 1_200_000, currency: 'VND',
    categoryId: 'cat-04', description: 'Shopee – Quần áo',
    date: '2025-07-08T14:00:00Z', isRecurring: false, merchantName: 'Shopee',
    createdAt: '2025-07-08T14:00:00Z', updatedAt: '2025-07-08T14:00:00Z',
  },
  {
    id: 'tx-005', type: 'expense', amount: 500_000, currency: 'VND',
    categoryId: 'cat-05', description: 'Hóa đơn điện',
    date: '2025-07-07T09:00:00Z', isRecurring: true, recurringInterval: 'monthly',
    merchantName: 'EVN', createdAt: '2025-07-07T09:00:00Z', updatedAt: '2025-07-07T09:00:00Z',
  },
  {
    id: 'tx-006', type: 'income', amount: 3_500_000, currency: 'VND',
    categoryId: 'cat-10', description: 'Dự án freelance – Landing page',
    date: '2025-07-06T16:00:00Z', isRecurring: false,
    createdAt: '2025-07-06T16:00:00Z', updatedAt: '2025-07-06T16:00:00Z',
  },
  {
    id: 'tx-007', type: 'expense', amount: 750_000, currency: 'VND',
    categoryId: 'cat-03', description: 'Netflix + Spotify',
    date: '2025-07-05T00:00:00Z', isRecurring: true, recurringInterval: 'monthly',
    merchantName: 'Netflix', createdAt: '2025-07-05T00:00:00Z', updatedAt: '2025-07-05T00:00:00Z',
  },
  {
    id: 'tx-008', type: 'expense', amount: 2_000_000, currency: 'VND',
    categoryId: 'cat-08', description: 'Mua ETF DCVFM',
    date: '2025-07-04T10:00:00Z', isRecurring: true, recurringInterval: 'monthly',
    merchantName: 'Dragon Capital', createdAt: '2025-07-04T10:00:00Z', updatedAt: '2025-07-04T10:00:00Z',
  },
  {
    id: 'tx-009', type: 'expense', amount: 250_000, currency: 'VND',
    categoryId: 'cat-06', description: 'Khám sức khỏe định kỳ',
    date: '2025-07-03T08:30:00Z', isRecurring: false, merchantName: 'Phòng khám Medic',
    createdAt: '2025-07-03T08:30:00Z', updatedAt: '2025-07-03T08:30:00Z',
  },
  {
    id: 'tx-010', type: 'expense', amount: 500_000, currency: 'VND',
    categoryId: 'cat-07', description: 'Khóa học React nâng cao',
    date: '2025-07-02T20:00:00Z', isRecurring: false, merchantName: 'Udemy',
    createdAt: '2025-07-02T20:00:00Z', updatedAt: '2025-07-02T20:00:00Z',
  },
];

// ── Budgets ───────────────────────────────────────────────────────
export const mockBudgets: Budget[] = [
  { id: 'bud-01', categoryId: 'cat-01', amount: 4_000_000, spent: 3_200_000, period: 'monthly', startDate: '2025-07-01', endDate: '2025-07-31', alertThreshold: 80, currency: 'VND' },
  { id: 'bud-02', categoryId: 'cat-02', amount: 1_500_000, spent:   650_000, period: 'monthly', startDate: '2025-07-01', endDate: '2025-07-31', alertThreshold: 80, currency: 'VND' },
  { id: 'bud-03', categoryId: 'cat-03', amount: 2_000_000, spent: 1_100_000, period: 'monthly', startDate: '2025-07-01', endDate: '2025-07-31', alertThreshold: 80, currency: 'VND' },
  { id: 'bud-04', categoryId: 'cat-04', amount: 3_000_000, spent: 3_400_000, period: 'monthly', startDate: '2025-07-01', endDate: '2025-07-31', alertThreshold: 80, currency: 'VND' },
  { id: 'bud-05', categoryId: 'cat-05', amount: 2_500_000, spent:   800_000, period: 'monthly', startDate: '2025-07-01', endDate: '2025-07-31', alertThreshold: 80, currency: 'VND' },
  { id: 'bud-06', categoryId: 'cat-08', amount: 5_000_000, spent: 2_000_000, period: 'monthly', startDate: '2025-07-01', endDate: '2025-07-31', alertThreshold: 70, currency: 'VND' },
];

// ── Alerts ────────────────────────────────────────────────────────
export const mockAlerts: Alert[] = [
  {
    id: 'alt-01', severity: 'danger',
    title: 'Vượt ngân sách Mua sắm!',
    message: 'Bạn đã chi 113% ngân sách mua sắm tháng này (3.4/3.0 triệu). Hãy điều chỉnh.',
    categoryId: 'cat-04', budgetId: 'bud-04',
    isRead: false, isDismissed: false,
    actionLabel: 'Xem chi tiết', actionRoute: '/budgets',
    createdAt: '2025-07-08T14:00:00Z',
  },
  {
    id: 'alt-02', severity: 'warning',
    title: 'Gần đạt giới hạn Ăn uống',
    message: 'Đã dùng 80% ngân sách ăn uống (3.2/4.0 triệu). Còn 800,000đ cho 21 ngày.',
    categoryId: 'cat-01', budgetId: 'bud-01',
    isRead: false, isDismissed: false,
    actionLabel: 'Xem ngân sách', actionRoute: '/budgets',
    createdAt: '2025-07-10T10:00:00Z',
  },
  {
    id: 'alt-03', severity: 'info',
    title: 'Hóa đơn Internet sắp đến hạn',
    message: 'Hóa đơn FPT Telecom 350,000đ sẽ tự động thu vào ngày 15/07.',
    isRead: true, isDismissed: false,
    actionLabel: 'Xem nhắc nhở', actionRoute: '/reminders',
    createdAt: '2025-07-10T08:00:00Z',
  },
  {
    id: 'alt-04', severity: 'success',
    title: 'Đạt mục tiêu tiết kiệm tháng 6!',
    message: 'Tuyệt vời! Bạn đã tiết kiệm 5.2 triệu trong tháng 6, vượt mục tiêu 4%.',
    isRead: true, isDismissed: false,
    createdAt: '2025-07-01T08:00:00Z',
  },
];

// ── AI Insights ───────────────────────────────────────────────────
export const mockAIInsights: AIInsight[] = [
  {
    id: 'ins-01', type: 'saving',
    title: 'Giảm chi phí ăn ngoài tiết kiệm 1.2 triệu/tháng',
    summary: 'Bạn ăn ngoài trung bình 4.3 lần/tuần, cao hơn 60% so với người dùng tương tự.',
    detail: 'Phân tích 3 tháng gần nhất cho thấy bạn chi khoảng 280,000đ/bữa ăn ngoài. Nếu nấu ăn ở nhà 2 buổi/tuần, bạn có thể tiết kiệm ~1.2 triệu đồng mỗi tháng mà không ảnh hưởng đến chất lượng sống.',
    potentialSaving: 1_200_000, confidenceScore: 0.87,
    tags: ['ăn uống', 'tiết kiệm', 'thói quen'],
    relatedCategoryIds: ['cat-01'],
    actionItems: ['Lên kế hoạch nấu ăn cuối tuần', 'Đặt mục tiêu ≤ 3 bữa ngoài/tuần'],
    generatedAt: '2025-07-10T06:00:00Z', isApplied: false,
  },
  {
    id: 'ins-02', type: 'budget',
    title: 'Tái cơ cấu ngân sách theo quy tắc 50/30/20',
    summary: 'Cấu trúc chi tiêu hiện tại của bạn chưa tối ưu. Áp dụng 50/30/20 giúp tiết kiệm thêm 2.5 triệu.',
    detail: 'Hiện tại: Nhu cầu thiết yếu 58% | Muốn 30% | Tiết kiệm 12%. Lý tưởng: Nhu cầu 50% | Muốn 30% | Tiết kiệm 20%. Điều chỉnh nhỏ trong mục mua sắm và ăn uống sẽ cải thiện đáng kể.',
    potentialSaving: 2_500_000, confidenceScore: 0.91,
    tags: ['ngân sách', 'kế hoạch', '50/30/20'],
    relatedCategoryIds: ['cat-01', 'cat-04'],
    actionItems: ['Điều chỉnh ngân sách mua sắm xuống 2.5 triệu', 'Tăng quỹ đầu tư lên 5 triệu'],
    generatedAt: '2025-07-10T06:00:00Z', isApplied: false,
  },
  {
    id: 'ins-03', type: 'habit',
    title: 'Bạn hay mua sắm bốc đồng vào thứ 6–7',
    summary: '73% giao dịch mua sắm của bạn xảy ra vào cuối tuần, thường sau 8 giờ tối.',
    detail: 'Mẫu hành vi cho thấy chi tiêu cuối tuần cao hơn 2.3 lần ngày thường. Thử thiết lập "ngân sách cuối tuần" giới hạn 500,000đ cho mỗi thứ 6–7 để kiểm soát chi tiêu bốc đồng.',
    potentialSaving: 800_000, confidenceScore: 0.79,
    tags: ['thói quen', 'mua sắm', 'cuối tuần'],
    relatedCategoryIds: ['cat-04', 'cat-03'],
    actionItems: ['Bật thông báo khi tiêu > 200k/lần vào cuối tuần', 'Thiết lập quy tắc 24h trước khi mua sắm > 500k'],
    generatedAt: '2025-07-09T06:00:00Z', isApplied: false,
  },
  {
    id: 'ins-04', type: 'goal',
    title: 'Quỹ khẩn cấp cần thêm 3 tháng',
    summary: 'Quỹ khẩn cấp của bạn hiện đủ 3 tháng chi tiêu. Mục tiêu lý tưởng là 6 tháng.',
    detail: 'Với chi phí sống hiện tại ~12 triệu/tháng, bạn cần 72 triệu trong quỹ khẩn cấp. Hiện có ~36 triệu. Nếu tiết kiệm thêm 3 triệu/tháng, bạn sẽ đạt mục tiêu trong 12 tháng.',
    potentialSaving: 0, confidenceScore: 0.95,
    tags: ['quỹ khẩn cấp', 'an toàn tài chính'],
    relatedCategoryIds: ['cat-08'],
    actionItems: ['Tạo tài khoản tiết kiệm riêng cho quỹ khẩn cấp', 'Tự động chuyển 3 triệu vào ngày 1 mỗi tháng'],
    generatedAt: '2025-07-08T06:00:00Z', isApplied: true,
  },
];

// ── Spending Habits ───────────────────────────────────────────────
export const mockSpendingHabits: SpendingHabit[] = [
  { categoryId: 'cat-01', averageMonthly: 3_600_000, trend: 'increasing', trendPercentage: 12, peakDayOfWeek: 0, peakHourOfDay: 12, topMerchants: ['Okura', 'Bún bò Hoa', 'KFC'] },
  { categoryId: 'cat-04', averageMonthly: 2_800_000, trend: 'increasing', trendPercentage: 25, peakDayOfWeek: 6, peakHourOfDay: 20, topMerchants: ['Shopee', 'Lazada', 'Zara'] },
  { categoryId: 'cat-03', averageMonthly: 1_050_000, trend: 'stable',     trendPercentage:  2, peakDayOfWeek: 5, peakHourOfDay: 22, topMerchants: ['Netflix', 'Spotify', 'Steam'] },
  { categoryId: 'cat-02', averageMonthly:   580_000, trend: 'decreasing', trendPercentage: -8, peakDayOfWeek: 1, peakHourOfDay:  8, topMerchants: ['Grab', 'Xăng'] },
];

// ── Health Score ──────────────────────────────────────────────────
export const mockHealthScore: HealthScore = {
  overall: 72,
  savingsRate: 22,
  debtRatio: 0,
  budgetAdherence: 67,
  emergencyFundMonths: 3,
  lastUpdated: '2025-07-10T06:00:00Z',
  breakdown: [
    { label: 'Tỷ lệ tiết kiệm',    score: 22, maxScore: 30, description: 'Tốt! Mục tiêu lý tưởng ≥ 20%' },
    { label: 'Kiểm soát ngân sách', score: 18, maxScore: 30, description: 'Vượt ngân sách 2 danh mục' },
    { label: 'Quỹ khẩn cấp',       score: 15, maxScore: 20, description: '3/6 tháng chi tiêu đã có' },
    { label: 'Đầu tư',             score: 12, maxScore: 15, description: 'Đang đầu tư 8% thu nhập' },
    { label: 'Không có nợ xấu',    score:  5, maxScore:  5, description: 'Xuất sắc – Không nợ!' },
  ],
};

// ── Financial Goals ───────────────────────────────────────────────
export const mockGoals: FinancialGoal[] = [
  {
    id: 'goal-01', title: 'Quỹ khẩn cấp 6 tháng', iconEmoji: '🛡️', color: '#4ade80',
    description: 'Xây dựng quỹ dự phòng đủ cho 6 tháng chi tiêu',
    targetAmount: 72_000_000, currentAmount: 36_000_000, currency: 'VND',
    deadline: '2026-07-01', status: 'on-track', categoryId: 'cat-08',
    milestones: [
      { id: 'm-01', title: '1 tháng', targetAmount: 12_000_000, achievedAt: '2024-06-01', isAchieved: true },
      { id: 'm-02', title: '3 tháng', targetAmount: 36_000_000, achievedAt: '2025-03-01', isAchieved: true },
      { id: 'm-03', title: '6 tháng', targetAmount: 72_000_000, isAchieved: false },
    ],
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'goal-02', title: 'Du lịch Nhật Bản', iconEmoji: '🗾', color: '#818cf8',
    description: 'Tiết kiệm cho chuyến đi Nhật Bản 10 ngày',
    targetAmount: 30_000_000, currentAmount: 18_500_000, currency: 'VND',
    deadline: '2025-12-31', status: 'on-track',
    milestones: [
      { id: 'm-04', title: 'Nửa đường', targetAmount: 15_000_000, achievedAt: '2025-05-01', isAchieved: true },
      { id: 'm-05', title: 'Đặt vé',    targetAmount: 22_000_000, isAchieved: false },
    ],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'goal-03', title: 'Mua xe máy mới', iconEmoji: '🛵', color: '#f472b6',
    description: 'Tích lũy mua Honda Air Blade 2025',
    targetAmount: 55_000_000, currentAmount: 10_000_000, currency: 'VND',
    deadline: '2026-06-30', status: 'at-risk',
    milestones: [],
    createdAt: '2025-06-01T00:00:00Z',
  },
];

// ── Dashboard Summary ─────────────────────────────────────────────
export const mockDashboardSummary: DashboardSummary = {
  totalBalance: 156_320_000,
  monthlyIncome: 28_500_000,
  monthlyExpenses: 14_370_000,
  monthlySavings: 7_130_000,
  savingsRate: 25.02,
  comparedToLastMonth: {
    income:   8.3,
    expenses: -4.1,
    savings:  12.5,
  },
};

// ── Monthly Chart Data ────────────────────────────────────────────
export const mockMonthlyData: MonthlyChartData[] = [
  { month: 'T2',  income: 25_000_000, expenses: 16_200_000, savings: 8_800_000 },
  { month: 'T3',  income: 25_000_000, expenses: 14_800_000, savings: 10_200_000 },
  { month: 'T4',  income: 27_500_000, expenses: 15_900_000, savings: 11_600_000 },
  { month: 'T5',  income: 25_000_000, expenses: 18_300_000, savings: 6_700_000 },
  { month: 'T6',  income: 26_300_000, expenses: 14_900_000, savings: 11_400_000 },
  { month: 'T7',  income: 28_500_000, expenses: 14_370_000, savings: 7_130_000 },
];

// ── Category Expense Chart Data ───────────────────────────────────
export const mockCategoryExpenses = [
  { name: 'Ăn uống',    value: 3_200_000, color: '#f87171' },
  { name: 'Mua sắm',    value: 3_400_000, color: '#f472b6' },
  { name: 'Hóa đơn',    value:   800_000, color: '#34d399' },
  { name: 'Giải trí',   value: 1_100_000, color: '#a78bfa' },
  { name: 'Di chuyển',  value:   650_000, color: '#fb923c' },
  { name: 'Đầu tư',     value: 2_000_000, color: '#4ade80' },
  { name: 'Sức khỏe',   value:   250_000, color: '#22d3ee' },
  { name: 'Giáo dục',   value:   500_000, color: '#818cf8' },
];
