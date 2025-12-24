<spec lang="md">
# 儀表板頁面

## 行為

- 顯示資訊卡片：執行分數、週檢視、剩餘天數、活躍專案（使用 AppCard 元件）。
- 顯示目標進度區塊（使用 AppCard 元件）。

## 視覺

- 使用 `base.css` 中定義的顏色和字體。
- Layout: 填充父容器，內部可滾動

## Interaction

- 按鈕 hover 效果
</spec>

<script setup lang="ts">
import AppCard from '../components/AppCard.vue'
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

    <div class="mb-4 text-gray-400 text-md">2026 Q1 • Week 0 of 12 (Jan 4 - Mar 29)</div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      <AppCard>
        <h2 class="text-md font-semibold text-morandi-green-dark mb-2">Execution Score</h2>
        <div class="flex items-baseline mb-2">
          <p class="text-4xl font-bold text-gray-50">67%</p>
          <span class="ml-2 text-morandi-orange">Keep pushing</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2.5">
          <div class="bg-morandi-green h-2.5 rounded-full" style="width: 67%"></div>
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
        <p class="text-4xl font-bold text-gray-50">97</p>
        <span class="text-gray-400">days left in cycle</span>
      </AppCard>
    </div>

    <!-- Active Projects -->
    <AppCard class="mb-10">
      <h2 class="text-md font-semibold text-morandi-green-dark mb-2">Active Projects</h2>
      <p class="text-4xl font-bold text-gray-50">
        1 <span class="text-gray-400 text-base font-normal">goals in progress</span>
      </p>
    </AppCard>

    <!-- Goal Progress -->
    <div class="mb-10">
      <h2 class="text-2xl font-bold text-morandi-green-dark mb-4">Goal Progress</h2>
      <AppCard class="w-1/2">
        <p class="text-lg font-semibold text-morandi-green-dark mb-2">後端體驗營</p>
        <p class="text-gray-400 mb-2">2 / 3 tasks</p>
        <div class="w-full bg-gray-700 rounded-full h-2.5">
          <div class="bg-morandi-blue h-2.5 rounded-full" style="width: 67%"></div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
