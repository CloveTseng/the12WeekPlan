<spec lang="md">
# 儀表板頁面

## 行為

- 顯示資訊卡片：執行分數、週檢視、剩餘天數、活躍專案（使用 AppCard 元件）
- 顯示目標進度區塊（使用 AppCard 元件）
- 從 goalsStore 載入當前週期、專案、行動資料
- 計算執行分數（已完成行動 / 總行動）
- 計算活躍專案數量
- 顯示各專案的完成進度

## 視覺

- 使用 `base.css` 中定義的顏色和字體
- Layout: 填充父容器，內部可滾動

## Interaction

- 按鈕 hover 效果
- 載入時自動獲取資料
</spec>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGoalsStore } from '../stores/goals'
import AppCard from '../components/AppCard.vue'

const store = useGoalsStore()

onMounted(async () => {
  await store.fetchCurrentCycle()
  await store.fetchProjects()
  // 為每個專案載入所有行動以計算執行分數
  for (const project of store.projects) {
    await store.fetchAllActions(project.id)
  }
})

// 計算當前週期資訊
const cycleInfo = computed(() => {
  if (!store.currentCycle) {
    return {
      year: store.currentYear,
      quarter: store.currentQuarter,
      week: store.currentWeek,
      startDate: '',
      endDate: '',
      daysRemaining: 0
    }
  }

  const start = new Date(store.currentCycle.start_date)
  const end = new Date(store.currentCycle.end_date)
  const today = new Date()
  const diffTime = end.getTime() - today.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  return {
    year: store.currentYear,
    quarter: store.currentQuarter,
    week: store.currentWeek,
    startDate: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    endDate: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    daysRemaining
  }
})

// 計算執行分數
const executionScore = computed(() => {
  let totalActions = 0
  let completedActions = 0

  for (const projectId in store.actions) {
    const projectActions = store.actions[projectId]
    totalActions += projectActions.length
    completedActions += projectActions.filter((a) => a.is_completed).length
  }

  if (totalActions === 0) return 0
  return Math.round((completedActions / totalActions) * 100)
})

// 計算活躍專案數量
const activeProjectsCount = computed(() => {
  return store.projects.length
})

// 計算各專案的進度
const projectProgress = computed(() => {
  return store.projects
    .map((project) => {
      const projectActions = store.actions[project.id] || []
      const total = projectActions.length
      const completed = projectActions.filter((a) => a.is_completed).length
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        id: project.id,
        title: project.title,
        completed,
        total,
        percentage
      }
    })
    .filter((p) => p.total > 0) // 只顯示有行動的專案
})

// 執行分數的狀態訊息
const scoreStatus = computed(() => {
  const score = executionScore.value
  if (score >= 85) return 'Excellent!'
  if (score >= 70) return 'Good progress'
  if (score >= 50) return 'Keep pushing'
  return 'Need focus'
})

// 執行分數的顏色
const scoreColor = computed(() => {
  const score = executionScore.value
  if (score >= 85) return 'morandi-green'
  if (score >= 70) return 'morandi-blue'
  if (score >= 50) return 'morandi-orange'
  return 'red-500'
})
</script>

<template>
  <div class="h-full overflow-y-auto p-10">
    <header class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-morandi-blue-dark">Dashboard</h1>
      <div class="flex space-x-4">
        <button class="bg-gray-700 text-gray-50 px-4 py-2 rounded-md hover:bg-gray-600">
          Weekly Review
        </button>
        <button
          class="bg-morandi-blue-dark text-gray-50 px-4 py-2 rounded-md hover:bg-morandi-blue"
        >
          Complete Cycle
        </button>
      </div>
    </header>

    <div class="mb-4 text-gray-400 text-md">
      {{ cycleInfo.year }} Q{{ cycleInfo.quarter }} • Week {{ cycleInfo.week }} of 12
      <span v-if="cycleInfo.startDate && cycleInfo.endDate">
        ({{ cycleInfo.startDate }} - {{ cycleInfo.endDate }})
      </span>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      <AppCard>
        <h2 class="text-md font-semibold text-morandi-green-dark mb-2">Execution Score</h2>
        <div class="flex items-baseline mb-2">
          <p class="text-4xl font-bold text-gray-50">{{ executionScore }}%</p>
          <span class="ml-2" :class="`text-${scoreColor}`">{{ scoreStatus }}</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2.5">
          <div
            :class="`bg-${scoreColor}`"
            class="h-2.5 rounded-full transition-all duration-300"
            :style="`width: ${executionScore}%`"
          ></div>
        </div>
      </AppCard>

      <AppCard class="flex flex-col justify-between">
        <h2 class="text-md font-semibold text-morandi-green-dark mb-2">Weekly Review</h2>
        <button
          class="border-2 border-dashed border-gray-600 text-gray-400 py-2 rounded-lg hover:border-morandi-blue hover:text-morandi-blue transition-colors duration-200"
        >
          Add Review
        </button>
      </AppCard>

      <AppCard>
        <h2 class="text-md font-semibold text-morandi-green-dark mb-2">Days Remaining</h2>
        <p class="text-4xl font-bold text-gray-50">{{ cycleInfo.daysRemaining }}</p>
        <span class="text-gray-400">days left in cycle</span>
      </AppCard>
    </div>

    <!-- Active Projects -->
    <AppCard class="mb-10">
      <h2 class="text-md font-semibold text-morandi-green-dark mb-2">Active Projects</h2>
      <p class="text-4xl font-bold text-gray-50">
        {{ activeProjectsCount }}
        <span class="text-gray-400 text-base font-normal"
          >{{ activeProjectsCount === 1 ? 'goal' : 'goals' }} in progress</span
        >
      </p>
    </AppCard>

    <!-- Goal Progress -->
    <div class="mb-10">
      <h2 class="text-2xl font-bold text-morandi-green-dark mb-4">Goal Progress</h2>

      <div v-if="projectProgress.length === 0" class="text-gray-500 text-center py-8">
        No active goals with tasks yet. Go to Strategic Planning to create your first target.
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppCard v-for="project in projectProgress" :key="project.id">
          <p class="text-lg font-semibold text-morandi-green-dark mb-2">{{ project.title }}</p>
          <p class="text-gray-400 mb-2">{{ project.completed }} / {{ project.total }} tasks</p>
          <div class="w-full bg-gray-700 rounded-full h-2.5">
            <div
              class="bg-morandi-blue h-2.5 rounded-full transition-all duration-300"
              :style="`width: ${project.percentage}%`"
            ></div>
          </div>
        </AppCard>
      </div>
    </div>
  </div>
</template>
