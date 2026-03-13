import { resolve } from 'node:path';
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',

  alias: {
    '@shared': resolve(__dirname, 'src/shared'),
  },

  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    version: '1.1.0',
    default_locale: 'en',
    author: '301.st — Smart Traffic <support@301.st>',
    homepage_url: 'https://flagtheme.com',

    ...(browser === 'chrome' && { minimum_chrome_version: '116' }),

    permissions: browser === 'firefox' ? ['storage', 'theme'] : ['storage', 'sidePanel'],

    optional_permissions: ['downloads'],

    host_permissions: [],

    icons: {
      16: 'icons/16.png',
      32: 'icons/32.png',
      48: 'icons/48.png',
      128: 'icons/128.png',
    },

    // Chrome/Edge: action button in toolbar (opens side panel via setPanelBehavior)
    ...(browser !== 'firefox' && {
      action: {
        default_icon: {
          16: 'icons/16.png',
          32: 'icons/32.png',
          48: 'icons/48.png',
        },
        default_title: '__MSG_extName__',
      },
    }),

    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'flag-theme-generator@301.st',
          strict_min_version: '109.0',
          data_collection_permissions: {
            required: ['none'],
          },
        },
      },
    }),
  }),

  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      // WXT auto-generates sidebar_action from sidepanel entrypoint but without icons
      if (manifest.sidebar_action) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (manifest.sidebar_action as any).default_icon = {
          16: 'icons/16.png',
          32: 'icons/32.png',
          48: 'icons/48.png',
        };
      }
    },
  },

  browser: 'chrome',
});
