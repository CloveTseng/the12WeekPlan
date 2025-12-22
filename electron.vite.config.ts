import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

function ignoreSpecBlock() {
  return {
    name: 'ignore-spec-block',
    enforce: 'pre' as const,
    transform(code, id) {
      if (id.includes('?vue&type=spec')) {
        return { code: 'export default {}', map: null }
      }
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
