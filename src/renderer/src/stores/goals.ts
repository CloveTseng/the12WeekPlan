import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, WeeklyAction, MonthlyPlan, CreateProjectDTO, CreateActionDTO, CreateMonthlyPlanDTO, PlanCycle, CreateCycleDTO, UpdateCycleDTO } from '../types/goals'

export const useGoalsStore = defineStore('goals', () => {
  const currentYear = ref(new Date().getFullYear())
  const currentQuarter = ref(Math.ceil((new Date().getMonth() + 1) / 3))
  const currentWeek = ref(1) // Default to Week 1
  const currentCycle = ref<PlanCycle | null>(null)

  const projects = ref<Project[]>([])
  const actions = ref<Record<number, WeeklyAction[]>>({}) // Map projectId -> actions[]
  const monthlyPlans = ref<Record<number, MonthlyPlan[]>>({}) // Map projectId -> monthlyPlans[]
  const confirmDelete = ref(true) // Setting: Confirm before delete

  // Helper to safely access API
  const getApi = () => {
    if (!window.api || !window.api.goals) {
      throw new Error('API not initialized. Please restart the application.')
    }
    return window.api.goals
  }

  const fetchProjects = async () => {
    try {
      projects.value = await getApi().getProjects(currentYear.value, currentQuarter.value)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      // Don't rethrow here to allow UI to render empty state
    }
  }

  const addProject = async (data: CreateProjectDTO) => {
    const newProject = await getApi().createProject(data)
    projects.value.unshift(newProject)
    return newProject
  }

  const fetchActions = async (projectId: number) => {
    try {
      // Fetch only for current week? Or maintain a map of project -> week -> actions?
      // For now, let's keep simple: actions[projectId] stores currently viewed actions.
      // BUT for TargetPlanningCard, we need ALL actions.
      // Let's modify state to handle "all actions" differently or merge.
      // If we change actions to be ALL actions, it might break ProjectCard if it expects only current week?
      // No, ProjectCard uses `store.actions[projectId]` and filters? No, it used `getActions` with week num.
      // Let's verify ProjectCard usage.
      // It uses `computed(() => store.actions[props.project.id] || [])`.
      // And `loadActions` calls `store.fetchActions(props.project.id)`.
      // `fetchActions` uses `currentWeek.value`.
      // If we change `fetchActions` to fetch ALL, then ProjectCard needs to filter by week.
      // THIS IS A BREAKING CHANGE for ProjectCard behavior if I change `fetchActions`.
      // So I should leave `fetchActions` as is (fetching current week), and add `fetchAllActions`.
      // BUT they share the `actions` state.
      // If `fetchAllActions` populates `actions[projectId]`, then ProjectCard will see ALL actions.
      // So ProjectCard MUST filter by week if I do this.
      const projectActions = await getApi().getActions(projectId, currentWeek.value)
      actions.value[projectId] = projectActions
    } catch (error) {
      console.error(`Failed to fetch actions for project ${projectId}:`, error)
    }
  }

  const fetchAllActions = async (projectId: number) => {
    try {
      const allActions = await getApi().getAllActions(projectId)
      actions.value[projectId] = allActions
    } catch (error) {
      console.error(`Failed to fetch all actions for project ${projectId}:`, error)
    }
  }

  const addAction = async (data: CreateActionDTO) => {
    const newAction = await getApi().createAction(data)
    if (!actions.value[data.project_id]) {
      actions.value[data.project_id] = []
    }
    actions.value[data.project_id].push(newAction)
    return newAction
  }

  const toggleAction = async (actionId: number, isCompleted: boolean, projectId: number) => {
    await getApi().toggleAction(actionId, isCompleted)
    const projectActions = actions.value[projectId]
    const action = projectActions?.find(a => a.id === actionId)
    if (action) {
      action.is_completed = isCompleted
    }
  }

  const deleteAction = async (actionId: number, projectId: number) => {
    await getApi().deleteAction(actionId)
    if (actions.value[projectId]) {
      actions.value[projectId] = actions.value[projectId].filter(a => a.id !== actionId)
    }
  }

  const fetchMonthlyPlans = async (projectId: number) => {
    try {
      const plans = await getApi().getMonthlyPlans(projectId)
      monthlyPlans.value[projectId] = plans
    } catch (error) {
      console.error(`Failed to fetch monthly plans for project ${projectId}:`, error)
    }
  }

  const addMonthlyPlan = async (data: CreateMonthlyPlanDTO) => {
    const newPlan = await getApi().createMonthlyPlan(data)
    if (!monthlyPlans.value[data.project_id]) {
      monthlyPlans.value[data.project_id] = []
    }
    monthlyPlans.value[data.project_id].push(newPlan)
    return newPlan
  }

  const deleteMonthlyPlan = async (planId: number, projectId: number) => {
    await getApi().deleteMonthlyPlan(planId)
    if (monthlyPlans.value[projectId]) {
      monthlyPlans.value[projectId] = monthlyPlans.value[projectId].filter(p => p.id !== planId)
    }
  }

  const toggleMonthlyPlanPrimary = async (planId: number, isPrimary: boolean, projectId: number) => {
    await getApi().toggleMonthlyPlanPrimary(planId, isPrimary)
    const plans = monthlyPlans.value[projectId]
    const plan = plans?.find(p => p.id === planId)
    if (plan) {
      plan.is_primary = isPrimary
    }
  }

  const calculateCurrentWeek = (startDate: string) => {
    const start = new Date(startDate)
    const now = new Date()
    const diffTime = now.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const week = Math.floor(diffDays / 7) + 1
    return week < 1 ? 1 : week
  }

  const fetchCurrentCycle = async () => {
    try {
      const cycle = await getApi().getCurrentCycle()
      if (cycle) {
        currentCycle.value = cycle
        currentWeek.value = calculateCurrentWeek(cycle.start_date)
        
        // Update year/quarter based on cycle start date
        const startDate = new Date(cycle.start_date)
        currentYear.value = startDate.getFullYear()
        currentQuarter.value = Math.ceil((startDate.getMonth() + 1) / 3)
      }
    } catch (error) {
      console.error('Failed to fetch current cycle:', error)
    }
  }

  const createCycle = async (data: CreateCycleDTO) => {
    try {
      const newCycle = await getApi().createCycle(data)
      currentCycle.value = newCycle
      currentWeek.value = calculateCurrentWeek(newCycle.start_date)
      
      const startDate = new Date(newCycle.start_date)
      currentYear.value = startDate.getFullYear()
      currentQuarter.value = Math.ceil((startDate.getMonth() + 1) / 3)
      
      // Refresh projects for the new cycle's period
      await fetchProjects()
      
      return newCycle
    } catch (error) {
      console.error('Failed to create cycle:', error)
      throw error
    }
  }

  const updateCycle = async (data: UpdateCycleDTO) => {
    try {
      const updatedCycle = await getApi().updateCycle(data)
      // Merge with existing cycle to keep is_active and other fields if needed, 
      // but API returns partial or full? My implementation returns id, title, start, end.
      if (currentCycle.value && currentCycle.value.id === data.id) {
        currentCycle.value = { ...currentCycle.value, ...updatedCycle }
        currentWeek.value = calculateCurrentWeek(updatedCycle.start_date)
        
        const startDate = new Date(updatedCycle.start_date)
        currentYear.value = startDate.getFullYear()
        currentQuarter.value = Math.ceil((startDate.getMonth() + 1) / 3)
      }
      return updatedCycle
    } catch (error) {
      console.error('Failed to update cycle:', error)
      throw error
    }
  }

  return {
    currentYear,
    currentQuarter,
    currentWeek,
    currentCycle,
    projects,
    actions,
    monthlyPlans,
    confirmDelete,
    fetchProjects,
    addProject,
    fetchActions,
    fetchAllActions,
    addAction,
    toggleAction,
    deleteAction,
    fetchMonthlyPlans,
    addMonthlyPlan,
    deleteMonthlyPlan,
    toggleMonthlyPlanPrimary,
    fetchCurrentCycle,
    createCycle,
    updateCycle
  }
})
