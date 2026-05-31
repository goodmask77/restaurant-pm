import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { ProjectStatus, TaskStatus, IssueSeverity, IssueStatus, PaymentStatus } from './supabase/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined, fmt = 'yyyy/MM/dd') {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), fmt, { locale: zhTW })
  } catch {
    return dateStr
  }
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planning:    '規劃中',
  in_progress: '施工中',
  paused:      '暫停',
  completed:   '完工',
  cancelled:   '取消',
}

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  planning:    'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  paused:      'bg-yellow-100 text-yellow-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-700',
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pending:     '待開始',
  in_progress: '進行中',
  completed:   '已完成',
  blocked:     '待解決',
}

export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  pending:     'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  blocked:     'bg-red-100 text-red-700',
}

export const ISSUE_SEVERITY_LABEL: Record<IssueSeverity, string> = {
  low:      '低',
  medium:   '中',
  high:     '高',
  critical: '緊急',
}

export const ISSUE_SEVERITY_COLOR: Record<IssueSeverity, string> = {
  low:      'bg-slate-100 text-slate-700',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  open:        '待處理',
  in_progress: '處理中',
  resolved:    '已解決',
  closed:      '已關閉',
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: '未付款',
  partial: '部分付款',
  paid:    '已付清',
}

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  pending: 'bg-slate-100 text-slate-700',
  partial: 'bg-yellow-100 text-yellow-700',
  paid:    'bg-green-100 text-green-700',
}

export const WORK_CATEGORIES = ['土建', '水電', '空調', '裝修', '設備', '消防', '驗收', '其他'] as const
export const RESTAURANT_TYPES = ['中餐', '西餐', '日式', '火鍋', '咖啡廳', '快餐', '其他'] as const
