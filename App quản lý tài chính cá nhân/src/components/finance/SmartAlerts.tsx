// ─────────────────────────────────────────────────────────────────
//  SmartAlerts – Real-time spending alerts & smart reminders
// ─────────────────────────────────────────────────────────────────
import { X, AlertTriangle, CheckCircle2, Info, ShieldAlert, Bell, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useAlerts, useFinanceStore } from '../../stores/useFinanceStore';
import type { Alert, AlertSeverity } from '../../types/finance';

// ── Severity Config ───────────────────────────────────────────────
const severityConfig: Record<AlertSeverity, {
  icon: typeof AlertTriangle;
  bg: string;
  border: string;
  iconColor: string;
  badge: string;
}> = {
  danger: {
    icon: ShieldAlert,
    bg: 'bg-danger-500/8',
    border: 'border-danger-500/30',
    iconColor: 'text-danger-400',
    badge: 'badge-danger',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning-500/8',
    border: 'border-warning-500/30',
    iconColor: 'text-warning-400',
    badge: 'badge-warning',
  },
  info: {
    icon: Info,
    bg: 'bg-brand-500/8',
    border: 'border-brand-500/30',
    iconColor: 'text-brand-400',
    badge: 'badge-brand',
  },
  success: {
    icon: CheckCircle2,
    bg: 'bg-success-500/8',
    border: 'border-success-500/30',
    iconColor: 'text-success-400',
    badge: 'badge-success',
  },
};

const severityLabel: Record<AlertSeverity, string> = {
  danger: 'Khẩn cấp',
  warning: 'Cảnh báo',
  info: 'Thông tin',
  success: 'Thành công',
};

// ── Alert Card ────────────────────────────────────────────────────
function AlertCard({ alert }: { alert: Alert }) {
  const dismissAlert  = useFinanceStore((s) => s.dismissAlert);
  const markAlertRead = useFinanceStore((s) => s.markAlertRead);
  const config = severityConfig[alert.severity];
  const Icon   = config.icon;

  const handleAction = () => {
    markAlertRead(alert.id);
    // In a real app: navigate to alert.actionRoute
  };

  return (
    <div className={cn(
      'flex gap-3 p-4 rounded-xl border transition-all duration-300 animate-fade-in group',
      config.bg, config.border,
      !alert.isRead && 'shadow-sm',
    )}>
      {/* Icon */}
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
        `bg-current/10`,
      )}>
        <Icon className={cn('w-4 h-4', config.iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-200 leading-snug">{alert.title}</p>
            {!alert.isRead && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse flex-shrink-0" />
            )}
          </div>
          <button
            onClick={() => dismissAlert(alert.id)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded-lg transition-all flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-2">{alert.message}</p>

        <div className="flex items-center gap-3">
          <span className={cn('text-[10px]', config.badge)}>
            {severityLabel[alert.severity]}
          </span>
          {alert.actionLabel && (
            <button
              onClick={handleAction}
              className="text-[11px] font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              {alert.actionLabel}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
interface SmartAlertsProps {
  maxItems?: number;
  showHeader?: boolean;
}

export default function SmartAlerts({ maxItems = 4, showHeader = true }: SmartAlertsProps) {
  const alerts = useAlerts();
  const markAllAlertsRead = useFinanceStore((s) => s.markAllAlertsRead);

  const active = alerts
    .filter((a) => !a.isDismissed)
    .sort((a, b) => {
      const order: AlertSeverity[] = ['danger', 'warning', 'info', 'success'];
      return order.indexOf(a.severity) - order.indexOf(b.severity);
    })
    .slice(0, maxItems);

  const unreadCount = alerts.filter((a) => !a.isRead && !a.isDismissed).length;

  return (
    <div className="card p-5 flex flex-col gap-4 animate-fade-in">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-100">Cảnh báo thông minh</h3>
            {unreadCount > 0 && (
              <span className="badge-danger">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAlertsRead}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Đánh dấu đã đọc
            </button>
          )}
        </div>
      )}

      {active.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-success-400 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Mọi thứ đang ổn định!</p>
          <p className="text-xs text-slate-500 mt-0.5">Không có cảnh báo nào trong lúc này</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {active.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
