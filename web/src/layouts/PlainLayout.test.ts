import { test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

test('PlainLayout does not import or render FrameBar', () => {
    const src = readFileSync(join(here, 'PlainLayout.tsx'), 'utf8')
    expect(src).not.toMatch(/FrameBar/)
})
