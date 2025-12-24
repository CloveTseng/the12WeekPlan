<spec lang="md">
# Settings View
## Behavior
- Display application settings
- "Delete Confirmation" switch:
  - Toggle `store.confirmDelete`
  - Default: true
  - If true: Deleting an action requires confirmation
  - If false: Deleting an action happens immediately
- "Current Plan" settings:
  - Display current plan Title, Start Date, End Date
  - Allow editing Title and Start Date
  - End Date is automatically calculated (Start Date + 12 weeks)
  - "Save Changes" button to update current cycle
- "Start New Cycle":
  - Button to create a new cycle
  - Opens a dialog/form to enter details for the new cycle
  - On confirm, creates new cycle and sets it as active

## Visuals
- Simple list of settings
- Plan Settings section with inputs
- Toggle switch component (custom or standard checkbox styled)
- Primary button for "Start New Cycle"

## Interaction
- Click switch -> toggle value
- Change Start Date -> Update End Date automatically
- Click Save -> Update current cycle
- Click Start New Cycle -> Create new cycle
</spec>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useGoalsStore } from '../stores/goals'
import { PhToggleLeft, PhToggleRight, PhFloppyDisk, PhPlus } from '@phosphor-icons/vue'

const store = useGoalsStore()

const cycleForm = ref({
  title: '',
  start_date: '',
  end_date: ''
})

const isNewCycleMode = ref(false)
const newCycleForm = ref({
  title: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: ''
})

onMounted(async () => {
  await store.fetchCurrentCycle()
  if (store.currentCycle) {
    cycleForm.value = {
      title: store.currentCycle.title,
      start_date: store.currentCycle.start_date,
      end_date: store.currentCycle.end_date
    }
  }
})

// Watch for changes in store's current cycle to update form
watch(() => store.currentCycle, (newVal) => {
  if (newVal) {
    cycleForm.value = {
      title: newVal.title,
      start_date: newVal.start_date,
      end_date: newVal.end_date
    }
  }
}, { deep: true })

const calculateEndDate = (startDate: string) => {
  if (!startDate) return ''
  const date = new Date(startDate)
  // Add 12 weeks (84 days)
  // Adjust for timezone offset to avoid date shifting
  const userTimezoneOffset = date.getTimezoneOffset() * 60000
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset)

  adjustedDate.setDate(adjustedDate.getDate() + 84 - 1) // 12 weeks - 1 day (inclusive)
  return adjustedDate.toISOString().split('T')[0]
}

// Watch start_date to auto-calculate end_date for Current Cycle Form
watch(() => cycleForm.value.start_date, (newDate) => {
  if (newDate) {
    cycleForm.value.end_date = calculateEndDate(newDate)
  }
})

// Watch start_date to auto-calculate end_date for New Cycle Form
watch(() => newCycleForm.value.start_date, (newDate) => {
  if (newDate) {
    newCycleForm.value.end_date = calculateEndDate(newDate)
  }
}, { immediate: true })

const handleUpdateCycle = async () => {
  if (!store.currentCycle) return
  try {
    await store.updateCycle({
      id: store.currentCycle.id,
      ...cycleForm.value
    })
    // Optional: show success notification
  } catch (error) {
    console.error('Failed to update cycle', error)
  }
}

const handleCreateCycle = async () => {
  try {
    await store.createCycle(newCycleForm.value)
    isNewCycleMode.value = false
    // Reset form
    newCycleForm.value = {
      title: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    }
  } catch (error) {
    console.error('Failed to create cycle', error)
  }
}
</script>

<template>
  <div class="h-full flex flex-col p-8 overflow-hidden overflow-y-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-morandi-blue-light mb-2">Settings</h1>
      <p class="text-gray-400">Application preferences</p>
    </div>

    <div class="max-w-3xl space-y-8">
      <!-- Current Plan Settings -->
      <section v-if="store.currentCycle && !isNewCycleMode">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-200">Settings Cycle</h2>
          <button
            @click="isNewCycleMode = true"
            class="flex items-center gap-2 px-3 py-1.5 text-sm bg-morandi-blue/10 text-morandi-blue hover:bg-morandi-blue/20 rounded-md transition-colors"
          >
            <PhPlus :size="16" />
            Start New Cycle
          </button>
        </div>

        <div class="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50 space-y-4">
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Plan Title</label>
              <input
                v-model="cycleForm.title"
                type="text"
                class="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-morandi-blue"
                placeholder="e.g. 2024 Q1"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                <input
                  v-model="cycleForm.start_date"
                  type="date"
                  class="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-morandi-blue"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">End Date (Calculated)</label>
                <input
                  v-model="cycleForm.end_date"
                  type="date"
                  disabled
                  class="w-full bg-gray-900/50 border border-gray-700/50 rounded-md px-3 py-2 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              @click="handleUpdateCycle"
              class="flex items-center gap-2 px-4 py-2 bg-morandi-blue text-white rounded-md hover:bg-morandi-blue-light transition-colors"
            >
              <PhFloppyDisk :size="18" />
              Save Changes
            </button>
          </div>
        </div>
      </section>

      <!-- New Cycle Form -->
      <section v-if="!store.currentCycle || isNewCycleMode">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-200">
            {{ store.currentCycle ? 'Start New Cycle' : 'Settings Cycle' }}
          </h2>
          <button
            v-if="store.currentCycle"
            @click="isNewCycleMode = false"
            class="text-sm text-gray-400 hover:text-gray-200"
          >
            Cancel
          </button>
        </div>

        <div class="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50 space-y-4">
          <div v-if="store.currentCycle" class="p-3 bg-amber-900/20 text-amber-200 rounded text-sm mb-2">
            Starting a new cycle will archive the current one.
          </div>

          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Plan Title</label>
              <input
                v-model="newCycleForm.title"
                type="text"
                class="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-morandi-blue"
                placeholder="e.g. 2025 Q1"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                <input
                  v-model="newCycleForm.start_date"
                  type="date"
                  class="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:border-morandi-blue"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">End Date (Calculated)</label>
                <input
                  v-model="newCycleForm.end_date"
                  type="date"
                  disabled
                  class="w-full bg-gray-900/50 border border-gray-700/50 rounded-md px-3 py-2 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              @click="handleCreateCycle"
              class="flex items-center gap-2 px-4 py-2 bg-morandi-blue text-white rounded-md hover:bg-morandi-blue-light transition-colors"
            >
              <PhPlus :size="18" />
              Start Cycle
            </button>
          </div>
        </div>
      </section>

      <!-- General Settings -->
      <section>
        <h2 class="text-xl font-semibold text-gray-200 mb-4">General</h2>
        <div class="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-medium text-gray-200">Confirm Deletion</h3>
              <p class="text-sm text-gray-500 mt-1">Ask for confirmation before deleting items</p>
            </div>

            <button
              @click="store.confirmDelete = !store.confirmDelete"
              class="text-morandi-blue hover:text-morandi-blue-light transition-colors focus:outline-none"
            >
              <component
                :is="store.confirmDelete ? PhToggleRight : PhToggleLeft"
                :weight="store.confirmDelete ? 'fill' : 'regular'"
                :size="36"
                :class="store.confirmDelete ? 'text-morandi-blue' : 'text-gray-600'"
              />
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

