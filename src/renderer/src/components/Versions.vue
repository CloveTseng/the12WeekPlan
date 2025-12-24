<spec lang="md">
# Versions

## Props

(無)

## Behavior

- 讀取 `window.electron.process.versions` 取得環境版本資訊
- 顯示 Electron, Chromium, Node 的版本號

## Visuals

- 列表顯示版本資訊
- Design Token: 繼承既有樣式

## Interaction

(無)
</spec>

<script setup lang="ts">
import { ref } from 'vue'

const versions = ref({ ...window.electron.process.versions })
</script>

<template>
  <ul class="versions">
    <li class="electron-version">Electron v{{ versions.electron }}</li>
    <li class="chrome-version">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
  </ul>
</template>
