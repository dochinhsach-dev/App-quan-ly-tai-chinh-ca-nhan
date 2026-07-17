// ─────────────────────────────────────────────────────────────────
//  SignUpPage – Trang đăng ký với Clerk
// ─────────────────────────────────────────────────────────────────
import { SignUp } from '@clerk/clerk-react';
import { TrendingUp } from 'lucide-react';

const clerkAppearance = {
  variables: {
    colorPrimary: '#6366f1',
    colorBackground: '#0f172a',
    colorInputBackground: '#1e293b',
    colorInputText: '#f1f5f9',
    colorText: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
    colorDanger: '#ef4444',
    borderRadius: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
  },
  elements: {
    card: 'bg-transparent shadow-none border-none',
    rootBox: 'w-full',
    formButtonPrimary:
      'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-indigo-500/25',
    formFieldInput:
      'bg-slate-800/80 border-slate-700/60 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/70 focus:ring-indigo-500/20',
    formFieldLabel: 'text-slate-300 text-sm font-medium',
    headerTitle: 'text-white font-bold text-xl',
    headerSubtitle: 'text-slate-400 text-sm',
    socialButtonsBlockButton:
      'bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/80 text-slate-200 transition-all duration-200',
    socialButtonsBlockButtonText: 'text-slate-200 font-medium',
    dividerLine: 'bg-slate-700/60',
    dividerText: 'text-slate-500 text-xs',
    footerActionLink: 'text-indigo-400 hover:text-indigo-300 font-medium',
    footerActionText: 'text-slate-400',
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]" />
      </div>

      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 mb-8 relative z-10">
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

      {/* Clerk Sign-Up component */}
      <div className="w-full max-w-md relative z-10">
        <SignUp
          appearance={clerkAppearance}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
