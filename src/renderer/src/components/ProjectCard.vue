<spec lang="md">
# ProjectCard
## Props
- project: Project - The project data object
- selectedWeek: number - The currently selected week number (1-12)

## Behavior
- Display project title, description, and deadline (if set)
- Display Monthly Plans context for the month corresponding to selectedWeek
- Fetch and display weekly actions for this project and the selectedWeek
- Allow adding a new action for the selectedWeek
- Allow toggling completion status of an action
- Allow deleting an action

## Visuals
- Use Morandi color palette
- Card style with rounded corners and subtle shadow
- Monthly Plans section: Distinct background, shows primary plan prominently
- Actions list:
  - Completed actions: strikethrough, grayed out
  - Pending actions: normal text
- Add action input: simple text input with enter to submit

## Interaction
- Enter key on input -> create action
- Click checkbox -> toggle completion
- Click trash icon -> delete action
</spec>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useGoalsStore } from '../stores/goals'
import { Project } from '../types/goals'
import { PhTrash, PhCheck, PhPlus, PhStar } from '@phosphor-icons/vue'

const props = defineProps<{
  project: Project
  selectedWeek: number
}>()

const store = useGoalsStore()
const newActionContent = ref('')
const isLoading = ref(false)

const projectActions = computed(() => {
  const allActions = store.actions[props.project.id] || []
  return allActions.filter(a => a.week_number === props.selectedWeek)
})
const currentMonth = computed(() => Math.ceil(props.selectedWeek / 4))
const currentMonthPlans = computed(() => {
  const plans = store.monthlyPlans[props.project.id] || []
  return plans.filter(p => p.month === currentMonth.value)
})

const loadData = async () => {
  isLoading.value = true
  await Promise.all([
    store.fetchActions(props.project.id),
    store.fetchMonthlyPlans(props.project.id)
  ])
  isLoading.value = false
}

// Watch for week changes to reload actions
watch(() => props.selectedWeek, () => {
  // Only reload actions as monthly plans are cached/fetched by project ID
  store.fetchActions(props.project.id)
})

onMounted(() => {
  loadData()
})

const handleAddAction = async () => {
  if (!newActionContent.value.trim()) return

  await store.addAction({
    project_id: props.project.id,
    week_number: props.selectedWeek,
    content: newActionContent.value
  })
  newActionContent.value = ''
}

const handleToggleAction = async (actionId: number, isCompleted: boolean) => {
  await store.toggleAction(actionId, isCompleted, props.project.id)
}

const handleDeleteAction = async (actionId: number) => {
  if (store.confirmDelete && !confirm('Are you sure you want to delete this action?')) {
    return
  }
  await store.deleteAction(actionId, props.project.id)
}
</script>

<template>
  <div class="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
    <!-- Project Header -->
    <div class="mb-6">
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-xl font-bold text-morandi-blue-light">{{ project.title }}</h3>
        <span v-if="project.deadline" class="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
          Due: {{ new Date(project.deadline).toLocaleDateString() }}
        </span>
      </div>
      <p class="text-gray-300 mb-2">{{ project.description }}</p>
      
      <!-- Monthly Plans Context -->
      <div v-if="currentMonthPlans.length > 0" class="mt-4 bg-morandi-blue/10 rounded-lg p-3 border border-morandi-blue/20">
        <div class="text-xs font-semibold text-morandi-blue mb-2 uppercase tracking-wide">
          Month {{ currentMonth }} Plans (w{{ (currentMonth - 1) * 4 + 1 }} ~ w{{ currentMonth * 4 }})
        </div>
        <div class="space-y-1">
          <div 
            v-for="plan in currentMonthPlans" 
            :key="plan.id" 
            class="text-sm flex items-start"
            :class="plan.is_primary ? 'text-morandi-gold font-medium' : 'text-gray-300'"
          >
            <PhStar v-if="plan.is_primary" weight="fill" class="mr-1.5 mt-0.5 flex-shrink-0" :size="14" />
            <span v-else class="w-4 mr-1.5"></span>
            {{ plan.content }}
          </div>
        </div>
      </div>
    </div>

    <!-- Weekly Actions -->
    <div>
      <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Week {{ selectedWeek }} Actions
      </h4>

      <div class="space-y-2 mb-4">
        <div 
          v-for="action in projectActions" 
          :key="action.id"
          class="flex items-center group bg-gray-900/30 p-2 rounded hover:bg-gray-900/50 transition-colors"
        >
          <button 
            @click="handleToggleAction(action.id, !action.is_completed)"
            class="flex-shrink-0 mr-3 w-5 h-5 rounded border border-gray-600 flex items-center justify-center transition-colors"
            :class="action.is_completed ? 'bg-morandi-green border-morandi-green text-gray-900' : 'hover:border-morandi-blue'"
          >
            <PhCheck v-if="action.is_completed" weight="bold" :size="12" />
          </button>
          
          <span 
            class="flex-grow text-sm transition-all duration-200"
            :class="action.is_completed ? 'text-gray-500 line-through' : 'text-gray-200'"
          >
            {{ action.content }}
          </span>

          <button 
            @click="handleDeleteAction(action.id)"
            class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
          >
            <PhTrash :size="16" />
          </button>
        </div>

        <div v-if="projectActions.length === 0 && !isLoading" class="text-gray-500 text-sm italic py-2">
          No actions planned for this week.
        </div>
      </div>

      <!-- Add Action Input -->
      <div class="relative">
        <input
          v-model="newActionContent"
          @keyup.enter="handleAddAction"
          type="text"
          placeholder="Add a new action..."
          class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-3 pr-10 text-sm text-gray-200 focus:outline-none focus:border-morandi-blue focus:ring-1 focus:ring-morandi-blue placeholder-gray-600 transition-all"
        />
        <button 
          @click="handleAddAction"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-morandi-blue transition-colors"
          :disabled="!newActionContent.trim()"
        >
          <PhPlus weight="bold" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>
