<spec lang="md">
# AppCard

## Props

(無)

## Behavior

- 作為通用卡片容器
- 提供默認的背景、圓角、陰影與內距

## Visuals

- Design Token: bg-gray-900, border-gray-700, border-[0.5px], rounded-lg, shadow-md, p-4

## Interaction

(無)
</spec>

<script setup lang="ts">
// No specific script
</script>

<template>
  <div class="bg-gray-900 border-[0.5px] border-gray-700 p-4 rounded-lg shadow-md">
    <slot />
  </div>
</template>

