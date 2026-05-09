import { PretextRegistry } from './PretextRegistry'

export const registry = new PretextRegistry()

registry.register('body', {
  family: 'Newsreader Variable',
  size: 16,
  weight: 400,
  lineHeight: 1.6,
})
registry.register('mono', {
  family: 'JetBrains Mono Variable',
  size: 14,
  weight: 400,
  lineHeight: 1.6,
})
