import { describe, it, expect } from 'vitest'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { physicsTuning } from '../physics/physicsTuning'
import { layoutTuning } from '../layout/layoutTuning'
import { lifelogLayout } from '../routes/Lifelog.layout'
import {
    generateLayoutSource,
    generateLayoutTuningSource,
    generatePhysicsTuningSource,
    handleAtelierWrite,
    mirrorWarnings,
    rewriteTokensCss,
    vitePluginAtelier,
    type AtelierIo,
} from './vite-plugin-atelier'

const here = dirname(fileURLToPath(import.meta.url))
const realTokensCss = readFileSync(
    join(here, '..', 'styles', 'tokens.css'),
    'utf8',
)

// A miniature tokens.css with the same four-block structure as the real one:
// :root (dark defaults), media-query light, [data-theme='light'], and the
// [data-theme='dark'] re-assert block.
const FIXTURE_CSS = `/* header comment — preserved */
:root {
    /* dark defaults */
    --color-bg: #0a0a0a;
    --color-accent: #e60000;
    --card-padding: 24px;
    --font-mono:
        'JetBrains Mono Variable', ui-monospace,
        monospace;
}

@media (prefers-color-scheme: light) {
    :root {
        --color-bg: #f8f8f8;
        --color-accent: #e60000;
    }
}

:root[data-theme='light'] {
    --color-bg: #f8f8f8;
    --color-accent: #e60000;
}

:root[data-theme='dark'] {
    --color-bg: #0a0a0a;
    --color-accent: #e60000;
}
`

describe('rewriteTokensCss', () => {
    it('replaces a dark token value in :root, preserving everything else', () => {
        const result = rewriteTokensCss(FIXTURE_CSS, {
            dark: { '--card-padding': '32px' },
        })
        if (!result.ok) throw new Error(result.error)
        expect(result.css).toContain('--card-padding: 32px;')
        expect(result.css).not.toContain('--card-padding: 24px;')
        // everything else untouched
        expect(result.css).toContain('/* header comment — preserved */')
        expect(result.css).toContain('/* dark defaults */')
        expect(
            result.css.replace(
                '--card-padding: 32px;',
                '--card-padding: 24px;',
            ),
        ).toBe(FIXTURE_CSS)
    })

    it('writes a light token into BOTH light blocks (media query + data-theme)', () => {
        const result = rewriteTokensCss(FIXTURE_CSS, {
            light: { '--color-bg': '#ffffff' },
        })
        if (!result.ok) throw new Error(result.error)
        const lightDecls = result.css.match(/--color-bg: #ffffff;/g) ?? []
        expect(lightDecls).toHaveLength(2)
        // the dark declarations are untouched
        expect(result.css.match(/--color-bg: #0a0a0a;/g)).toHaveLength(2)
    })

    it('rejects the whole write when one property is unmatched (all-or-nothing)', () => {
        const result = rewriteTokensCss(FIXTURE_CSS, {
            dark: { '--color-accent': '#00ff00', '--not-a-token': '1px' },
        })
        expect(result.ok).toBe(false)
        if (result.ok) throw new Error('expected rejection')
        expect(result.error).toContain('--not-a-token')
    })

    it('rejects a light write for a token missing from one light block', () => {
        // --card-padding is declared in :root only — a light edit must refuse
        const result = rewriteTokensCss(FIXTURE_CSS, {
            light: { '--card-padding': '32px' },
        })
        expect(result.ok).toBe(false)
    })

    it('syncs a dark edit into the [data-theme=dark] re-assert block', () => {
        const result = rewriteTokensCss(FIXTURE_CSS, {
            dark: { '--color-bg': '#111111' },
        })
        if (!result.ok) throw new Error(result.error)
        expect(result.css.match(/--color-bg: #111111;/g)).toHaveLength(2)
        // light blocks untouched
        expect(result.css.match(/--color-bg: #f8f8f8;/g)).toHaveLength(2)
    })

    it('replaces a multi-line declaration value as a single line', () => {
        const result = rewriteTokensCss(FIXTURE_CSS, {
            dark: { '--font-mono': "'Fira Code', monospace" },
        })
        if (!result.ok) throw new Error(result.error)
        expect(result.css).toContain("'Fira Code', monospace;")
        expect(result.css).not.toContain('JetBrains Mono Variable')
    })

    it('rejects values or property names that would corrupt the stylesheet', () => {
        expect(
            rewriteTokensCss(FIXTURE_CSS, {
                dark: { '--color-bg': '#111; } :root { --hacked: 1' },
            }).ok,
        ).toBe(false)
        expect(
            rewriteTokensCss(FIXTURE_CSS, { dark: { 'color-bg': '#111111' } })
                .ok,
        ).toBe(false)
    })

    it('rewriting the real tokens.css with its current values is byte-identical', () => {
        const result = rewriteTokensCss(realTokensCss, {
            dark: { '--color-accent': '#e60000', '--card-padding': '24px' },
            light: { '--color-bg': '#f8f8f8' },
        })
        if (!result.ok) throw new Error(result.error)
        expect(result.css).toBe(realTokensCss)
    })

    it('edits the real tokens.css: light bg lands in both light blocks only', () => {
        const result = rewriteTokensCss(realTokensCss, {
            light: { '--color-bg': '#fffff0' },
        })
        if (!result.ok) throw new Error(result.error)
        expect(result.css.match(/--color-bg: #fffff0;/g)).toHaveLength(2)
        expect(result.css.match(/--color-bg: #0a0a0a;/g)).toHaveLength(2)
    })
})

describe('mirrorWarnings', () => {
    it('warns for tokens with TS mirrors, naming the mirror file', () => {
        const warnings = mirrorWarnings({
            dark: {
                '--font-body': "'Inter', sans-serif",
                '--card-padding': '32px',
            },
        })
        expect(warnings).toHaveLength(2)
        expect(warnings.join('\n')).toContain('src/text/fonts.ts')
        expect(warnings.join('\n')).toContain('CARD_PADDING')
    })

    it('returns no warnings for unmirrored tokens', () => {
        expect(
            mirrorWarnings({ dark: { '--color-accent': '#00ff00' } }),
        ).toEqual([])
    })

    it('does not duplicate a warning when both themes edit the same token', () => {
        const warnings = mirrorWarnings({
            dark: { '--card-gap': '16px' },
            light: { '--card-gap': '16px' },
        })
        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toContain('CARD_GAP')
    })
})

describe('generatePhysicsTuningSource', () => {
    it('regenerating from the current values reproduces physicsTuning.ts byte-identically', () => {
        const result = generatePhysicsTuningSource({ ...physicsTuning })
        if (!result.ok) throw new Error(result.error)
        const real = readFileSync(
            join(here, '..', 'physics', 'physicsTuning.ts'),
            'utf8',
        )
        expect(result.source).toBe(real)
    })

    it('round-trips: generate → import → deep-equal', async () => {
        const retuned = {
            ...physicsTuning,
            gravityY: 1.2,
            tetherStiffness: 3e-6,
            pourInBaseDelayMs: 500,
        }
        const result = generatePhysicsTuningSource(retuned)
        if (!result.ok) throw new Error(result.error)
        const tmp = join(here, '.roundtrip-physics.gen.ts')
        writeFileSync(tmp, result.source)
        try {
            const mod = await import(/* @vite-ignore */ tmp)
            expect(mod.physicsTuning).toEqual(retuned)
        } finally {
            rmSync(tmp)
        }
    })

    it('rejects an unknown key', () => {
        const result = generatePhysicsTuningSource({
            ...physicsTuning,
            warpSpeed: 9,
        })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toContain('warpSpeed')
    })

    it('rejects a missing key', () => {
        const values: Record<string, number> = { ...physicsTuning }
        delete values.gravityY
        const result = generatePhysicsTuningSource(values)
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toContain('gravityY')
    })

    it('rejects non-finite values', () => {
        const result = generatePhysicsTuningSource({
            ...physicsTuning,
            gravityY: NaN,
        })
        expect(result.ok).toBe(false)
    })
})

describe('generateLayoutTuningSource', () => {
    it('regenerating from the current values reproduces layoutTuning.ts byte-identically', () => {
        const result = generateLayoutTuningSource({ ...layoutTuning })
        if (!result.ok) throw new Error(result.error)
        const real = readFileSync(
            join(here, '..', 'layout', 'layoutTuning.ts'),
            'utf8',
        )
        expect(result.source).toBe(real)
    })

    it('round-trips: generate → import → deep-equal', async () => {
        const retuned = { ...layoutTuning, chainGap: 90, chainTop: 120 }
        const result = generateLayoutTuningSource(retuned)
        if (!result.ok) throw new Error(result.error)
        const tmp = join(here, '.roundtrip-chain.gen.ts')
        writeFileSync(tmp, result.source)
        try {
            const mod = await import(/* @vite-ignore */ tmp)
            expect(mod.layoutTuning).toEqual(retuned)
        } finally {
            rmSync(tmp)
        }
    })

    it('rejects unknown, missing, and non-finite values', () => {
        expect(
            generateLayoutTuningSource({ ...layoutTuning, marginOfError: 1 }).ok,
        ).toBe(false)
        const missing: Record<string, number> = { ...layoutTuning }
        delete missing.chainGap
        expect(generateLayoutTuningSource(missing).ok).toBe(false)
        expect(
            generateLayoutTuningSource({ ...layoutTuning, chainGap: NaN }).ok,
        ).toBe(false)
    })
})

describe('generateLayoutSource', () => {
    it('regenerating from the current data reproduces Lifelog.layout.ts byte-identically', () => {
        const result = generateLayoutSource('lifelog', lifelogLayout)
        if (!result.ok) throw new Error(result.error)
        const real = readFileSync(
            join(here, '..', 'routes', 'Lifelog.layout.ts'),
            'utf8',
        )
        expect(result.source).toBe(real)
    })

    it('round-trips: generate → import → deep-equal', async () => {
        const rearranged = {
            gravity: 'up',
            cards: [
                {
                    id: 'stuff-flash',
                    kind: 'portfolio',
                    parent: 'floor',
                    anchor: { fx: 0.3, fy: 0.6 },
                },
                {
                    id: 'stuff-site',
                    kind: 'portfolio',
                    parent: 'stuff-flash',
                    anchor: { fx: 0.3, fy: 0.4 },
                },
                {
                    id: 'stuff-note',
                    kind: 'note',
                    parent: null,
                    anchor: { fx: 0.8, fy: 0.2 },
                },
            ],
        }
        const result = generateLayoutSource('stuff', rearranged)
        if (!result.ok) throw new Error(result.error)
        // temp file sits next to the real layout files so './routeLayout' resolves
        const tmp = join(here, '..', 'routes', '.roundtrip-stuff.layout.gen.ts')
        writeFileSync(tmp, result.source)
        try {
            const mod = await import(/* @vite-ignore */ tmp)
            expect(mod.stuffLayout).toEqual(rearranged)
        } finally {
            rmSync(tmp)
        }
    })

    it('round-trips a gravity-less (drift) layout: no gravity line, re-import omits it (V1.4)', async () => {
        const drift = {
            cards: [
                {
                    id: 'stuff-flash',
                    kind: 'portfolio',
                    parent: null,
                    anchor: { fx: 0.3, fy: 0.6 },
                },
                {
                    id: 'stuff-note',
                    kind: 'note',
                    parent: null,
                    anchor: { fx: 0.8, fy: 0.2 },
                },
            ],
        }
        const result = generateLayoutSource('stuff', drift)
        if (!result.ok) throw new Error(result.error)
        expect(result.source).not.toContain('gravity') // no gravity line emitted
        const tmp = join(here, '..', 'routes', '.roundtrip-stuff-drift.layout.gen.ts')
        writeFileSync(tmp, result.source)
        try {
            const mod = await import(/* @vite-ignore */ tmp)
            // Deep-equal + no gravity key ⇒ the write-back neither re-inserts nor rejects.
            expect(mod.stuffLayout).toEqual(drift)
            expect('gravity' in mod.stuffLayout).toBe(false)
        } finally {
            rmSync(tmp)
        }
    })

    it('refuses a route that is not whitelisted', () => {
        const result = generateLayoutSource('home', lifelogLayout)
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toContain('home')
    })

    it('rejects an unknown gravity, card kind, or anchor shape', () => {
        const base = lifelogLayout.cards[0]!
        expect(
            generateLayoutSource('lifelog', {
                ...lifelogLayout,
                gravity: 'sideways',
            }).ok,
        ).toBe(false)
        expect(
            generateLayoutSource('lifelog', {
                gravity: 'down',
                cards: [{ ...base, kind: 'hologram' }],
            }).ok,
        ).toBe(false)
        expect(
            generateLayoutSource('lifelog', {
                gravity: 'down',
                cards: [{ ...base, anchor: { fx: 0.5 } }],
            }).ok,
        ).toBe(false)
    })

    it('rejects duplicate card ids and unresolved parent references', () => {
        const card = (id: string, parent: string | null) => ({
            id,
            kind: 'lifelog',
            parent,
            anchor: { fx: 0.5, fy: 0.5 },
        })
        expect(
            generateLayoutSource('lifelog', {
                gravity: 'down',
                cards: [card('a', 'ceiling'), card('a', 'ceiling')],
            }).ok,
        ).toBe(false)
        expect(
            generateLayoutSource('lifelog', {
                gravity: 'down',
                cards: [card('a', 'nonexistent-card')],
            }).ok,
        ).toBe(false)
        // ceiling / floor / sibling id / null are all legal parents
        const ok = generateLayoutSource('lifelog', {
            gravity: 'down',
            cards: [
                card('a', 'ceiling'),
                card('b', 'floor'),
                card('c', 'a'),
                card('d', null),
            ],
        })
        expect(ok.ok).toBe(true)
    })
})

function fakeIo(files: Record<string, string> = {}) {
    const writes: Array<{ path: string; content: string }> = []
    const io: AtelierIo = {
        readFile: async (path) => {
            const hit = Object.entries(files).find(([name]) =>
                path.endsWith(name),
            )
            if (!hit) throw new Error(`unexpected read: ${path}`)
            return hit[1]
        },
        writeFile: async (path, content) => {
            writes.push({ path, content })
        },
    }
    return { io, writes }
}

describe('handleAtelierWrite', () => {
    const root = '/fake/web'

    it('refuses a non-whitelisted target without touching any file', async () => {
        const { io, writes } = fakeIo()
        const result = await handleAtelierWrite(
            { target: 'caddyfile', payload: {} },
            io,
            root,
        )
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toContain('caddyfile')
        expect(writes).toHaveLength(0)
    })

    it('refuses a malformed body without touching any file', async () => {
        const { io, writes } = fakeIo()
        expect((await handleAtelierWrite('garbage', io, root)).ok).toBe(false)
        expect(
            (await handleAtelierWrite({ target: 'physics' }, io, root)).ok,
        ).toBe(false)
        expect(writes).toHaveLength(0)
    })

    it('writes rewritten tokens.css and returns mirror warnings', async () => {
        const { io, writes } = fakeIo({ 'tokens.css': realTokensCss })
        const result = await handleAtelierWrite(
            {
                target: 'tokens',
                payload: { dark: { '--card-padding': '32px' } },
            },
            io,
            root,
        )
        if (!result.ok) throw new Error(result.error)
        expect(result.warnings.join('\n')).toContain('CARD_PADDING')
        expect(writes).toHaveLength(1)
        expect(writes[0]!.path).toBe('/fake/web/src/styles/tokens.css')
        expect(writes[0]!.content).toContain('--card-padding: 32px;')
    })

    it('a failed tokens rewrite leaves the file untouched', async () => {
        const { io, writes } = fakeIo({ 'tokens.css': realTokensCss })
        const result = await handleAtelierWrite(
            { target: 'tokens', payload: { dark: { '--nope': '1px' } } },
            io,
            root,
        )
        expect(result.ok).toBe(false)
        expect(writes).toHaveLength(0)
    })

    it('writes regenerated physicsTuning.ts for a valid physics payload', async () => {
        const { io, writes } = fakeIo()
        const result = await handleAtelierWrite(
            { target: 'physics', payload: { ...physicsTuning, gravityY: 1.1 } },
            io,
            root,
        )
        if (!result.ok) throw new Error(result.error)
        expect(writes).toHaveLength(1)
        expect(writes[0]!.path).toBe('/fake/web/src/physics/physicsTuning.ts')
        expect(writes[0]!.content).toContain('gravityY: 1.1,')
    })

    it('writes a regenerated layout file for a valid layout payload', async () => {
        const { io, writes } = fakeIo()
        const result = await handleAtelierWrite(
            {
                target: 'layout',
                payload: { route: 'lifelog', layout: lifelogLayout },
            },
            io,
            root,
        )
        if (!result.ok) throw new Error(result.error)
        expect(writes).toHaveLength(1)
        expect(writes[0]!.path).toBe('/fake/web/src/routes/Lifelog.layout.ts')
        expect(writes[0]!.content).toContain('export const lifelogLayout')
    })

    it('writes regenerated layoutTuning.ts for a valid chain payload', async () => {
        const { io, writes } = fakeIo()
        const result = await handleAtelierWrite(
            { target: 'chain', payload: { ...layoutTuning, chainGap: 90 } },
            io,
            root,
        )
        if (!result.ok) throw new Error(result.error)
        expect(writes).toHaveLength(1)
        expect(writes[0]!.path).toBe('/fake/web/src/layout/layoutTuning.ts')
        expect(writes[0]!.content).toContain('chainGap: 90,')
    })

    it('rejects an invalid chain payload without writing', async () => {
        const { io, writes } = fakeIo()
        const result = await handleAtelierWrite(
            { target: 'chain', payload: { ...layoutTuning, chainGap: 'wide' } },
            io,
            root,
        )
        expect(result.ok).toBe(false)
        expect(writes).toHaveLength(0)
    })

    it('rejects an invalid physics payload without writing', async () => {
        const { io, writes } = fakeIo()
        const result = await handleAtelierWrite(
            {
                target: 'physics',
                payload: { ...physicsTuning, gravityY: 'fast' },
            },
            io,
            root,
        )
        expect(result.ok).toBe(false)
        expect(writes).toHaveLength(0)
    })
})

describe('vitePluginAtelier', () => {
    it('is dev-serve only — absent from production builds', () => {
        const plugin = vitePluginAtelier()
        expect(plugin.name).toBe('vite-plugin-atelier')
        expect(plugin.apply).toBe('serve')
    })
})
