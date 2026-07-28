/**
 * Park geometry — the edge-anchored ("parked") pinned-card regime.
 *
 * Written for the TASK-043 board-staleness sweep (2026-07-28), which re-tested
 * TASK-035's symptoms against current `main` under drift. Kept as the standing
 * harness so a future session re-measures rather than rebuilds it.
 *
 * Two things make this trustworthy, and both must survive edits:
 *
 *  1. **Calibration.** The known-bad control (gravity mode) must reproduce a
 *     falling card, and the rope control must show the pull-only tether actually
 *     contracting. An instrument that cannot see the defect cannot certify its
 *     absence — without these, a clean reading here would mean nothing.
 *  2. **Steady state, never a single frame.** A soft system is mid-settle one
 *     frame after any action, so every positional verdict is taken after motion
 *     stops (`runToSteadyState`), not sampled.
 *
 * Geometry mirrors TASK-035's original observation: viewport 1280x860, content
 * box 680x480 centred (ContentBox.tsx CONTENT_BOX_WIDTH/HEIGHT) => box top 190,
 * box bottom 670 — the "fold bottom ~670" the symptom was reported against.
 */

import { describe, test, expect } from 'vitest'
import { PhysicsWorld } from '../physics/PhysicsWorld'
import { pinTuning } from './pinTuning'
import { edgeAttachPoint } from '../physics/Tether'

const DT = 1000 / 60

const VIEWPORT = { width: 1280, height: 860 }
const BOX = { x: 300, y: 190, width: 680, height: 480 }
const BOX_TOP = BOX.y
const BOX_BOTTOM = BOX.y + BOX.height

const CARD = { width: 240, height: 160 }
const PARK_REST = CARD.height / 2 + pinTuning.parkGapPx

/** Deterministic RNG so drift wander is reproducible run-to-run. */
function seededRng(seed: number): () => number {
    let s = seed >>> 0
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0
        return s / 0x100000000
    }
}

function makeWorld(mode: 'drift' | 'gravity') {
    const world = new PhysicsWorld({
        viewport: VIEWPORT,
        mode,
        rng: seededRng(12345),
    })
    world.setContentBox(BOX)
    return world
}

/**
 * Run until per-frame displacement stays under `eps` for 30 consecutive frames,
 * or the budget runs out. Returns `settled` so a never-settles case is visible
 * rather than silently read as a position.
 */
function runToSteadyState(
    world: PhysicsWorld,
    handle: number,
    maxFrames = 3000,
    eps = 0.01,
): { frames: number; settled: boolean } {
    let prev = world.getPosition(handle)
    let quiet = 0
    for (let i = 0; i < maxFrames; i++) {
        world.tick(DT)
        const now = world.getPosition(handle)
        const moved = Math.hypot(now.x - prev.x, now.y - prev.y)
        prev = now
        quiet = moved < eps ? quiet + 1 : 0
        if (quiet >= 30) return { frames: i + 1, settled: true }
    }
    return { frames: maxFrames, settled: false }
}

/** Park a card at an edge the way PinnedCard.parkAt does (non-reduced path). */
function parkNonReduced(
    world: PhysicsWorld,
    cardHandle: number,
    edgeHandle: number,
) {
    const cardPos = world.getPosition(cardHandle)
    const { anchorA, length } = edgeAttachPoint(world, edgeHandle, cardPos)
    const tether = world.tether.add(edgeHandle, cardHandle, length, anchorA)
    world.tether.setLength(tether, PARK_REST)
    return tether
}

describe('park geometry — instrument calibration (must stay green)', () => {
    test('box edge anchors sit exactly on the box top/bottom lines', () => {
        const world = makeWorld('drift')
        expect(world.getAnchor(world.contentBoxTopHandle!).y).toBeCloseTo(BOX_TOP, 5)
        expect(world.getAnchor(world.contentBoxBottomHandle!).y).toBeCloseTo(
            BOX_BOTTOM,
            5,
        )
    })

    test('KNOWN-BAD control: gravity mode really does pull a free body down', () => {
        // If this stops failing-downward, the harness can no longer detect a
        // hanging card, and every drift reading below becomes meaningless.
        const world = makeWorld('gravity')
        const h = world.registerById('ctl', { x: 640, y: 300 }, CARD)
        const y0 = world.getPosition(h).y
        for (let i = 0; i < 60; i++) world.tick(DT)
        expect(world.getPosition(h).y).toBeGreaterThan(y0 + 5)
    })

    test('drift mode has no sustained downward acceleration', () => {
        // Drift wander DOES displace the body, so magnitude alone is the wrong
        // discriminator; what separates drift from gravity is sign + growth.
        const d = makeWorld('drift')
        const dh = d.registerById('ctl', { x: 640, y: 300 }, CARD)
        const dy0 = d.getPosition(dh).y
        for (let i = 0; i < 600; i++) d.tick(DT)
        const driftDisp = d.getPosition(dh).y - dy0

        const g = makeWorld('gravity')
        const gh = g.registerById('ctl', { x: 640, y: 300 }, CARD)
        const gy0 = g.getPosition(gh).y
        for (let i = 0; i < 60; i++) g.tick(DT)
        const gShort = g.getPosition(gh).y - gy0
        for (let i = 0; i < 540; i++) g.tick(DT)
        const gLong = g.getPosition(gh).y - gy0

        expect(gShort).toBeGreaterThan(0) // gravity falls…
        expect(gLong).toBeGreaterThan(gShort) // …and keeps accumulating
        expect(Math.abs(driftDisp)).toBeLessThan(gLong)
    })

    test('INSTRUMENT CONTROL: the pull-only rope contracts a displaced card under drift', () => {
        // Without this, "the rope never recovers the card" below could just be a
        // mis-wired tether in this file rather than real behaviour.
        const world = makeWorld('drift')
        const card = world.registerById('c', { x: 640, y: 400 }, CARD)
        parkNonReduced(world, card, world.contentBoxTopHandle!)
        const d0 = Math.abs(world.getPosition(card).y - BOX_TOP)
        runToSteadyState(world, card)
        const d1 = Math.abs(world.getPosition(card).y - BOX_TOP)
        expect(d1).toBeLessThan(d0)
        expect(d1).toBeLessThan(PARK_REST * 2)
    })
})

/**
 * ⚠️ KNOWN DEFECTS as of 2026-07-28 (TASK-043 sweep).
 *
 * The assertions below encode BUGS, not desired behaviour. They exist so the
 * defects are pinned and measurable, and they are wired to TASK-035 AC#7 and
 * AC#8. **When TASK-035 fixes these, these tests go RED — that is the intended
 * signal. Update the assertions to the fixed behaviour; do NOT revert the fix.**
 */
describe('park geometry — KNOWN DEFECTS (see TASK-035 AC#7/#8)', () => {
    test('DEFECT (AC#7): reduced-motion top-park lands INSIDE the box, over the prose', () => {
        // PinnedCard.parkAt reduced branch: y = edgeAnchor.y + parkRest, the same
        // expression for both edges, so only the bottom edge gets the right sign.
        const topPark = BOX_TOP + PARK_REST
        const bottomPark = BOX_BOTTOM + PARK_REST
        const insideBox = (y: number) => y > BOX_TOP && y < BOX_BOTTOM
        expect(insideBox(topPark)).toBe(true) // ← the bug
        expect(insideBox(bottomPark)).toBe(false) // bottom edge is correct
    })

    test('DEFECT (AC#7): at driftScale 0 no force can correct a mis-placed parked card', () => {
        // Reduced motion sets driftScale 0; prose repel is BINARY-gated on
        // driftScale > 0, so the mis-placement above is permanent, not transient.
        // Complement asserted too: at driftScale 1 the card genuinely does move.
        const still = makeWorld('drift')
        still.setDriftScale(0)
        const h1 = still.registerById('r', { x: 640, y: BOX_TOP + 40 }, CARD)
        const y0 = still.getPosition(h1).y
        for (let i = 0; i < 300; i++) still.tick(DT)
        expect(Math.abs(still.getPosition(h1).y - y0)).toBeLessThan(0.5)

        const live = makeWorld('drift')
        live.setDriftScale(1)
        const h2 = live.registerById('r', { x: 640, y: BOX_TOP + 40 }, CARD)
        const y0b = live.getPosition(h2).y
        for (let i = 0; i < 300; i++) live.tick(DT)
        expect(Math.abs(live.getPosition(h2).y - y0b)).toBeGreaterThan(0.5)
    })

    test('DEFECT (AC#8): parked-bottom is clipped off-screen below viewport height 816', () => {
        // cardBottom = boxBottom + parkRest + h/2, boxBottom = (vh + 480)/2.
        // NOT the "box-bottom-edge vs fold-region mismatch" TASK-035 claimed —
        // anchors and fold agree exactly (asserted in the calibration block).
        const cardBottomAt = (vh: number) =>
            (vh + 480) / 2 + PARK_REST + CARD.height / 2
        expect(cardBottomAt(860)).toBeLessThan(860) // desktop: on-screen by 22px
        expect(cardBottomAt(800)).toBeGreaterThan(800) // ← clipped by 8px
        expect(cardBottomAt(700)).toBeGreaterThan(700) // ← clipped by 58px
    })

    test('DEFECT (AC#7 root cause): a fast scroll strands the card off-screen under drift', () => {
        // The translate-pair carries the card by the FULL scroll delta before
        // stepRegime parks it, so parkAt ropes from an off-screen position. Under
        // gravity the fall recovered it in ~23 frames; drift removed that
        // accidental corrective force and nothing replaces it.
        const world = makeWorld('drift')
        const card = world.registerById('c', { x: 640, y: 400 }, CARD)
        world.translate(card, { x: 0, y: -2000 })
        parkNonReduced(world, card, world.contentBoxTopHandle!)

        let returned = false
        for (let i = 0; i < 3000; i++) {
            world.tick(DT)
            const y = world.getPosition(card).y
            if (y - CARD.height / 2 > 0 && y + CARD.height / 2 < VIEWPORT.height) {
                returned = true
                break
            }
        }
        expect(returned).toBe(false) // ← the bug: never comes back
        expect(world.getPosition(card).y).toBeLessThan(0) // still above the fold
    })

    test('CONTRAST: the same fast scroll DID recover under the pre-drift gravity model', () => {
        // Calibration for the claim "drift made it worse" — not a defect itself.
        const world = makeWorld('gravity')
        const card = world.registerById('c', { x: 640, y: 400 }, CARD)
        world.translate(card, { x: 0, y: -2000 })
        parkNonReduced(world, card, world.contentBoxTopHandle!)

        let frames = -1
        for (let i = 0; i < 3000; i++) {
            world.tick(DT)
            const y = world.getPosition(card).y
            if (y - CARD.height / 2 > 0 && y + CARD.height / 2 < VIEWPORT.height) {
                frames = i + 1
                break
            }
        }
        expect(frames).toBeGreaterThan(0)
        expect(frames).toBeLessThan(120) // recovered in well under 2 seconds
    })
})
