import { test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

function readSource(name: string): string {
    return readFileSync(join(here, name), 'utf8')
}

test('Canvas test page links to /test/plain via a real <a>, not React Router <Link>', () => {
    const src = readSource('Canvas.tsx')
    expect(src).toMatch(/<a\s[^>]*href=["']\/test\/plain["']/)
    expect(src).not.toMatch(
        /import\s*\{[^}]*\bLink\b[^}]*\}\s*from\s*["']react-router-dom["']/,
    )
})

test('Plain test page links to /test/canvas via a real <a>, not React Router <Link>', () => {
    const src = readSource('Plain.tsx')
    expect(src).toMatch(/<a\s[^>]*href=["']\/test\/canvas["']/)
    expect(src).not.toMatch(
        /import\s*\{[^}]*\bLink\b[^}]*\}\s*from\s*["']react-router-dom["']/,
    )
})
