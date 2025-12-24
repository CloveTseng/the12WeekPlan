<spec lang="md">
# GoalsStrategy View (Renamed to Strategy View)

## Behavior

- Display header "Strategic Planning"
- Display list of Targets using TargetPlanningCard
  - Each target card includes its own Week 0 section for planning and preparation
- Button to "Add Target"
  - Opens a modal or form to create a target
  - Fields: Title, Description, Deadline

## Visuals

- Layout: Header, Grid of TargetPlanningCards
- Add Project Modal: Centered, dark theme

## Interaction

- Click Add Project -> Show modal
- Submit Modal -> Create project -> Close modal
</spec>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

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

const handleCreateProject = async (): Promise<void> => {
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
        <h1 class="text-3xl font-bold text-morandi-blue-light mb-2">
          {{ store.currentCycle?.title || 'Strategic Planning' }}
        </h1>
        <p class="text-gray-400">
          <span v-if="!store.currentCycle">Q{{ store.currentQuarter }} {{ store.currentYear }} </span>
          Core Targets & Monthly Plans
        </p>
      </div>
      <button
        class="bg-morandi-blue hover:bg-morandi-blue-dark text-gray-900 font-semibold py-2 px-4 rounded-lg flex items-center transition-colors"
        @click="showAddModal = true"
      >
        <PhPlus weight="bold" class="mr-2" />
        Add Target
      </button>
    </div>

    <!-- Projects (Targets) Grid -->
    <div class="grow overflow-y-auto pr-2 -mr-2">
      <div
        v-if="store.projects.length === 0"
        class="h-64 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl"
      >
        <p class="mb-4">No targets defined for this quarter.</p>
        <button class="text-morandi-blue hover:underline" @click="showAddModal = true">
          Create your first target
        </button>
      </div>

      <div v-else class="pb-8">
        <TargetPlanningCard v-for="project in store.projects" :key="project.id" :target="project" />
      </div>
    </div>

    <!-- Add Project Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-700 p-6 relative"
      >
        <button
          class="absolute right-4 top-4 text-gray-500 hover:text-gray-200 transition-colors"
          :disabled="isSubmitting"
          @click="showAddModal = false"
        >
          <PhX :size="20" />
        </button>

        <h2 class="text-2xl font-bold text-gray-100 mb-6">New Core Target</h2>

        <form class="space-y-4" @submit.prevent="handleCreateProject">
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
            <label class="block text-sm font-medium text-gray-400 mb-1"
              >Deadline <span class="text-gray-500 font-normal">(Optional)</span></label
            >
            <input
              v-model="newProject.deadline"
              type="date"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-morandi-blue focus:ring-1 focus:ring-morandi-blue outline-none transition-colors"
            />
          </div>

          <div class="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              class="px-4 py-2 text-gray-400 hover:text-gray-200 font-medium transition-colors"
              :disabled="isSubmitting"
              @click="showAddModal = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="bg-morandi-blue hover:bg-morandi-blue-dark text-gray-900 px-6 py-2 rounded-lg font-semibold shadow-lg shadow-morandi-blue/20 transition-all transform flex items-center"
              :class="
                isSubmitting || !newProject.title
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105'
              "
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
