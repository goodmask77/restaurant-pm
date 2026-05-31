export type ProjectStatus = 'planning' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'
export type PaymentStatus = 'pending' | 'partial' | 'paid'
export type ContractorStatus = 'active' | 'inactive'
export type WorkCategory = '土建' | '水電' | '空調' | '裝修' | '設備' | '消防' | '驗收' | '其他'
export type RestaurantType = '中餐' | '西餐' | '日式' | '火鍋' | '咖啡廳' | '快餐' | '其他'

export interface Profile {
  id: string
  created_at: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'manager' | 'supervisor' | 'viewer'
}

export interface Project {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string | null
  location: string | null
  restaurant_type: RestaurantType | null
  area_sqm: number | null
  floors: number
  start_date: string | null
  end_date: string | null
  status: ProjectStatus
  budget_total: number
  progress_pct: number
  project_manager: string | null
  site_supervisor: string | null
  owner_id: string
  // computed from joins
  tasks_count?: number
  open_issues_count?: number
}

export interface Task {
  id: string
  created_at: string
  project_id: string
  contractor_id: string | null
  title: string
  description: string | null
  category: WorkCategory | null
  status: TaskStatus
  priority: TaskPriority
  start_date: string | null
  due_date: string | null
  completed_date: string | null
  assigned_to: string | null
  progress: number
  notes: string | null
  // join
  contractor?: Contractor
  project?: Pick<Project, 'id' | 'name'>
}

export interface Contractor {
  id: string
  created_at: string
  name: string
  company: string | null
  specialty: string[]
  contact_person: string | null
  phone: string | null
  email: string | null
  rating: number | null
  status: ContractorStatus
  notes: string | null
  owner_id: string
}

export interface BudgetItem {
  id: string
  created_at: string
  project_id: string
  contractor_id: string | null
  category: WorkCategory
  item_name: string
  budgeted_amount: number
  actual_amount: number
  paid_amount: number
  payment_status: PaymentStatus
  invoice_no: string | null
  notes: string | null
  // join
  contractor?: Contractor
}

export interface Issue {
  id: string
  created_at: string
  project_id: string
  task_id: string | null
  title: string
  description: string | null
  severity: IssueSeverity
  status: IssueStatus
  reported_by: string | null
  assigned_to: string | null
  resolved_date: string | null
  resolution_notes: string | null
  // join
  project?: Pick<Project, 'id' | 'name'>
}

export interface DailyReport {
  id: string
  created_at: string
  project_id: string
  report_date: string
  weather: string | null
  workers_count: number
  work_summary: string | null
  progress_update: string | null
  issues_encountered: string | null
  next_day_plan: string | null
  reported_by: string | null
  // join
  project?: Pick<Project, 'id' | 'name'>
}
