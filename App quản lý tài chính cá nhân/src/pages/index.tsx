// Pages barrel – re-export all page components
export { default as Transactions } from './Transactions';

// Stub pages – sẽ được mở rộng ở các bước sau
import { Construction } from 'lucide-react';

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/15 flex items-center justify-center border border-brand-500/20">
        <Construction className="w-8 h-8 text-brand-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-100 mb-1">{title}</h2>
        <p className="text-slate-400 text-sm">Tính năng đang được phát triển. Sắp ra mắt!</p>
      </div>
      <div className="flex items-center gap-1.5">
        {[0,1,2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
        ))}
      </div>
    </div>
  );
}

export function Budgets()      { return <ComingSoon title="Ngân sách & Chi tiêu" />; }
export function Goals()        { return <ComingSoon title="Mục tiêu Tài chính" />; }
export function Reminders()    { return <ComingSoon title="Nhắc nhở & Lịch hóa đơn" />; }
export function SettingsPage() { return <ComingSoon title="Cài đặt" />; }

