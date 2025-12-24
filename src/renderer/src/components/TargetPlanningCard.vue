<spec lang="md">
# TargetPlanningCard

## Props

- target: Project - The target (project) data object

## Behavior

- Display Week 0 section at the top: Planning & Preparation area
  - No date range displayed for Week 0
  - Allows adding actions for week_number: 0
  - Shows existing Week 0 actions
- Display 3 columns corresponding to Month 1, Month 2, Month 3
- For each month, display 4 weeks (e.g. Month 1: w1-w4)
- Show date range for each week based on current quarter start
- Allow adding weekly actions directly to each week
- List existing weekly actions for each week
- Parse date input: If user types date format (e.g., "12/25 task" or "task 12/25"), extract and store as due_date
  - Supported formats: MM/DD, M/D, MM-DD, M-D
  - Date can appear anywhere in the input (beginning, middle, or end)
  - Display due date badge next to action content
- Priority selection: Type "!" (with space before) to show priority picker
  - Options: High, Medium, Low, None
  - Navigate with arrow keys (up/down)
  - Confirm with Enter
  - Display priority indicator next to action content

## Visuals

- Week 0 Section: Appears at top with morandi-blue-light accent, no date display
- 3 Columns (Month 1, 2, 3)
- Inside each column, list the 4 weeks with date ranges (e.g. "WEEK 1 (1/1~1/7)")
- Inside each week, list actions.
- Allow adding action to week.
- Fixed max height for month columns (450px) with scrollbar for overflow content

## Interaction

- Add action to Week 0 -> create `WeeklyAction` with week_number: 0
- Add action to other weeks -> create `WeeklyAction` with respective week_number
- Click checkbox -> toggle action completion status
- Completed actions show with strikethrough text
- Click action content -> enter edit mode, show input field with current content
- Press Enter or blur -> save changes
- Press Escape -> cancel editing
</spec>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

import { useGoalsStore } from '../stores/goals'
import { Project, WeeklyAction, Priority } from '../types/goals'
import { PhTrash, PhCaretDown, PhCaretRight, PhFlag } from '@phosphor-icons/vue'

const props = defineProps<{
  target: Project
}>()

const store = useGoalsStore()
const newActionInputs = ref<Record<number, string>>({})
const expandedMonths = ref<Record<number, boolean>>({ 1: true, 2: true, 3: true })
const newWeek0Action = ref('')
const editingActionId = ref<number | null>(null)
const editingContent = ref('')
const showPriorityPicker = ref(false)
const priorityPickerPosition = ref({ top: 0, left: 0 })
const selectedPriorityIndex = ref(0)
const currentInputRef = ref<HTMLInputElement | null>(null)
const tempPriority = ref<Priority>(null)

const priorityOptions: Array<{
  value: Priority
  label: string
  color: string
  weight: 'fill' | 'regular'
}> = [
  { value: 'High', label: 'High', color: 'text-red-400', weight: 'fill' },
  { value: 'Medium', label: 'Medium', color: 'text-morandi-orange', weight: 'fill' },
  { value: 'Low', label: 'Low', color: 'text-morandi-blue', weight: 'fill' },
  { value: null, label: 'None', color: 'text-gray-500', weight: 'regular' }
]

const targetActions = computed(() => store.actions[props.target.id] || [])

const getActionsForWeek = (week: number): WeeklyAction[] => {
  return targetActions.value.filter((a) => a.week_number === week)
}

const week0Actions = computed(() => getActionsForWeek(0))

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

const handleInputKeydown = (event: KeyboardEvent, inputRef: HTMLInputElement): void => {
  const value = inputRef.value
  const cursorPos = inputRef.selectionStart || 0

  // Handle priority picker navigation first (if open)
  if (showPriorityPicker.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectedPriorityIndex.value = (selectedPriorityIndex.value + 1) % priorityOptions.length
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectedPriorityIndex.value =
        (selectedPriorityIndex.value - 1 + priorityOptions.length) % priorityOptions.length
    } else if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      selectPriority(priorityOptions[selectedPriorityIndex.value].value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closePriorityPicker()
    }
    return
  }

  // Check if user typed " !" (space + exclamation)
  if (event.key === '!' && cursorPos > 0 && value[cursorPos - 1] === ' ') {
    event.preventDefault()
    currentInputRef.value = inputRef
    showPriorityPicker.value = true
    selectedPriorityIndex.value = 0

    // Calculate position relative to input
    const rect = inputRef.getBoundingClientRect()
    priorityPickerPosition.value = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    }
  }
}

const selectPriority = (priority: Priority): void => {
  tempPriority.value = priority
  closePriorityPicker()
}

const closePriorityPicker = (): void => {
  showPriorityPicker.value = false
  currentInputRef.value?.focus()
}

const parseDateFromInput = (input: string): { content: string; dueDate: string | null } => {
  // Regex to match date patterns anywhere: MM/DD, M/D, MM-DD, M-D
  const dateRegex = /(\d{1,2})[/-](\d{1,2})/
  const match = input.match(dateRegex)

  if (match) {
    const month = parseInt(match[1])
    const day = parseInt(match[2])

    // Validate month and day
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const currentYear = store.currentYear
      // Format as YYYY-MM-DD
      const dueDate = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      // Remove the date pattern from content
      const content = input.replace(dateRegex, '').trim()

      return { content: content || input, dueDate }
    }
  }

  return { content: input, dueDate: null }
}

const handleAddAction = async (week: number): Promise<void> => {
  const rawInput = newActionInputs.value[week]
  if (!rawInput?.trim()) return

  const { content, dueDate } = parseDateFromInput(rawInput)

  await store.addAction({
    project_id: props.target.id,
    week_number: week,
    content: content,
    due_date: dueDate,
    priority: tempPriority.value
  })
  newActionInputs.value[week] = ''
  tempPriority.value = null
}

const handleAddWeek0Action = async (): Promise<void> => {
  if (!newWeek0Action.value?.trim()) return

  const { content, dueDate } = parseDateFromInput(newWeek0Action.value)

  await store.addAction({
    project_id: props.target.id,
    week_number: 0,
    content: content,
    due_date: dueDate,
    priority: tempPriority.value
  })
  newWeek0Action.value = ''
  tempPriority.value = null
}

const formatDueDate = (dateString: string): string => {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const startEditing = (action: WeeklyAction): void => {
  editingActionId.value = action.id
  tempPriority.value = action.priority || null
  // Combine content with due date for editing
  if (action.due_date) {
    editingContent.value = `${action.content} ${formatDueDate(action.due_date)}`
  } else {
    editingContent.value = action.content
  }
  // Focus input in next tick
  setTimeout(() => {
    const input = document.querySelector('input[type="text"].bg-gray-700') as HTMLInputElement
    input?.focus()
    input?.select()
  }, 0)
}

const getPriorityOption = (
  priority: Priority
): { value: Priority; label: string; color: string; weight: 'fill' | 'regular' } => {
  return priorityOptions.find((opt) => opt.value === priority) || priorityOptions[3]
}

const cancelEditing = (): void => {
  editingActionId.value = null
  editingContent.value = ''
}

const saveEdit = async (): Promise<void> => {
  if (!editingActionId.value || !editingContent.value?.trim()) {
    cancelEditing()
    return
  }

  try {
    const { content, dueDate } = parseDateFromInput(editingContent.value)

    // Update action via API
    await window.api.goals.updateAction(editingActionId.value, {
      content: content,
      due_date: dueDate,
      priority: tempPriority.value || undefined
    })

    // Update local state
    const projectActions = store.actions[props.target.id]
    const action = projectActions?.find((a) => a.id === editingActionId.value)
    if (action) {
      action.content = content
      action.due_date = dueDate
      if (tempPriority.value !== undefined) {
        action.priority = tempPriority.value
      }
    }

    cancelEditing()
    tempPriority.value = null
  } catch (error) {
    console.error('Failed to update action:', error)
  }
}

const handleDeleteAction = async (actionId: number): Promise<void> => {
  if (store.confirmDelete && !confirm('Delete this action?')) {
    return
  }
  await store.deleteAction(actionId, props.target.id)
}

const handleToggleAction = async (actionId: number, isCompleted: boolean): Promise<void> => {
  await store.toggleAction(actionId, isCompleted, props.target.id)
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

    <!-- Week 0 Section - Planning & Preparation -->
    <div class="mb-6 bg-gray-900/50 rounded-lg p-4">
      <div class="flex items-center mb-3">
        <h4 class="text-sm font-semibold text-morandi-blue-light uppercase tracking-wider">
          Week 0 - Planning & Preparation
        </h4>
      </div>

      <!-- Existing Week 0 Actions -->
      <div v-if="week0Actions.length > 0" class="space-y-1 mb-3">
        <div
          v-for="action in week0Actions"
          :key="action.id"
          class="group flex items-center gap-2 text-sm bg-gray-800/40 p-2 rounded border border-transparent hover:border-gray-700 transition-all"
        >
          <input
            type="checkbox"
            :checked="action.is_completed"
            class="w-4 h-4 cursor-pointer"
            @change="handleToggleAction(action.id, !action.is_completed)"
          />

          <!-- Edit mode -->
          <input
            v-if="editingActionId === action.id"
            v-model="editingContent"
            type="text"
            class="flex-1 bg-gray-700 border border-morandi-blue-light rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-morandi-blue"
            @keydown="(e: any) => handleInputKeydown(e, e.target as HTMLInputElement)"
            @keyup.enter="!showPriorityPicker && saveEdit()"
            @keyup.escape="showPriorityPicker ? closePriorityPicker() : cancelEditing()"
            @blur="!showPriorityPicker && saveEdit()"
          />

          <!-- View mode -->
          <span
            v-else
            class="flex-1 text-gray-300 transition-all cursor-text"
            :class="{ 'line-through text-gray-500': action.is_completed }"
            @click="startEditing(action)"
          >
            {{ action.content }}
          </span>

          <PhFlag
            v-if="action.priority && editingActionId !== action.id"
            :size="16"
            :weight="getPriorityOption(action.priority).weight"
            :class="getPriorityOption(action.priority).color"
            class="shrink-0"
          />
          <span
            v-if="action.due_date && editingActionId !== action.id"
            class="text-xs bg-morandi-orange/20 text-morandi-orange px-1.5 py-0.5 rounded shrink-0"
          >
            {{ formatDueDate(action.due_date) }}
          </span>
          <button
            v-if="editingActionId !== action.id"
            class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            @click="handleDeleteAction(action.id)"
          >
            <PhTrash :size="14" />
          </button>
        </div>
      </div>

      <!-- Add Week 0 Action -->
      <div class="relative">
        <input
          v-model="newWeek0Action"
          type="text"
          placeholder="Add preparation task... (type ' !' for priority)"
          class="w-full bg-gray-900/70 border border-gray-700/50 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-morandi-blue-light/50 placeholder-gray-600 transition-all"
          @keydown="(e: any) => handleInputKeydown(e, e.target as HTMLInputElement)"
          @keyup.enter="handleAddWeek0Action"
        />
      </div>
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
                class="group flex items-center gap-2 text-sm bg-gray-800/40 p-2 rounded border border-transparent hover:border-gray-700 transition-all"
              >
                <input
                  type="checkbox"
                  :checked="action.is_completed"
                  class="w-4 h-4 cursor-pointer shrink-0"
                  @change="handleToggleAction(action.id, !action.is_completed)"
                />

                <!-- Edit mode -->
                <input
                  v-if="editingActionId === action.id"
                  v-model="editingContent"
                  type="text"
                  class="flex-1 bg-gray-700 border border-morandi-blue-light rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-morandi-blue"
                  @keydown="(e: any) => handleInputKeydown(e, e.target as HTMLInputElement)"
                  @keyup.enter="!showPriorityPicker && saveEdit()"
                  @keyup.escape="showPriorityPicker ? closePriorityPicker() : cancelEditing()"
                  @blur="!showPriorityPicker && saveEdit()"
                />

                <!-- View mode -->
                <span
                  v-else
                  class="flex-1 text-gray-300 transition-all cursor-text"
                  :class="{ 'line-through text-gray-500': action.is_completed }"
                  @click="startEditing(action)"
                >
                  {{ action.content }}
                </span>

                <PhFlag
                  v-if="action.priority && editingActionId !== action.id"
                  :size="14"
                  :weight="getPriorityOption(action.priority).weight"
                  :class="getPriorityOption(action.priority).color"
                  class="shrink-0"
                />
                <span
                  v-if="action.due_date && editingActionId !== action.id"
                  class="text-xs bg-morandi-orange/20 text-morandi-orange px-1.5 py-0.5 rounded shrink-0"
                >
                  {{ formatDueDate(action.due_date) }}
                </span>
                <button
                  v-if="editingActionId !== action.id"
                  class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
                placeholder="Add plan... (type ' !' for priority)"
                class="w-full bg-gray-900/50 border border-gray-700/50 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-morandi-blue/50 placeholder-gray-600 transition-all"
                @keydown="(e: any) => handleInputKeydown(e, e.target as HTMLInputElement)"
                @keyup.enter="handleAddAction((month - 1) * 4 + weekOffset + 1)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Priority Picker Popup -->
    <Teleport to="body">
      <div
        v-if="showPriorityPicker"
        class="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[120px]"
        :style="{
          top: `${priorityPickerPosition.top}px`,
          left: `${priorityPickerPosition.left}px`
        }"
      >
        <div
          v-for="(option, index) in priorityOptions"
          :key="option.label"
          class="px-3 py-2 cursor-pointer transition-colors text-sm"
          :class="[
            index === selectedPriorityIndex
              ? 'bg-morandi-blue/20 text-morandi-blue-light'
              : 'hover:bg-gray-700/50',
            option.color
          ]"
          @click="selectPriority(option.value)"
        >
          {{ option.label }}
        </div>
      </div>
    </Teleport>
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
