import type { Plugin } from 'vite'

interface FeedsOptions {
  baseUrl: string
}

export function vitePluginFeeds(_options: FeedsOptions): Plugin {
  return {
    name: 'vite-plugin-feeds',
    apply: 'build',
  }
}
