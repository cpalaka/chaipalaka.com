// Generates a 1280x720 blurred-gradient PNG per registry scene, mirroring
// each scene's `fallbackColors`. Output goes to public/fallbacks/.
//
// Runs as a `prebuild` hook so static fallbacks are guaranteed to exist
// for no-WebGL / context-lost / reduced-motion cases. Output is
// deterministic. Consumes BACKGROUND_SCENES from canvas/scenes/registry —
// the single source of truth.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { BACKGROUND_SCENES } from '../src/canvas/scenes/registry.ts'

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(here, '..')
const outputDir = resolve(webRoot, 'public/fallbacks')

const WIDTH = 1280
const HEIGHT = 720

function hexToRgb(hex: string) {
    const m = /^#([0-9a-f]{6})$/i.exec(hex)
    if (!m) throw new Error(`Invalid hex color: ${hex}`)
    const n = parseInt(m[1]!, 16)
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
}

function gradientBuffer(colorA: string, colorB: string) {
    const a = hexToRgb(colorA)
    const b = hexToRgb(colorB)
    const buf = Buffer.alloc(WIDTH * HEIGHT * 3)
    const denom = WIDTH + HEIGHT - 2
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const t = (x + y) / denom
            const i = (y * WIDTH + x) * 3
            buf[i] = Math.round(a.r + (b.r - a.r) * t)
            buf[i + 1] = Math.round(a.g + (b.g - a.g) * t)
            buf[i + 2] = Math.round(a.b + (b.b - a.b) * t)
        }
    }
    return buf
}

async function generateOne(scene: {
    id: string
    fallbackColors: readonly [string, string]
}) {
    const [colorA, colorB] = scene.fallbackColors
    const raw = gradientBuffer(colorA, colorB)
    const outFile = join(outputDir, `${scene.id}.png`)
    await sharp(raw, { raw: { width: WIDTH, height: HEIGHT, channels: 3 } })
        .blur(48)
        .png({ compressionLevel: 9 })
        .toFile(outFile)
    return outFile
}

async function main() {
    mkdirSync(outputDir, { recursive: true })
    for (const scene of BACKGROUND_SCENES) {
        const out = await generateOne(scene)
        console.log(`generated ${out}`)
    }
    void writeFileSync // tree-shake guard: keep node:fs imports stable
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
