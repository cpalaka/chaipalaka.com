import { describe, test, expect, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CANVAS_ONLY_BUNDLE_MARKER } from '../lib/canvas-only-marker'
import { ATELIER_ONLY_BUNDLE_MARKER } from '../atelier/atelier-only-marker'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '../..')
const distDir = join(projectRoot, 'dist')

// This guard used to read /test/plain and /test/canvas, which stopped shipping
// in task-044 (decision O5). It now reads the real routes that use each layout:
// the canvas sample is /404, which is always emitted and depends on no content,
// and the plain sample is whichever published post's /read surface exists —
// PlainLayout is only ever reached through /blog/:slug/read, so the sample has
// to be discovered rather than hardcoded.
const canvasHtmlPath = join(distDir, '404/index.html')

function findPlainHtmlPath(): string | undefined {
    if (!existsSync(distDir)) return undefined
    const match = readdirSync(distDir, { recursive: true })
        .map(String)
        .find((p) => p.startsWith('blog/') && p.endsWith('read/index.html'))
    return match ? join(distDir, match) : undefined
}

function extractAssetUrls(html: string): string[] {
    const urls: string[] = []
    const patterns = [
        /<script[^>]+src=["']([^"']+\.js)["']/g,
        /<link[^>]+rel=["']modulepreload["'][^>]*href=["']([^"']+\.js)["']/g,
        /<link[^>]+href=["']([^"']+\.js)["'][^>]*rel=["']modulepreload["']/g,
    ]
    for (const pattern of patterns) {
        for (const m of html.matchAll(pattern)) {
            const url = m[1]
            if (url) urls.push(url)
        }
    }
    return [...new Set(urls)]
}

function chunkPath(url: string): string {
    return join(distDir, url.replace(/^\//, ''))
}

function ensureBuilt() {
    if (!existsSync(canvasHtmlPath) || !findPlainHtmlPath()) {
        execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' })
    }
}

function plainHtml(): string {
    const path = findPlainHtmlPath()
    if (!path) {
        throw new Error(
            'no dist/blog/*/read/index.html to sample — plain-mode bundle guard has nothing to check',
        )
    }
    return readFileSync(path, 'utf8')
}

function listDistJsFiles(): string[] {
    return readdirSync(distDir, { recursive: true })
        .map(String)
        .filter((path) => path.endsWith('.js'))
}

describe('route-level bundle splitting', () => {
    beforeAll(ensureBuilt, 120_000)

    test('plain-mode HTML preloads at least one route chunk', () => {
        const urls = extractAssetUrls(plainHtml())
        expect(urls.length).toBeGreaterThan(0)
    })

    test('no chunk loaded by plain-mode HTML contains the canvas-only marker', () => {
        const urls = extractAssetUrls(plainHtml())
        for (const url of urls) {
            const content = readFileSync(chunkPath(url), 'utf8')
            expect(
                content.includes(CANVAS_ONLY_BUNDLE_MARKER),
                `chunk ${url} unexpectedly contains canvas-only marker`,
            ).toBe(false)
        }
    })

    test('canvas-mode HTML loads at least one chunk containing the canvas-only marker', () => {
        const html = readFileSync(canvasHtmlPath, 'utf8')
        const urls = extractAssetUrls(html)
        const found = urls.some((url) =>
            readFileSync(chunkPath(url), 'utf8').includes(
                CANVAS_ONLY_BUNDLE_MARKER,
            ),
        )
        expect(
            found,
            'expected canvas-only marker in some canvas-mode chunk',
        ).toBe(true)
    })
})

// Stronger than the canvas guard above: the canvas marker may live in a lazy
// chunk, but Atelier code must not ship AT ALL — AtelierGate's
// import.meta.env.DEV guard makes the panel import dead code in prod, so the
// marker must appear in NO emitted chunk, not merely outside the entry.
describe('atelier prod-bundle guard', () => {
    beforeAll(ensureBuilt, 120_000)

    test('build emits at least one JS chunk', () => {
        expect(listDistJsFiles().length).toBeGreaterThan(0)
    })

    test('no emitted prod chunk contains the atelier-only marker', () => {
        for (const path of listDistJsFiles()) {
            const content = readFileSync(join(distDir, path), 'utf8')
            expect(
                content.includes(ATELIER_ONLY_BUNDLE_MARKER),
                `chunk ${path} unexpectedly contains atelier-only marker`,
            ).toBe(false)
        }
    })
})
