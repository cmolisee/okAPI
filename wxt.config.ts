import { defineConfig } from 'wxt';
import { resolve } from 'node:path';

// See https://wxt.dev/api/config.html
export default defineConfig({
  alias: {
    types: resolve('types'),
  },
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-solid'],
  srcDir: 'src',
  outDir: 'dist',
  manifest: {
    permissions: ['activeTab', 'tabs', 'sidePanel', 'storage'],
    action: {},
    web_accessible_resources: [
      {
        resources: ['inject.js'],
        matches: ["*://*/*"],
      }
    ],
  },
  runner: {
    startUrls: ['https://webext-core.aklinker1.io/'],
  },
  vite: () => ({
    // TODO: remove this when done debugging the teams link thing that periodically pops up.
    build: {
      minify: false,
    },
    css: {
      postcss: './postcss.config.js'
    }
  })
});