<spec lang="md">
# Settings View

## Behavior

- Display application settings
- "Current Cycle" Management:
  - Load `store.currentCycle` on mount
  - If cycle exists:
    - Inputs for Title, Start Date
    - Read-only End Date (calculated from Start Date + 12 weeks)
    - "Save Changes" button updates the cycle via `store.updateCycle`
  - "Start New Cycle":
    - Button to open creation form
    - Inputs: Title, Start Date
    - End Date calculated automatically
    - "Start Cycle" button calls `store.createCycle`
    - Creating new cycle sets it as active
- "Delete Confirmation" switch:
  - Toggle `store.confirmDelete`
  - Default: true

## Visuals

- Sections with headers
- Input fields with labels (morandi-blue focused state)
- Date inputs standard HTML date picker styled with Tailwind
- Buttons: Primary (morandi-blue), Secondary (gray)
- Design Token: text-morandi-blue-light, border-gray-800
</spec>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGoalsStore } from '../stores/goals'
import { PhToggleLeft, PhToggleRight, PhCalendarPlus, PhArrowsClockwise } from '@phosphor-icons/vue'

const store = useGoalsStore()

// Local state for forms
const editMode = ref(false)
const newCycleMode = ref(false)

const formTitle = ref('')
const formStartDate = ref('')
const formEndDate = computed(() => {
  if (!formStartDate.value) return ''
  const date = new Date(formStartDate.value)
  date.setDate(date.getDate() + 84) // 12 weeks * 7 days
  return date.toISOString().split('T')[0]
})

const initForm = (): void => {
  if (store.currentCycle) {
    formTitle.value = store.currentCycle.title
    formStartDate.value = store.currentCycle.start_date
  } else {
    // Default for new cycle
    formTitle.value = `12 Week Year ${new Date().getFullYear()}`
    formStartDate.value = new Date().toISOString().split('T')[0]
  }
}

onMounted(async () => {
  await store.fetchCurrentCycle()
  // If no active cycle exists, default to "New Cycle" mode
  if (!store.currentCycle) {
    newCycleMode.value = true
  }
  initForm()
})

watch(
  () => store.currentCycle,
  () => {
    if (!editMode.value && !newCycleMode.value) {
      initForm()
    }
  }
)

const handleUpdate = async (): Promise<void> => {
  if (!store.currentCycle) return
  await store.updateCycle({
    id: store.currentCycle.id,
    title: formTitle.value,
    start_date: formStartDate.value,
    end_date: formEndDate.value
  })
  alert('Cycle updated successfully')
}

const handleCreate = async (): Promise<void> => {
  await store.createCycle({
    title: formTitle.value,
    start_date: formStartDate.value,
    end_date: formEndDate.value,
    is_active: true
  })
  newCycleMode.value = false
  initForm()
  alert('New cycle started successfully')
}

const startNewCycle = (): void => {
  newCycleMode.value = true
  formTitle.value = `My 12 Week Year - ${new Date().toLocaleDateString()}`
  formStartDate.value = new Date().toISOString().split('T')[0]
}

const cancelNewCycle = (): void => {
  newCycleMode.value = false
  initForm()
}
</script>

<template>
  <div class="h-full flex flex-col p-8 overflow-y-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-morandi-blue-light mb-2">Settings</h1>
      <p class="text-gray-400">Application preferences & Cycle Management</p>
    </div>

    <div class="max-w-3xl space-y-8">
      <!-- Cycle Management -->
      <section>
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
          <h2 class="text-xl font-semibold text-gray-200">Cycle Management</h2>
          <button
            v-if="!newCycleMode"
            class="flex items-center gap-2 px-3 py-1.5 text-sm bg-morandi-blue/10 text-morandi-blue hover:bg-morandi-blue/20 rounded transition-colors"
            @click="startNewCycle"
          >
            <PhArrowsClockwise :size="16" />
            Start New Cycle
          </button>
        </div>

        <div class="bg-gray-800/30 rounded-lg p-6 border border-gray-800">
          <h3 class="text-lg font-medium text-gray-200 mb-4">
            {{ newCycleMode ? 'Start New 12 Week Cycle' : 'Current Cycle Settings' }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Plan Title</label>
              <input
                v-model="formTitle"
                type="text"
                class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200 focus:border-morandi-blue focus:ring-1 focus:ring-morandi-blue outline-none transition-colors"
                placeholder="e.g. Winter 2025 Sprint"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                <input
                  v-model="formStartDate"
                  type="date"
                  class="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-200 focus:border-morandi-blue focus:ring-1 focus:ring-morandi-blue outline-none transition-colors"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">
                  End Date (Calculated)
                </label>
                <input
                  :value="formEndDate"
                  type="date"
                  readonly
                  class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div class="pt-4 flex justify-end gap-3">
              <button
                v-if="newCycleMode && store.currentCycle"
                class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                @click="cancelNewCycle"
              >
                Cancel
              </button>

              <button
                class="flex items-center gap-2 px-4 py-2 bg-morandi-blue text-white rounded hover:bg-morandi-blue-light transition-colors"
                @click="newCycleMode ? handleCreate() : handleUpdate()"
              >
                <PhCalendarPlus v-if="newCycleMode" :size="18" />
                {{ newCycleMode ? 'Start Cycle' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- General Settings -->
      <section>
        <h2 class="text-xl font-semibold text-gray-200 mb-4 pb-2 border-b border-gray-800">
          General
        </h2>
        <div class="flex items-center justify-between py-4">
          <div>
            <h3 class="text-base font-medium text-gray-200">Confirm Deletion</h3>
            <p class="text-sm text-gray-500 mt-1">Ask for confirmation before deleting items</p>
          </div>

          <button
            class="text-morandi-blue hover:text-morandi-blue-light transition-colors focus:outline-none"
            @click="store.confirmDelete = !store.confirmDelete"
          >
            <component
              :is="store.confirmDelete ? PhToggleRight : PhToggleLeft"
              :weight="store.confirmDelete ? 'fill' : 'regular'"
              :size="36"
              :class="store.confirmDelete ? 'text-morandi-blue' : 'text-gray-600'"
            />
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
