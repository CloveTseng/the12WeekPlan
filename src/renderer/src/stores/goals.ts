import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, WeeklyAction, MonthlyPlan, Cycle, CreateProjectDTO, CreateActionDTO, CreateMonthlyPlanDTO, CreateCycleDTO, UpdateCycleDTO } from '../types/goals'

export const useGoalsStore = defineStore('goals', () => {
  const currentYear = ref(new Date().getFullYear())
  const currentQuarter = ref(Math.ceil((new Date().getMonth() + 1) / 3))
  const currentWeek = ref(1) // Default to Week 1, can be calculated dynamically later if needed
  const currentCycle = ref<Cycle | null>(null)

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

  const fetchCurrentCycle = async () => {
    try {
      const cycle = await getApi().getCurrentCycle()
      currentCycle.value = cycle
      if (cycle) {
        // Update year/quarter based on cycle start date to sync project view
        const startDate = new Date(cycle.start_date)
        currentYear.value = startDate.getFullYear()
        currentQuarter.value = Math.ceil((startDate.getMonth() + 1) / 3)
        // Also could update currentWeek based on start date vs today
        const today = new Date()
        const startDateObj = new Date(cycle.start_date)
        // Reset time to midnight for accurate day calculation
        today.setHours(0, 0, 0, 0)
        startDateObj.setHours(0, 0, 0, 0)
        
        const diffTime = today.getTime() - startDateObj.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        const week = Math.floor(diffDays / 7) + 1
        
        // Keep week within 1-12 range or allow overflow?
        // For now, let's strictly set it if it's positive
        if (week > 0) {
            currentWeek.value = week > 12 ? 12 : week
        } else if (week <= 0) {
             // Before start date
            currentWeek.value = 1
        }
      }
      // Refresh projects with potentially new year/quarter
      await fetchProjects()
    } catch (error) {
      console.error('Failed to fetch current cycle:', error)
    }
  }

  const createCycle = async (data: CreateCycleDTO) => {
    const newCycle = await getApi().createCycle(data)
    currentCycle.value = newCycle
    // Update context
    const startDate = new Date(newCycle.start_date)
    currentYear.value = startDate.getFullYear()
    currentQuarter.value = Math.ceil((startDate.getMonth() + 1) / 3)
    currentWeek.value = 1
    
    // Refresh projects (will be empty for new context usually, unless mapped)
    await fetchProjects()
    return newCycle
  }

  const updateCycle = async (data: UpdateCycleDTO) => {
    const updatedCycle = await getApi().updateCycle(data)
    // Refresh state from source to ensure all derived values (currentWeek etc) are correct
    if (updatedCycle.is_active) {
        await fetchCurrentCycle()
    } else {
        currentCycle.value = updatedCycle
    }
    return updatedCycle
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
