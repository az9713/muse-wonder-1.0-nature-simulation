import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// The Pages site is served from /muse-wonder-1.0-nature-simulation/.
// The string lives in this file so a Windows shell cannot rewrite the path.
// Local `npm run dev` stays at /.
const base = process.env.GITHUB_PAGES === 'true' ? '/muse-wonder-1.0-nature-simulation/' : '/'

export default defineConfig({
  base,
  server: { port: 5179, strictPort: false },
  build: {
    rollupOptions: {
      input: {
        main: resolve('index.html'),
        journey: resolve('journey.html'),
        comparison: resolve('comparison.html'),
        findings: resolve('findings.html'),
      },
    },
  },
})
