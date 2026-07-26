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
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 bg-danger-900/90 border border-danger-500/40 text-danger-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-danger-400 flex-shrink-0 animate-pulse" />
        <span>
          <span className="font-semibold">JSON Server chưa chạy.</span>
          {' '}Chạy <code className="bg-danger-800/60 px-1.5 py-0.5 rounded font-mono">npm run dev</code> để khởi động.
        </span>
      </div>
    );
  }

  return null;
}
