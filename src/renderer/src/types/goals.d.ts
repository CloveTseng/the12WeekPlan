export interface Project {
  id: number
  title: string
  description: string
  tactics: string
  deadline: string
  year: number
  quarter: number
  created_at: string
}

export type Priority = 'High' | 'Medium' | 'Low' | null

export interface WeeklyAction {
  id: number
  project_id: number
  week_number: number
  content: string
  is_completed: boolean
  due_date?: string | null
  priority?: Priority
  created_at: string
}

export interface MonthlyPlan {
  id: number
  project_id: number
  month: number
  content: string
  is_primary: boolean
  created_at: string
}

export interface PlanCycle {
  id: number
  title: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export interface CreateProjectDTO {
  title: string
  description: string
  tactics: string
  deadline: string
  year: number
  quarter: number
}

export interface CreateActionDTO {
  project_id: number
  week_number: number
  content: string
  due_date?: string | null
  priority?: Priority
}

export interface CreateMonthlyPlanDTO {
  project_id: number
  month: number
  content: string
  is_primary: boolean
}

export interface CreateCycleDTO {
  title: string
  start_date: string
  end_date: string
}

export interface UpdateCycleDTO {
  id: number
  title: string
  start_date: string
  end_date: string
}

export interface UpdateActionDTO {
  content: string
  due_date?: string | null
  priority?: Priority
}
