import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'API Interceptor',
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

  // Build Firefox as MV2 — filterResponseData requires blocking webRequest (MV2 only)
  // Chromium and Safari use MV3
  browser: undefined, // set per build via CLI flag

  webExt: {
    disabled: true, // we manage running ourselves
    startUrls: ["https://wxt.dev/"],
  },
});