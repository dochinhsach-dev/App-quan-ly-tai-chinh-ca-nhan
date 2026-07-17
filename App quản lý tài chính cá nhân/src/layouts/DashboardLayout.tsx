// ─────────────────────────────────────────────────────────────────
//  DashboardLayout – Sidebar + Top Navbar, fully responsive
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, PieChart, Brain, Bell,
  Target, Settings, Menu, X, ChevronRight,
  TrendingUp, LogOut, Sparkles,
} from 'lucide-react';
import { useUser as useClerkUser, useClerk, UserButton } from '@clerk/clerk-react';
import { cn } from '../utils/helpers';
import { useFinanceStore, useUnreadAlerts, useUnreadAlertsCount } from '../stores/useFinanceStore';

// ── Nav Config ────────────────────────────────────────────────────
const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, to: '/',           end: true },
  { label: 'Giao dịch',   icon: Wallet,           to: '/transactions' },
  { label: 'Ngân sách',   icon: PieChart,          to: '/budgets' },
  { label: 'AI Insights',  icon: Brain,             to: '/insights',   badge: 'NEW' },
  { label: 'Mục tiêu',    icon: Target,             to: '/goals' },
  { label: 'Nhắc nhở',    icon: Bell,               to: '/reminders' },
];

const bottomNavItems = [
  { label: 'Cài đặt', icon: Settings, to: '/settings' },
];

// ── Sidebar ───────────────────────────────────────────────────────
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useClerkUser();
  const { signOut } = useClerk();
  const location = useLocation();

  const displayName = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Người dùng';
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const avatarUrl = user?.imageUrl;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-[260px] bg-surface-900 border-r border-slate-800/70',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gradient-brand">FinanceAI</p>
              <p className="text-[10px] text-slate-500 leading-none">Smart Money Manager</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Tổng quan
          </p>
          {navItems.map(({ label, icon: Icon, to, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="badge-brand text-[9px] px-1.5 py-0.5">{badge}</span>
              )}
              <ChevronRight
                className={cn(
                  'w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity',
                  location.pathname === to && 'opacity-60',
                )}
              />
            </NavLink>
          ))}

          <div className="pt-4 mt-2 border-t border-slate-800/60">
            <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Hệ thống
            </p>
            {bottomNavItems.map(({ label, icon: Icon, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Card */}
        <div className="p-3 border-t border-slate-800/60">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-xl object-cover flex-shrink-0 ring-2 ring-brand-500/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{email}</p>
            </div>
            {/* Sign out button */}
            <button
              onClick={() => signOut({ redirectUrl: '/sign-in' })}
              title="Đăng xuất"
              className="p-1.5 rounded-lg text-slate-600 hover:text-danger-400 hover:bg-danger-500/10 transition-all duration-200 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Top Navbar ────────────────────────────────────────────────────
function TopNavbar({ onMenuClick }: { onMenuClick: () => void }) {
  const unreadAlerts = useUnreadAlerts();
  const unreadCount  = useUnreadAlertsCount();
  const markAllAlertsRead = useFinanceStore((s) => s.markAllAlertsRead);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="h-16 bg-surface-900/80 backdrop-blur-xl border-b border-slate-800/60 flex items-center px-4 gap-4 sticky top-0 z-20">
      {/* Menu button (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden btn-ghost p-2 rounded-xl"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title / breadcrumb */}
      <div className="flex-1">
        <PageTitle />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* AI badge */}
        <button className="hidden sm:flex items-center gap-2 btn bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 text-xs py-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          AI Advisor
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); markAllAlertsRead(); }}
            className="btn-ghost p-2 rounded-xl relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50 p-2 animate-fade-in">
              <div className="flex items-center justify-between px-3 py-2 mb-1">
                <p className="text-sm font-semibold text-slate-200">Thông báo</p>
                {unreadCount > 0 && (
                  <span className="badge-danger">{unreadCount} mới</span>
                )}
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {unreadAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors">
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      alert.severity === 'danger'  ? 'bg-danger-500'  :
                      alert.severity === 'warning' ? 'bg-warning-500' :
                      alert.severity === 'success' ? 'bg-success-500' : 'bg-brand-500',
                    )} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{alert.title}</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">{alert.message}</p>
                    </div>
                  </div>
                ))}
                {unreadAlerts.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">Không có thông báo mới</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar – Clerk UserButton */}
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: 'w-9 h-9 rounded-xl ring-2 ring-brand-500/30 hover:ring-brand-500/60 transition-all',
              userButtonPopoverCard: 'bg-slate-900 border border-slate-700 shadow-xl',
              userButtonPopoverActionButton: 'text-slate-300 hover:text-white hover:bg-slate-800',
              userButtonPopoverActionButtonText: 'text-slate-300',
              userButtonPopoverFooter: 'hidden',
            },
            variables: {
              colorBackground: '#0f172a',
              colorText: '#f1f5f9',
              colorPrimary: '#6366f1',
            },
          }}
        />
      </div>
    </header>
  );
}

// ── Page Title (reads from route) ─────────────────────────────────
function PageTitle() {
  const location = useLocation();
  const routeMap: Record<string, string> = {
    '/':             'Dashboard',
    '/transactions': 'Giao dịch',
    '/budgets':      'Ngân sách',
    '/insights':     'AI Insights',
    '/goals':        'Mục tiêu',
    '/reminders':    'Nhắc nhở',
    '/settings':     'Cài đặt',
  };
  const title = routeMap[location.pathname] || 'FinanceAI';

  return (
    <div>
      <h1 className="text-base font-semibold text-slate-100">{title}</h1>
      <p className="text-xs text-slate-500 hidden sm:block">
        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
