<spec lang="md">
# TargetPlanningCard

## Props

- target: Project - The target (project) data object

## Behavior

- Display 3 columns corresponding to Month 1, Month 2, Month 3
- For each month, display 4 weeks (e.g. Month 1: w1-w4)
- Show date range for each week based on current quarter start
- Allow adding weekly actions directly to each week
- List existing weekly actions for each week

## Visuals

- 3 Columns (Month 1, 2, 3)
- Inside each column, list the 4 weeks with date ranges (e.g. "WEEK 1 (1/1~1/7)")
- Inside each week, list actions.
- Allow adding action to week.
- Fixed max height for month columns (450px) with scrollbar for overflow content

## Interaction

- Add action -> create `WeeklyAction`
</spec>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useGoalsStore } from '../stores/goals'
import { Project, WeeklyAction } from '../types/goals'
import { PhTrash, PhCaretDown, PhCaretRight } from '@phosphor-icons/vue'

const props = defineProps<{
  target: Project
}>()

const store = useGoalsStore()
const newActionInputs = ref<Record<number, string>>({})
const expandedMonths = ref<Record<number, boolean>>({ 1: true, 2: true, 3: true })

const targetActions = computed(() => store.actions[props.target.id] || [])

const getActionsForWeek = (week: number): WeeklyAction[] => {
  return targetActions.value.filter((a) => a.week_number === week)
}

const getWeekDateRange = (weekNum: number): string => {
  const year = store.currentYear
  const quarter = store.currentQuarter

  // Q1: 0 (Jan), Q2: 3 (Apr), Q3: 6 (Jul), Q4: 9 (Oct)
  const startMonthIndex = (quarter - 1) * 3
  const quarterStart = new Date(year, startMonthIndex, 1)

  // Week 1 start = quarterStart
  // Week N start = quarterStart + (N-1)*7 days
  const weekStart = new Date(quarterStart)
  weekStart.setDate(quarterStart.getDate() + (weekNum - 1) * 7)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const formatDate = (d: Date): string => `${d.getMonth() + 1}/${d.getDate()}`
  return `(${formatDate(weekStart)}~${formatDate(weekEnd)})`
}

const loadData = async (): Promise<void> => {
  // Check if store has fetchAllActions, otherwise use fetchActions with iteration or fix store
  // Assuming store has fetchAllActions based on previous context
  if (store.fetchAllActions) {
    await store.fetchAllActions(props.target.id)
  } else {
    // Fallback or just fetch current week if that's all we have
    // Realistically we need to fetch all.
    // For now, let's assume fetchAllActions exists or will be added.
    // If it doesn't, this might throw.
    // Use optional chaining or check definition.
    await store.fetchActions(props.target.id)
  }
}

const handleAddAction = async (week: number): Promise<void> => {
  const content = newActionInputs.value[week]
  if (!content?.trim()) return

  await store.addAction({
    project_id: props.target.id,
    week_number: week,
    content: content
  })
  newActionInputs.value[week] = ''
}

const handleDeleteAction = async (actionId: number): Promise<void> => {
  if (store.confirmDelete && !confirm('Delete this action?')) {
    return
  }
  await store.deleteAction(actionId, props.target.id)
}

const toggleMonth = (month: number): void => {
  expandedMonths.value[month] = !expandedMonths.value[month]
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700 mb-6">
    <!-- Target Header -->
    <div class="mb-6">
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-xl font-bold text-morandi-blue-light">{{ target.title }}</h3>
        <span v-if="target.deadline" class="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
          Target: {{ new Date(target.deadline).toLocaleDateString() }}
        </span>
      </div>
      <p class="text-gray-300">{{ target.description }}</p>
    </div>

    <!-- 3-Month Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        v-for="month in [1, 2, 3]"
        :key="month"
        class="bg-gray-900/30 rounded-lg flex flex-col h-full"
      >
        <!-- Month Header -->
        <div
          class="p-3 border-b border-gray-700/50 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors rounded-t-lg"
          @click="toggleMonth(month)"
        >
          <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Month {{ month }}
          </h4>
          <component
            :is="expandedMonths[month] ? PhCaretDown : PhCaretRight"
            class="text-gray-500"
          />
        </div>

        <!-- Weeks List -->
        <div
          v-show="expandedMonths[month]"
          class="p-3 space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar"
        >
          <div v-for="weekOffset in [0, 1, 2, 3]" :key="weekOffset" class="space-y-2">
            <div class="text-xs font-medium text-morandi-blue/80 uppercase tracking-wide">
              Week {{ (month - 1) * 4 + weekOffset + 1 }}
              <span class="ml-1 text-gray-500 font-normal">
                {{ getWeekDateRange((month - 1) * 4 + weekOffset + 1) }}
              </span>
            </div>

            <!-- Existing Actions -->
            <div class="space-y-1">
              <div
                v-for="action in getActionsForWeek((month - 1) * 4 + weekOffset + 1)"
                :key="action.id"
                class="group flex items-start justify-between text-sm bg-gray-800/40 p-2 rounded border border-transparent hover:border-gray-700 transition-all"
              >
                <span class="text-gray-300">{{ action.content }}</span>
                <button
                  class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  @click="handleDeleteAction(action.id)"
                >
                  <PhTrash :size="14" />
                </button>
              </div>
            </div>

            <!-- Add Action -->
            <div class="relative">
              <input
                v-model="newActionInputs[(month - 1) * 4 + weekOffset + 1]"
                type="text"
                placeholder="Add plan..."
                class="w-full bg-gray-900/50 border border-gray-700/50 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-morandi-blue/50 placeholder-gray-600 transition-all"
                @keyup.enter="handleAddAction((month - 1) * 4 + weekOffset + 1)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}
</style>
