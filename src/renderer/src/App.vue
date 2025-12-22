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
- Global layout wrapper
- Handles routing via `<RouterView>`
</spec>
<script setup lang="ts">
</script>

<template>
  <RouterView />
</template>
