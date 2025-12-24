import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import type { Plugin } from 'vite'

function ignoreSpecBlock(): Plugin {
  return {
    name: 'ignore-spec-block',
    enforce: 'pre' as const,
    transform(_code, id) {
      if (id.includes('?vue&type=spec')) {
        return { code: 'export default {}', map: null }
      }
      return
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue(), ignoreSpecBlock()]
  }
})
