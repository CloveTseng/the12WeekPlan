<spec lang="md">
# Home Page
## Behavior
- Displays welcome message
- Shows versions component
</spec>
<script setup lang="ts">
import Versions from '../components/Versions.vue'
</script>
<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-4 text-center">
    <h1 class="text-3xl font-bold mb-4 text-amber-400">The 12 Week Year</h1>
    <p class="mb-8 text-gray-300">Start your journey today.</p>
    <Versions />
  </div>
</template>

