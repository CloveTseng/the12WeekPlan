<spec lang="md">
# App (Global Design System)

## Visuals (Dark Mode + Morandi)

### Color Palette Strategy

- **Base Background**: `gray-900` (#1c1917) - Global application background
- **Surface/Cards**: `gray-800` (#292524) - Content blocks, cards, sidebars
- **Elevated Surface**: `gray-700` (#44403c) - Modals, dropdowns, hover states

### Typography Colors

- **Primary Text**: `gray-100` (#f5f5f4) - Headings, body text
- **Secondary Text**: `gray-400` (#a8a29e) - Meta info, subtitles, placeholders
- **Interactive/Link**: `morandi-blue` (#9FB8AD) or `morandi-pink` (#D9A9A9)

### Accents & Highlights (Morandi)

- Use Morandi colors for non-intrusive highlights and status indicators:
  - **Success/Safe**: `morandi-green` (#A9BFA8) or `morandi-sage` (#8F9E8B)
  - **Info/Neutral**: `morandi-blue` (#9FB8AD) or `morandi-ocean` (#87A8B3)
  - **Warmth/Alert**: `morandi-clay` (#B8A492) or `morandi-rose` (#D29C9C)
  - **Light UI Elements**: `morandi-cream` (#F2F0EB) or `morandi-beige` (#DDC8B0)

## Behavior

- Global layout wrapper with Sidebar
- Handles routing via `<RouterView>`
</spec>

<script setup lang="ts">
import { onMounted } from 'vue'
import { 
  PhLightning, 
  PhLayout, 
  PhCalendarBlank, 
  PhTarget, 
  PhBookOpen, 
  PhArchive, 
  PhGearSix 
} from '@phosphor-icons/vue'
import { useGoalsStore } from './stores/goals'

const store = useGoalsStore()

onMounted(async () => {
  await store.loadSettings()
})
</script>

<template>
  <div class="flex h-screen bg-gray-950 text-gray-100 font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-900 p-6 flex flex-col shrink-0">
      <div class="flex items-center mb-10">
        <PhLightning :size="26" weight="regular" class="mr-2 text-morandi-blue-dark" />
        <span class="text-morandi-blue-dark text-xl font-bold">12 Week Year</span>
      </div>
      <nav class="grow">
        <ul>
          <li class="mb-4">
            <RouterLink 
              to="/" 
              class="flex items-center font-semibold py-[8px] transition-colors"
              active-class="text-morandi-blue-dark"
              exact-active-class="text-morandi-blue-dark"
              :class="$route.path === '/' ? '' : 'text-gray-300 hover:text-morandi-blue'"
            >
              <PhLayout :size="16" weight="bold" class="mr-3" />
              Dashboard
            </RouterLink>
          </li>
          <li class="mb-4">
            <RouterLink
              to="/weekly-plan"
              class="flex items-center py-[8px] transition-colors"
              active-class="text-morandi-blue"
              :class="$route.path.startsWith('/weekly-plan') ? 'text-morandi-blue font-semibold' : 'text-gray-300 hover:text-morandi-blue'"
            >
              <PhCalendarBlank :size="16" weight="bold" class="mr-3" />
              Weekly Plan
            </RouterLink>
          </li>
          <li class="mb-4">
            <RouterLink
              to="/goals"
              class="flex items-center py-[8px] transition-colors"
              active-class="text-morandi-blue"
              :class="$route.path.startsWith('/goals') ? 'text-morandi-blue font-semibold' : 'text-gray-300 hover:text-morandi-blue'"
            >
              <PhTarget :size="16" weight="bold" class="mr-3" />
              Goals & Strategy
            </RouterLink>
          </li>
          <li class="mb-4">
            <a
              href="#"
              class="flex items-center text-gray-300 hover:text-morandi-blue py-[8px] transition-colors"
            >
              <PhBookOpen :size="16" weight="bold" class="mr-3" />
              Documents
            </a>
          </li>
          <li class="mb-4">
            <a
              href="#"
              class="flex items-center text-gray-300 hover:text-morandi-blue py-[8px] transition-colors"
            >
              <PhArchive :size="16" weight="bold" class="mr-3" />
              Archive
            </a>
          </li>
        </ul>
      </nav>
      <div class="text-morandi-ocean text-sm mt-auto relative flex items-center justify-center">
        <p>v0.1.0</p>
        <RouterLink to="/settings" class="absolute right-0 text-gray-300 hover:text-morandi-blue">
          <PhGearSix :size="20" weight="bold" />
        </RouterLink>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden bg-gray-950">
      <RouterView />
    </main>
  </div>
</template>
