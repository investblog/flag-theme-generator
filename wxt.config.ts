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
    version: '0.1.0',
    default_locale: 'en',
    author: '301.st — Smart Traffic <support@301.st>',
    homepage_url: 'https://301.st',

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

  browser: 'chrome',
});
