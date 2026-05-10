import { describe, test, expect, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CANVAS_ONLY_BUNDLE_MARKER } from '../lib/canvas-only-marker'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '../..')
const distDir = join(projectRoot, 'dist')
const plainHtmlPath = join(distDir, 'test/plain/index.html')
const canvasHtmlPath = join(distDir, 'test/canvas/index.html')

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

describe('route-level bundle splitting', () => {
    beforeAll(() => {
        if (!existsSync(plainHtmlPath) || !existsSync(canvasHtmlPath)) {
            execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' })
        }
    }, 120_000)

    test('plain-mode HTML preloads at least one route chunk', () => {
        const html = readFileSync(plainHtmlPath, 'utf8')
        const urls = extractAssetUrls(html)
        expect(urls.length).toBeGreaterThan(0)
    })

    test('no chunk loaded by plain-mode HTML contains the canvas-only marker', () => {
        const html = readFileSync(plainHtmlPath, 'utf8')
        const urls = extractAssetUrls(html)
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
