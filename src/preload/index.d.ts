import { ElectronAPI } from '@electron-toolkit/preload'

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

export interface WeeklyAction {
  id: number
  project_id: number
  week_number: number
  content: string
  is_completed: boolean
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
}

export interface CreateMonthlyPlanDTO {
  project_id: number
  month: number
  content: string
  is_primary: boolean
}

export interface Cycle {
  id: number
  title: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export interface CreateCycleDTO {
  title: string
  start_date: string
  end_date: string
  is_active: boolean
}

export interface UpdateCycleDTO {
  id: number
  title?: string
  start_date?: string
  end_date?: string
  is_active?: boolean
}

export interface GoalsAPI {
  getProjects(year: number, quarter: number): Promise<Project[]>
  createProject(data: CreateProjectDTO): Promise<Project>
  getActions(projectId: number, weekNumber: number): Promise<WeeklyAction[]>
  getAllActions(projectId: number): Promise<WeeklyAction[]>
  createAction(data: CreateActionDTO): Promise<WeeklyAction>
  toggleAction(actionId: number, isCompleted: boolean): Promise<boolean>
  deleteAction(actionId: number): Promise<boolean>
  getMonthlyPlans(projectId: number): Promise<MonthlyPlan[]>
  createMonthlyPlan(data: CreateMonthlyPlanDTO): Promise<MonthlyPlan>
  deleteMonthlyPlan(planId: number): Promise<boolean>
  toggleMonthlyPlanPrimary(planId: number, isPrimary: boolean): Promise<boolean>
  getCurrentCycle(): Promise<Cycle | null>
  createCycle(data: CreateCycleDTO): Promise<Cycle>
  updateCycle(data: UpdateCycleDTO): Promise<Cycle>
}

export interface SettingsAPI {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      goals: GoalsAPI
      settings: SettingsAPI
    }
  }
}
