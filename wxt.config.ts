import { defineConfig } from 'wxt';

export default defineConfig({
  imports: {
    dirs: ['components']
  },
  manifest: {
    name: 'ok-API: API Mocking',
    description: 'Intercept and modify API requests and responses from DevTools.',
    version: '0.1.0',
    permissions: [
      'debugger',
      'storage',
      'unlimitedStorage',
      'activeTab',
      'webNavigation'
    ],
    host_permissions: ['<all_urls>'],
    incognito: 'spanning', // shared, single background process
    icons: {
      "32": "/icons/default/32.png",
      "48": "/icons/default/48.png",
    },
    action: {
      default_icon: {
        "48": "/icons/default/48.png",
      }
    }
  },
  browser: undefined,
  webExt: {
    disabled: true,
    startUrls: ["https://wxt.dev/"],
  }
});
/**
 * Minimum Version: Chrome 88+ / Firefox 45+ / Safari 10.1+
 * debugger only works on Firefox 109+ - will likely need different engine strategy
 */