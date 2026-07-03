/**
 * vite-plugin-atelier — the Atelier's write-back endpoint.
 *
 * Dev-serve-only middleware (same idiom as serveLocalAssets /
 * vite-plugin-feeds): POST /__atelier/write {target, payload} against a hard
 * whitelist of files designed for write-back. All-or-nothing: a write that
 * cannot be applied in full is rejected with the files untouched. Rewriters
 * and codegen are pure exports, tested string-in → string-out.
 *
 * See docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { z } from 'zod'
import type { Cardinal, CardKind } from '../physics/PageSpec'

export interface TokenEdits {
    dark?: Record<string, string>
    light?: Record<string, string>
}

export type RewriteResult =
    | { ok: true; css: string }
    | { ok: false; error: string }

/** A {start, end} slice of the stylesheet covering one block's inner text. */
interface BlockSpan {
    start: number
    end: number
}

/**
 * Replaces every comment's contents with spaces, preserving indices, so
 * selector/at-rule anchors never match inside a comment (the tokens.css
 * header comment mentions `:root` and the light media query verbatim).
 */
function maskComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
}

/**
 * Locates the inner text span of the block opened by the first occurrence of
 * `anchor` (searching from `from`), brace-matched so nested blocks are fine.
 * Searches `masked` (comment-stripped) text; spans are valid for the
 * original css because masking preserves indices.
 */
function blockSpanAfter(
    masked: string,
    anchor: string,
    from = 0,
): BlockSpan | null {
    const at = masked.indexOf(anchor, from)
    if (at === -1) return null
    const open = masked.indexOf('{', at)
    if (open === -1) return null
    let depth = 1
    for (let i = open + 1; i < masked.length; i++) {
        if (masked[i] === '{') depth++
        else if (masked[i] === '}' && --depth === 0) {
            return { start: open + 1, end: i }
        }
    }
    return null
}

/**
 * The four theme blocks of tokens.css. Dark is declared at `:root` and
 * re-asserted at `[data-theme='dark']`; light is declared twice (media query
 * + `[data-theme='light']`) — the dual-declaration foot-gun this rewriter
 * exists to handle in one place.
 */
function themeBlocks(css: string):
    | {
          rootDark: BlockSpan
          mediaLight: BlockSpan
          themeLight: BlockSpan
          themeDark: BlockSpan
      }
    | { error: string } {
    const masked = maskComments(css)
    const rootDark = blockSpanAfter(masked, ':root')
    if (!rootDark) return { error: 'tokens.css: no :root block found' }
    const media = masked.indexOf('@media (prefers-color-scheme: light)')
    if (media === -1) {
        return { error: 'tokens.css: no light media-query block found' }
    }
    const mediaLight = blockSpanAfter(masked, ':root', media)
    if (!mediaLight) {
        return { error: 'tokens.css: no :root inside the light media query' }
    }
    const themeLight = blockSpanAfter(masked, ":root[data-theme='light']")
    if (!themeLight) {
        return { error: "tokens.css: no [data-theme='light'] block found" }
    }
    const themeDark = blockSpanAfter(masked, ":root[data-theme='dark']")
    if (!themeDark) {
        return { error: "tokens.css: no [data-theme='dark'] block found" }
    }
    // Spans must be disjoint — overlap means the scanner misidentified a
    // block and a rewrite would silently corrupt the file.
    const ordered = [rootDark, mediaLight, themeLight, themeDark]
        .slice()
        .sort((a, b) => a.start - b.start)
    for (let i = 1; i < ordered.length; i++) {
        if (ordered[i]!.start < ordered[i - 1]!.end) {
            return { error: 'tokens.css: theme blocks could not be told apart' }
        }
    }
    return { rootDark, mediaLight, themeLight, themeDark }
}

/**
 * Replaces the value of `--prop` inside one block's inner text. Returns null
 * when the property is not declared in that block.
 */
function replaceInBlock(
    blockText: string,
    prop: string,
    value: string,
): string | null {
    const re = new RegExp(`(${prop}\\s*:\\s*)[^;]*(;)`)
    if (!re.test(blockText)) return null
    return blockText.replace(re, `$1${value}$2`)
}

export type GenerateResult =
    | { ok: true; source: string }
    | { ok: false; error: string }

/** Numbers print like a human wrote them: tiny magnitudes in e-notation. */
function fmtNum(v: number): string {
    return v !== 0 && Math.abs(v) < 1e-3 ? v.toExponential() : String(v)
}

/**
 * The canonical shape of physicsTuning.ts — keys in order with their doc
 * comments. After the first write-back this generator IS the source of
 * truth for the file's prose; the byte-identical regen test keeps the two
 * from drifting in the meantime.
 */
const PHYSICS_FIELDS: ReadonlyArray<{ key: string; doc: string }> = [
    {
        key: 'gravityY',
        doc: "    /** Gravity magnitude applied along the route's Cardinal direction. */",
    },
    {
        key: 'buoyancyGain',
        doc: "    /** Multiplier on the anti-gravity force applied to 'balloon' bodies. */",
    },
    {
        key: 'tetherStiffness',
        doc: `    /**
     * Per-tick "acceleration scale" converting tether overshoot into a force
     * (multiplied by body mass at the apply site). The 1e-9-stiffness
     * matter.js constraint that used to back the tether was vestigial —
     * issue #108 cut it, so this number alone now drives rope physics.
     * Hand-tuned to match the behaviour cards exhibited in May 2026; do not
     * change without a matching pendulum-settle regression review.
     */`,
    },
    {
        key: 'slackFactor',
        doc: `    /**
     * A tether is drawn slack (sagging bezier) when the parent–child
     * distance is below this fraction of its length. Single-sourced so rope
     * physics and StringLayer sag drawing move together.
     */`,
    },
    {
        key: 'flingVelocityScale',
        doc: '    /** Pointer-velocity multiplier applied when a dragged card is released. */',
    },
    {
        key: 'flingPauseMs',
        doc: '    /** Pause longer than this before release and the fling is cancelled. */',
    },
    {
        key: 'exitKick',
        doc: '    /** Velocity kick along the buoyancy axis when a tether is cut on exit. */',
    },
    {
        key: 'pourInBaseDelayMs',
        doc: '    /** Delay after the exit primitive starts before the first card drops in. */',
    },
    {
        key: 'pourInStaggerMs',
        doc: '    /** Additional per-card delay between successive pour-in drops. */',
    },
    {
        key: 'pourInTweenMs',
        doc: "    /** Duration of one card's pour-in position tween. */",
    },
    {
        key: 'pourInHardCeilingMs',
        doc: '    /** Hard ceiling that finalizes any still-in-flight pour-in entries. */',
    },
    {
        key: 'stringCutHardCeilingMs',
        doc: '    /** Hard ceiling that finalizes a string-cut drop still in flight. */',
    },
    {
        key: 'anchorSlideDurationMs',
        doc: '    /** Duration of a coupled anchor-slide transition. */',
    },
    {
        key: 'decoupledOverlapMs',
        doc: '    /** Overlap between exit and enter primitives in a decoupled transition. */',
    },
    {
        key: 'reducedMotionMs',
        doc: '    /** Cross-fade duration used when prefers-reduced-motion is set. */',
    },
]

const PHYSICS_HEADER = `/**
 * The single home for the site's physics/transition feel constants.
 *
 * Shape rules (the Atelier physics axis regenerates this file whole):
 *   - One flat, mutable data literal — no computed values, no spreads.
 *   - Read-at-use: consumers read \`physicsTuning.x\` at the moment of use —
 *     per tick for gravity/stiffness, per event for fling/kick/transition
 *     timings — never captured into a closure or engine state at
 *     construction. This is what lets a dev slider act on a running world.
 *   - Tests import from this module; they never copy these literals.
 */
`

/**
 * Whole-file regeneration of physicsTuning.ts. The payload must carry
 * exactly the known keys, all finite numbers — anything else rejects the
 * write with the file untouched.
 */
export function generatePhysicsTuningSource(
    values: Record<string, number>,
): GenerateResult {
    const known = new Set(PHYSICS_FIELDS.map((f) => f.key))
    for (const key of Object.keys(values)) {
        if (!known.has(key)) {
            return { ok: false, error: `physics: unknown key ${key}` }
        }
    }
    const entries: string[] = []
    for (const field of PHYSICS_FIELDS) {
        const v = values[field.key]
        if (v === undefined) {
            return { ok: false, error: `physics: missing key ${field.key}` }
        }
        if (typeof v !== 'number' || !Number.isFinite(v)) {
            return {
                ok: false,
                error: `physics: ${field.key} must be a finite number`,
            }
        }
        entries.push(`${field.doc}\n    ${field.key}: ${fmtNum(v)},`)
    }
    const source =
        PHYSICS_HEADER +
        'export const physicsTuning = {\n' +
        entries.join('\n') +
        '\n}\n\nexport type PhysicsTuning = typeof physicsTuning\n'
    return { ok: true, source }
}

/**
 * The canonical shape of layoutTuning.ts — keys in order with their doc
 * comments, plus the fixed notify/subscribe footer. Like the physics
 * generator, after the first write-back this IS the source of truth for
 * the file's prose; the byte-identical regen test keeps the two aligned.
 */
const LAYOUT_TUNING_FIELDS: ReadonlyArray<{ key: string; doc: string }> = [
    {
        key: 'chainGap',
        doc: '    /** Vertical gap between stacked chain cards, edge to edge. */',
    },
    {
        key: 'chainTop',
        doc: "    /** Y of the first chain card's top edge, below the physics ceiling. */",
    },
    {
        key: 'navCardW',
        doc: '    /** Inline nav card width. */',
    },
    {
        key: 'navCardH',
        doc: '    /** Inline nav card height. */',
    },
    {
        key: 'navTopInset',
        doc: '    /** Back-nav top edge sits this far below the ceiling. */',
    },
    {
        key: 'navBottomInset',
        doc: '    /** Next-nav bottom edge sits this far above the floor. */',
    },
]

const LAYOUT_TUNING_HEADER = `/**
 * The single home for the chain-layout constants (the Atelier chain axis
 * regenerates this file whole).
 *
 * Shape rules, matching physicsTuning.ts:
 *   - One flat, mutable data literal — no computed values, no spreads.
 *   - Read-at-use: consumers read \`layoutTuning.x\` when they partition or
 *     lay out a chain — never captured into a module-level computed const.
 *   - Tests import from this module; they never copy these literals.
 *
 * Unlike physics (read per tick), chain layout is pull-based: after
 * mutating values, call notifyLayoutTuning() so chain routes rebuild and
 * re-partition. Layout spacing guardrail: parent/child spacing must stay
 * ≥ card height + 60px — tether lengths derive from the layout.
 */
`

const LAYOUT_TUNING_FOOTER = `
export type LayoutTuning = typeof layoutTuning

const listeners = new Set<() => void>()

/** Chain routes re-partition on notify; the Atelier chain binding calls
 * this after writing new values onto the literal. */
export function notifyLayoutTuning(): void {
    for (const listener of listeners) listener()
}

export function subscribeLayoutTuning(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}
`

/**
 * Whole-file regeneration of layoutTuning.ts. The payload must carry
 * exactly the known keys, all finite numbers — anything else rejects the
 * write with the file untouched.
 */
export function generateLayoutTuningSource(
    values: Record<string, number>,
): GenerateResult {
    const known = new Set(LAYOUT_TUNING_FIELDS.map((f) => f.key))
    for (const key of Object.keys(values)) {
        if (!known.has(key)) {
            return { ok: false, error: `chain: unknown key ${key}` }
        }
    }
    const entries: string[] = []
    for (const field of LAYOUT_TUNING_FIELDS) {
        const v = values[field.key]
        if (v === undefined) {
            return { ok: false, error: `chain: missing key ${field.key}` }
        }
        if (typeof v !== 'number' || !Number.isFinite(v)) {
            return {
                ok: false,
                error: `chain: ${field.key} must be a finite number`,
            }
        }
        entries.push(`${field.doc}\n    ${field.key}: ${fmtNum(v)},`)
    }
    const source =
        LAYOUT_TUNING_HEADER +
        'export const layoutTuning = {\n' +
        entries.join('\n') +
        '\n}\n' +
        LAYOUT_TUNING_FOOTER
    return { ok: true, source }
}

/**
 * Scatter routes whose layout lives in a regenerable `.layout.ts` data file.
 */
const LAYOUT_TARGETS: Record<string, { file: string; exportName: string }> = {
    lifelog: {
        file: 'src/routes/Lifelog.layout.ts',
        exportName: 'lifelogLayout',
    },
    stuff: { file: 'src/routes/Stuff.layout.ts', exportName: 'stuffLayout' },
}

const CARDINALS = [
    'down',
    'up',
    'left',
    'right',
] as const satisfies readonly Cardinal[]
const CARD_KINDS = [
    'lifelog',
    'blog',
    'portfolio',
    'note',
    'link',
    'headline',
    'nav',
] as const satisfies readonly CardKind[]
// Compile-time exhaustiveness: adding a Cardinal or CardKind to PageSpec
// without registering it here fails typecheck instead of rejecting layouts.
const _cardinalsExhaustive: [
    Exclude<Cardinal, (typeof CARDINALS)[number]>,
] extends [never]
    ? true
    : never = true
const _kindsExhaustive: [
    Exclude<CardKind, (typeof CARD_KINDS)[number]>,
] extends [never]
    ? true
    : never = true
void _cardinalsExhaustive
void _kindsExhaustive

// Ids land in generated single-quoted source — keep them to a safe charset.
const IDENT = /^[A-Za-z0-9_-]+$/

const layoutSchema = z
    .object({
        // Optional now that drift is the default (spec §3.2): a gravity-less
        // (drift) layout must validate, and the regen must round-trip it without
        // re-inserting a gravity line.
        gravity: z.enum(CARDINALS).optional(),
        cards: z
            .array(
                z
                    .object({
                        id: z.string().regex(IDENT),
                        kind: z.enum(CARD_KINDS),
                        parent: z.string().regex(IDENT).nullable(),
                        anchor: z
                            .object({ fx: z.number(), fy: z.number() })
                            .strict(),
                    })
                    .strict(),
            )
            .min(1),
    })
    .strict()

/**
 * Whole-file regeneration of a scatter route's `.layout.ts`. Fraction-only:
 * computed (closure) anchors cannot round-trip through write-back and are
 * rejected by the schema. All-or-nothing — any invalid card rejects the
 * whole layout.
 */
export function generateLayoutSource(
    route: string,
    layout: unknown,
): GenerateResult {
    const target = LAYOUT_TARGETS[route]
    if (!target)
        return { ok: false, error: `layout: route ${route} not whitelisted` }

    const parsed = layoutSchema.safeParse(layout)
    if (!parsed.success) {
        return {
            ok: false,
            error: `layout: ${parsed.error.issues[0]?.message ?? 'invalid payload'}`,
        }
    }
    const { gravity, cards } = parsed.data

    const ids = new Set<string>()
    for (const card of cards) {
        if (ids.has(card.id)) {
            return { ok: false, error: `layout: duplicate card id ${card.id}` }
        }
        ids.add(card.id)
    }
    for (const card of cards) {
        const p = card.parent
        if (
            p !== null &&
            p !== 'ceiling' &&
            p !== 'floor' &&
            (!ids.has(p) || p === card.id)
        ) {
            return {
                ok: false,
                error: `layout: ${card.id} has unresolved parent ${p}`,
            }
        }
    }

    const cardEntries = cards.map((c) => {
        const parent = c.parent === null ? 'null' : `'${c.parent}'`
        return `        {
            id: '${c.id}',
            kind: '${c.kind}',
            parent: ${parent},
            anchor: { fx: ${String(c.anchor.fx)}, fy: ${String(c.anchor.fy)} },
        },`
    })
    // Emit the gravity line only when the layout carries gravity (drift routes
    // omit it) so the regenerated file round-trips a gravity-less layout.
    const gravityLine = gravity !== undefined ? `    gravity: '${gravity}',\n` : ''
    const source =
        "import type { RouteLayout } from './routeLayout'\n\n" +
        '// Pure data literal — the Atelier regenerates this file whole on write-back.\n' +
        `export const ${target.exportName} = {\n` +
        gravityLine +
        '    cards: [\n' +
        cardEntries.join('\n') +
        '\n    ],\n' +
        '} satisfies RouteLayout\n'
    return { ok: true, source }
}

/**
 * Tokens with TS mirrors — values duplicated in TypeScript for pre-paint
 * measurement. V1 warns and never auto-edits the TS side; the drift tests
 * (fonts.test.ts) are the backstop.
 */
const TOKEN_MIRRORS: Record<string, string> = {
    '--font-body': 'FONT_BODY in src/text/fonts.ts (pretext measurement)',
    '--font-mono': 'FONT_MONO in src/text/fonts.ts (pretext measurement)',
    '--card-padding': 'CARD_PADDING in src/routes/blog/BlogIndex.measure.ts',
    '--card-gap': 'CARD_GAP in src/routes/blog/BlogIndex.measure.ts',
}

/**
 * Warnings for edits that touch mirrored tokens. The panel surfaces these;
 * the write itself still proceeds.
 */
export function mirrorWarnings(edits: TokenEdits): string[] {
    const props = new Set([
        ...Object.keys(edits.dark ?? {}),
        ...Object.keys(edits.light ?? {}),
    ])
    const warnings: string[] = []
    for (const prop of props) {
        const mirror = TOKEN_MIRRORS[prop]
        if (mirror) {
            warnings.push(
                `${prop} has a TS mirror: ${mirror} — update it manually to avoid drift`,
            )
        }
    }
    return warnings
}

/**
 * Value-only replacement of custom-property declarations in tokens.css,
 * preserving comments and order. All-or-nothing: every requested property
 * must match or the whole rewrite is rejected.
 *
 * Dark edits must match in `:root` (the dark source of truth) and are synced
 * into the `[data-theme='dark']` re-assert block when declared there. Light
 * edits must match in BOTH light blocks — the two are duplicates by design
 * and may not drift.
 */
export function rewriteTokensCss(
    css: string,
    edits: TokenEdits,
): RewriteResult {
    const blocks = themeBlocks(css)
    if ('error' in blocks) return { ok: false, error: blocks.error }

    // Property names and values land verbatim in the stylesheet — refuse
    // anything that could terminate the declaration or block early.
    for (const group of [edits.dark, edits.light]) {
        for (const [prop, value] of Object.entries(group ?? {})) {
            if (!/^--[\w-]+$/.test(prop)) {
                return {
                    ok: false,
                    error: `tokens.css: ${prop} is not a custom property`,
                }
            }
            if (/[;{}]/.test(value)) {
                return {
                    ok: false,
                    error: `tokens.css: invalid value for ${prop}`,
                }
            }
        }
    }

    const texts = {
        rootDark: css.slice(blocks.rootDark.start, blocks.rootDark.end),
        mediaLight: css.slice(blocks.mediaLight.start, blocks.mediaLight.end),
        themeLight: css.slice(blocks.themeLight.start, blocks.themeLight.end),
        themeDark: css.slice(blocks.themeDark.start, blocks.themeDark.end),
    }

    for (const [prop, value] of Object.entries(edits.dark ?? {})) {
        const next = replaceInBlock(texts.rootDark, prop, value)
        if (next === null) {
            return {
                ok: false,
                error: `tokens.css: ${prop} not declared in :root`,
            }
        }
        texts.rootDark = next
        // keep the [data-theme='dark'] re-assert in sync when it declares it
        const reassert = replaceInBlock(texts.themeDark, prop, value)
        if (reassert !== null) texts.themeDark = reassert
    }

    for (const [prop, value] of Object.entries(edits.light ?? {})) {
        const inMedia = replaceInBlock(texts.mediaLight, prop, value)
        const inTheme = replaceInBlock(texts.themeLight, prop, value)
        if (inMedia === null || inTheme === null) {
            return {
                ok: false,
                error: `tokens.css: ${prop} not declared in both light blocks`,
            }
        }
        texts.mediaLight = inMedia
        texts.themeLight = inTheme
    }

    // Reassemble the disjoint spans in document order.
    const spans: Array<[BlockSpan, string]> = (
        [
            [blocks.rootDark, texts.rootDark],
            [blocks.mediaLight, texts.mediaLight],
            [blocks.themeLight, texts.themeLight],
            [blocks.themeDark, texts.themeDark],
        ] as Array<[BlockSpan, string]>
    ).sort((a, b) => a[0].start - b[0].start)
    let out = ''
    let cursor = 0
    for (const [span, text] of spans) {
        out += css.slice(cursor, span.start) + text
        cursor = span.end
    }
    out += css.slice(cursor)
    return { ok: true, css: out }
}

// ---------------------------------------------------------------------------
// Write endpoint
// ---------------------------------------------------------------------------

export interface AtelierIo {
    readFile(path: string): Promise<string>
    writeFile(path: string, content: string): Promise<void>
}

export type WriteResponse =
    | { ok: true; warnings: string[] }
    | { ok: false; error: string }

const writeBodySchema = z.object({ target: z.string(), payload: z.unknown() })

const tokensPayloadSchema = z
    .object({
        dark: z.record(z.string(), z.string()).optional(),
        light: z.record(z.string(), z.string()).optional(),
    })
    .strict()

const physicsPayloadSchema = z.record(z.string(), z.number())

const layoutPayloadSchema = z
    .object({ route: z.string(), layout: z.unknown() })
    .strict()

function deepEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true
    if (
        typeof a !== 'object' ||
        typeof b !== 'object' ||
        a === null ||
        b === null
    ) {
        return false
    }
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    return keysA.every((k) =>
        deepEqual(
            (a as Record<string, unknown>)[k],
            (b as Record<string, unknown>)[k],
        ),
    )
}

/**
 * Extracts the data literal out of generated source and evaluates it, so a
 * regen target can be verified to round-trip before anything is written.
 */
function extractDataLiteral(source: string): unknown {
    const m = source.match(/export const \w+ = ({[\s\S]*?})(\n\n| satisfies )/)
    if (!m) return undefined
    try {
        return new Function(`return (${m[1]})`)() as unknown
    } catch {
        return undefined
    }
}

/**
 * Dispatches one write request against the hard whitelist of write-back
 * targets. All-or-nothing: any validation failure returns an error with no
 * file touched. The `io` seam exists so tests can prove that.
 *
 * Targets: tokens | physics | chain | layout.
 */
export async function handleAtelierWrite(
    body: unknown,
    io: AtelierIo,
    root: string,
): Promise<WriteResponse> {
    const parsedBody = writeBodySchema.safeParse(body)
    if (!parsedBody.success) {
        return { ok: false, error: 'expected a {target, payload} body' }
    }
    const { target, payload } = parsedBody.data

    if (target === 'tokens') {
        const parsed = tokensPayloadSchema.safeParse(payload)
        if (!parsed.success) {
            return {
                ok: false,
                error: 'tokens: payload must be {dark?, light?} maps',
            }
        }
        const path = join(root, 'src/styles/tokens.css')
        const css = await io.readFile(path)
        const result = rewriteTokensCss(css, parsed.data)
        if (!result.ok) return result
        await io.writeFile(path, result.css)
        return { ok: true, warnings: mirrorWarnings(parsed.data) }
    }

    if (target === 'physics') {
        const parsed = physicsPayloadSchema.safeParse(payload)
        if (!parsed.success) {
            return {
                ok: false,
                error: 'physics: payload must be a map of numbers',
            }
        }
        const result = generatePhysicsTuningSource(parsed.data)
        if (!result.ok) return result
        if (!deepEqual(extractDataLiteral(result.source), parsed.data)) {
            return {
                ok: false,
                error: 'physics: generated source failed verification',
            }
        }
        await io.writeFile(
            join(root, 'src/physics/physicsTuning.ts'),
            result.source,
        )
        return { ok: true, warnings: [] }
    }

    if (target === 'chain') {
        const parsed = physicsPayloadSchema.safeParse(payload)
        if (!parsed.success) {
            return {
                ok: false,
                error: 'chain: payload must be a map of numbers',
            }
        }
        const result = generateLayoutTuningSource(parsed.data)
        if (!result.ok) return result
        if (!deepEqual(extractDataLiteral(result.source), parsed.data)) {
            return {
                ok: false,
                error: 'chain: generated source failed verification',
            }
        }
        await io.writeFile(
            join(root, 'src/layout/layoutTuning.ts'),
            result.source,
        )
        return { ok: true, warnings: [] }
    }

    if (target === 'layout') {
        const parsed = layoutPayloadSchema.safeParse(payload)
        if (!parsed.success) {
            return {
                ok: false,
                error: 'layout: payload must be {route, layout}',
            }
        }
        const result = generateLayoutSource(
            parsed.data.route,
            parsed.data.layout,
        )
        if (!result.ok) return result
        if (!deepEqual(extractDataLiteral(result.source), parsed.data.layout)) {
            return {
                ok: false,
                error: 'layout: generated source failed verification',
            }
        }
        const layoutTarget = LAYOUT_TARGETS[parsed.data.route]!
        await io.writeFile(join(root, layoutTarget.file), result.source)
        return { ok: true, warnings: [] }
    }

    return {
        ok: false,
        error: `target ${target} is not whitelisted for write-back`,
    }
}

/**
 * The Atelier write-back endpoint: POST /__atelier/write {target, payload}.
 * `apply: 'serve'` keeps the plugin out of builds entirely; there is no
 * preview-server hook either — the endpoint exists only under `vite dev`.
 */
export function vitePluginAtelier(): Plugin {
    return {
        name: 'vite-plugin-atelier',
        apply: 'serve',
        configureServer(server) {
            const io: AtelierIo = {
                readFile: (path) => readFile(path, 'utf-8'),
                writeFile: (path, content) => writeFile(path, content, 'utf-8'),
            }
            server.middlewares.use('/__atelier/write', (req, res) => {
                void (async () => {
                    if (req.method !== 'POST') {
                        res.statusCode = 405
                        res.end(
                            JSON.stringify({ ok: false, error: 'POST only' }),
                        )
                        return
                    }
                    const chunks: Buffer[] = []
                    for await (const chunk of req) {
                        chunks.push(chunk as Buffer)
                    }
                    let body: unknown
                    try {
                        body = JSON.parse(
                            Buffer.concat(chunks).toString('utf-8'),
                        )
                    } catch {
                        body = undefined
                    }
                    const result = await handleAtelierWrite(
                        body,
                        io,
                        server.config.root,
                    )
                    res.statusCode = result.ok ? 200 : 400
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(result))
                })().catch((err: unknown) => {
                    res.statusCode = 500
                    res.end(JSON.stringify({ ok: false, error: String(err) }))
                })
            })
        },
    }
}
