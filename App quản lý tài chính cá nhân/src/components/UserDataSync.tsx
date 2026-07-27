// ─────────────────────────────────────────────────────────────────
//  UserDataSync – Khởi tạo dữ liệu từ JSON Server khi Clerk login
// ─────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useFinanceStore, useIsLoading, useServerOnline } from '../stores/useFinanceStore';
import { checkServerOnline } from '../services/apiService';

export default function UserDataSync() {
  const { user, isLoaded } = useUser();
  const initializeUserData  = useFinanceStore((s) => s.initializeUserData);
  const setServerOnline      = useFinanceStore((s) => s.setServerOnline);
  const isLoading            = useIsLoading();
  const serverOnline         = useServerOnline();
  const [checked, setChecked] = useState(false);

  // 1. Check if json-server is reachable
  useEffect(() => {
    checkServerOnline().then((online) => {
      setServerOnline(online);
      setChecked(true);
    });
  }, [setServerOnline]);

  // 2. Initialize user data once server check is done
  useEffect(() => {
    if (!isLoaded || !user || !checked || !serverOnline) return;
    initializeUserData({
      id:                   user.id,
      firstName:            user.firstName,
      fullName:             user.fullName,
      primaryEmailAddress:  user.primaryEmailAddress ?? undefined,
      imageUrl:             user.imageUrl,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isLoaded, checked, serverOnline]);

  // Loading overlay while fetching initial data
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[200] bg-surface-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-brand-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-brand-500 rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-200">Đang tải dữ liệu…</p>
          <p className="text-xs text-slate-500 mt-1">Kết nối với cơ sở dữ liệu</p>
        </div>
      </div>
    );
  }

  // Server offline banner
  if (checked && !serverOnline) {
    return <ServerOfflineBanner />;
  }

  return null;
}

// ── Server Offline Banner ─────────────────────────────────────────
function ServerOfflineBanner() {
  const setServerOnline = useFinanceStore((s) => s.setServerOnline);
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    const online = await checkServerOnline();
    setServerOnline(online);
    setRetrying(false);
    if (online) setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[150] animate-fade-in">
      <div className="flex items-center gap-3 bg-slate-900/95 border border-slate-700/60 text-slate-300 text-xs px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm">
        {/* Pulse dot */}
        <span className="w-2 h-2 rounded-full bg-danger-400 flex-shrink-0 animate-pulse" />

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-200">Backend chưa kết nối</p>
          <p className="text-slate-500 mt-0.5 text-[11px]">
            Chạy lệnh{' '}
            <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-brand-300">npm run db</code>
            {' '}trong terminal để khởi động.
          </p>
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="flex-shrink-0 px-2.5 py-1.5 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-300 text-[11px] font-medium transition-all disabled:opacity-50"
        >
          {retrying ? (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border border-brand-400/40 border-t-brand-400 rounded-full animate-spin inline-block" />
              Thử lại
            </span>
          ) : 'Thử lại'}
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
          title="Đóng thông báo"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
