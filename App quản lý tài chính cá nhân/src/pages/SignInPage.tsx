// ─────────────────────────────────────────────────────────────────
//  SignInPage – Trang đăng nhập với Clerk, thiết kế dark premium
// ─────────────────────────────────────────────────────────────────
import { SignIn } from '@clerk/clerk-react';
import { TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Phân tích thông minh', desc: 'AI tự động phân tích chi tiêu và đưa ra gợi ý tiết kiệm' },
  { icon: Shield, title: 'Bảo mật tuyệt đối', desc: 'Dữ liệu được mã hóa end-to-end, đảm bảo an toàn tuyệt đối' },
  { icon: Zap, title: 'Thời gian thực', desc: 'Cập nhật và theo dõi tài chính ngay lập tức, mọi lúc mọi nơi' },
];

const clerkAppearance = {
  variables: {
    colorPrimary: '#6366f1',
    colorBackground: '#ffffff',
    colorInputBackground: '#f8fafc',
    colorInputText: '#0f172a',
    colorText: '#0f172a',
    colorTextSecondary: '#64748b',
    colorDanger: '#ef4444',
    borderRadius: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
  },
  elements: {
    card: 'bg-white shadow-2xl shadow-indigo-500/10 border border-slate-200/80 rounded-2xl',
    rootBox: 'w-full',
    formButtonPrimary:
      'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-indigo-500/30',
    formFieldInput:
      'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20',
    formFieldLabel: 'text-slate-700 text-sm font-medium',
    identityPreviewText: 'text-slate-700',
    identityPreviewEditButton: 'text-indigo-500 hover:text-indigo-600',
    headerTitle: 'text-slate-900 font-bold text-xl',
    headerSubtitle: 'text-slate-500 text-sm',
    socialButtonsBlockButton:
      'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all duration-200 shadow-sm',
    socialButtonsBlockButtonText: 'text-slate-700 font-medium',
    dividerLine: 'bg-slate-200',
    dividerText: 'text-slate-400 text-xs',
    footerActionLink: 'text-indigo-600 hover:text-indigo-700 font-semibold',
    footerActionText: 'text-slate-500',
    otpCodeFieldInput:
      'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400',
    alertText: 'text-slate-700 text-sm',
    formResendCodeLink: 'text-indigo-600 hover:text-indigo-700',
    footer: 'bg-slate-50/80 border-t border-slate-100 rounded-b-2xl',
  },
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden">
      {/* ── Left Panel: Branding ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                FinanceAI
              </p>
              <p className="text-xs text-slate-400">Smart Money Manager</p>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Quản lý tài chính{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              thông minh
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-12">
            Theo dõi, phân tích và tối ưu hóa tài chính cá nhân với sức mạnh của AI.
          </p>

          {/* Feature list */}
          <div className="space-y-4 text-left">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/8 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200 mb-0.5">{title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '50K+', label: 'Người dùng' },
              { value: '99.9%', label: 'Uptime' },
              { value: '256-bit', label: 'Mã hóa' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Sign In Form ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              FinanceAI
            </p>
            <p className="text-[10px] text-slate-500">Smart Money Manager</p>
          </div>
        </div>

        {/* Clerk Sign-In component */}
        <div className="w-full max-w-md">
          <SignIn
            appearance={clerkAppearance}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
          />
        </div>

        <p className="mt-6 text-xs text-slate-600 text-center">
          Bằng cách đăng nhập, bạn đồng ý với{' '}
          <span className="text-slate-500 hover:text-slate-400 cursor-pointer">Điều khoản dịch vụ</span>
          {' '}và{' '}
          <span className="text-slate-500 hover:text-slate-400 cursor-pointer">Chính sách quyền riêng tư</span>
        </p>
      </div>
    </div>
  );
}
