        <spec lang="md">
# GoalsStrategy View (Renamed to Strategy View)
## Behavior
- Display header "Strategic Planning"
- Display list of Targets using TargetPlanningCard
- Button to "Add Target"
  - Opens a modal or form to create a target
  - Fields: Title, Description, Deadline

## Visuals
- Layout: Header, Week Selector bar, Grid of ProjectCards
- Week Selector: Horizontal scrollable or wrapped list of pills/tabs
- Add Project Modal: Centered, dark theme

## Interaction
- Select week -> update `store.currentWeek`
- Click Add Project -> Show modal
- Submit Modal -> Create project -> Close modal
</spec>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useGoalsStore } from '../stores/goals'
import TargetPlanningCard from '../components/TargetPlanningCard.vue'
import { PhPlus, PhX, PhSpinner } from '@phosphor-icons/vue'

const store = useGoalsStore()
const showAddModal = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

const newProject = ref({
  title: '',
  description: '',
  tactics: '',
  deadline: ''
})

onMounted(async () => {
  await store.fetchCurrentCycle()
  await store.fetchProjects()
})

const weeks = Array.from({ length: 12 }, (_, i) => i + 1)

const handleCreateProject = async () => {
  console.log('Attempting to create project', newProject.value)
  if (!newProject.value.title) {
    console.warn('Project title is missing')
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await store.addProject({
      ...newProject.value,
      year: store.currentYear,
      quarter: store.currentQuarter
    })
    console.log('Project created successfully')

    // Reset and close
    newProject.value = { title: '', description: '', tactics: '', deadline: '' }
    showAddModal.value = false
  } catch (error) {
    console.error('Failed to create project:', error)
    errorMessage.value = `Failed to create project: ${error instanceof Error ? error.message : String(error)}`
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col p-8 overflow-hidden">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-morandi-blue-light mb-2">Strategic Planning</h1>
        <p class="text-gray-400">
          {{ store.currentCycle?.title || `Q${store.currentQuarter} ${store.currentYear}` }} Core Targets & Monthly Plans
        </p>
      </div>
      <button 
        @click="showAddModal = true"
        class="bg-morandi-blue hover:bg-morandi-blue-dark text-gray-900 font-semibold py-2 px-4 rounded-lg flex items-center transition-colors"
      >
        <PhPlus weight="bold" class="mr-2" />
        Add Target
      </button>
    </div>

    <!-- Note: Week Selector is less relevant here if this view is purely for Monthly Planning (Target Strategy).
         However, the user might still want to see where they are. 
         But this view is about "Target -> Monthly Plan", so week selection might be distracting or just informational.
         Let's keep it minimal or remove it to focus on Monthly View. 
         Actually, the previous design had it. Let's keep it but maybe we don't need it to filter the monthly plans (as they are monthly).
         The week selector was mainly for ProjectCard to show weekly actions. 
         TargetPlanningCard shows Month 1, 2, 3 so it doesn't depend on selected week. 
         I will remove the Week Selector from this view to reduce clutter and focus on the Quarter/Month level.
    -->

    <!-- Projects (Targets) Grid -->
    <div class="flex-grow overflow-y-auto pr-2 -mr-2">
      <div v-if="store.projects.length === 0" class="h-64 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
        <p class="mb-4">No targets defined for this quarter.</p>
        <button 
          @click="showAddModal = true"
          class="text-morandi-blue hover:underline"
        >
          Create your first target
        </button>
      </div>

      <div v-else class="pb-8">
        <TargetPlanningCard
          v-for="project in store.projects"
          :key="project.id"
          :target="project"
        />
      </div>
    </div>

    <!-- Add Project Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-700 p-6 relative">
        <button 
          @click="showAddModal = false"
          class="absolute right-4 top-4 text-gray-500 hover:text-gray-200 transition-colors"
          :disabled="isSubmitting"
        >
          <PhX :size="20" />
        </button>

        <h2 class="text-2xl font-bold text-gray-100 mb-6">New Core Target</h2>

        <form @submit.prevent="handleCreateProject" class="space-y-4">
          <div v-if="errorMessage" class="text-red-400 text-sm bg-red-900/20 p-2 rounded">
            {{ errorMessage }}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Target Title</label>
            <input 
              v-model="newProject.title"
              type="text" 
              required
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-morandi-blue focus:ring-1 focus:ring-morandi-blue outline-none transition-colors"
              placeholder="e.g. Achieve $10k MRR"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea 
              v-model="newProject.description"
              rows="2"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-morandi-blue focus:ring-1 focus:ring-morandi-blue outline-none transition-colors"
              placeholder="What is the outcome?"
            ></textarea>
          </div>

          <!-- Tactics removed from creation as per request -->

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">Deadline <span class="text-gray-500 font-normal">(Optional)</span></label>
            <input 
              v-model="newProject.deadline"
              type="date" 
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-morandi-blue focus:ring-1 focus:ring-morandi-blue outline-none transition-colors"
            />
          </div>

          <div class="flex justify-end space-x-3 mt-8">
            <button 
              type="button" 
              @click="showAddModal = false"
              class="px-4 py-2 text-gray-400 hover:text-gray-200 font-medium transition-colors"
              :disabled="isSubmitting"
            >
              Cancel
            </button>
            <button 
              type="submit"
              class="bg-morandi-blue hover:bg-morandi-blue-dark text-gray-900 px-6 py-2 rounded-lg font-semibold shadow-lg shadow-morandi-blue/20 transition-all transform flex items-center"
              :class="isSubmitting || !newProject.title ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'"
              :disabled="isSubmitting || !newProject.title"
            >
              <PhSpinner v-if="isSubmitting" class="animate-spin mr-2" :size="20" />
              {{ isSubmitting ? 'Creating...' : 'Create Target' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
