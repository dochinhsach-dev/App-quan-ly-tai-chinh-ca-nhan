// ─────────────────────────────────────────────────────────────────
//  Utility helpers
// ─────────────────────────────────────────────────────────────────
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number as Vietnamese currency */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Format number with K/M suffix */
export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toString();
}

/** Format ISO date to Vietnamese locale */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Relative time label (e.g. "2 giờ trước") */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);
  if (minutes < 1)   return 'Vừa xong';
  if (minutes < 60)  return `${minutes} phút trước`;
  if (hours   < 24)  return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

/** Get progress color based on percentage */
export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-danger-500';
  if (percentage >= 80)  return 'bg-warning-500';
  if (percentage >= 60)  return 'bg-brand-500';
  return 'bg-success-500';
}

/** Get trend arrow and color */
export function getTrend(value: number): { label: string; color: string; icon: string } {
  if (value > 0)  return { label: `+${value}%`, color: 'text-success-400', icon: '↑' };
  if (value < 0)  return { label: `${value}%`, color: 'text-danger-400',  icon: '↓' };
  return             { label: '0%',           color: 'text-slate-400',   icon: '→' };
}

/** Health score color */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success-400';
  if (score >= 60) return 'text-warning-400';
  return 'text-danger-400';
}

/** Day of week label (Vietnamese) */
export const DAY_LABELS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Truncate string */
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
}
