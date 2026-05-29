import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'okAPI: API Mocking',
    description: 'Intercept and modify API requests and responses from DevTools.',
    version: '0.1.0',
    permissions: [
      'debugger',
      'webRequest',
      'webRequestBlocking',
      'storage',
      'unlimitedStorage',
      'activeTab',
      'contextMenus',
    ],
    host_permissions: ['<all_urls>'],
  },
  browser: undefined,
  webExt: {
    disabled: true,
    startUrls: ["https://wxt.dev/"],
  },
});