import type {
    PhysicsHandle,
    PhysicsWorld,
    TetherHandle,
    Vec2,
    Viewport,
} from '../../physics/PhysicsWorld'
import type { PrimitiveStep } from './types'

export interface AnchorSlideTargets {
    fromIds: readonly string[]
    toIds: readonly string[]
}

export interface AnchorSlideOpts {
    axis: 'horizontal' | 'vertical'
    sign: 1 | -1
    durationMs: number
    viewport: Viewport
}

const OFFSCREEN_PAD = 100

interface TweenSpec {
    th: TetherHandle
    start: Vec2
    end: Vec2
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

function findTetherByChild(
    world: PhysicsWorld,
    handle: PhysicsHandle,
):
    | {
          handle: TetherHandle
          anchorA: Vec2
      }
    | undefined {
    for (const t of world.listTetherRecords()) {
        if (t.child !== handle) continue
        const anchorA: Vec2 = t.anchorA ? { ...t.anchorA } : { x: 0, y: 0 }
        return { handle: t.handle, anchorA }
    }
    return undefined
}

/**
 * Coupled cross-route transition (T3 horizontal / T4 vertical).
 *
 * Cards remain *dynamic* throughout the slide. Each strung card's tether
 * origin (body-local `anchorA` on the rope's parent body) is tween'd along
 * `axis × -sign`, and the existing pull-only rope force drags the card
 * naturally. This preserves a slight pendulum swing that the previous
 * kinematic implementation flattened.
 *
 * Wall on the side motion crosses is put in sensor mode for the duration,
 * so dynamic cards pass through without collision-resolution impulses.
 *
 * Cards without a tether (detached / free cards) are skipped — anchorSlide
 * is for *strung* cards per the PRD. From-card tethers are left intact;
 * TransitionDirector unregisters those bodies next via `registry.release`.
 */
export function anchorSlide(
    world: PhysicsWorld,
    targets: AnchorSlideTargets,
    opts: AnchorSlideOpts,
): PrimitiveStep {
    const { axis, sign, durationMs, viewport } = opts
    let elapsedMs = 0
    let initialized = false

    const tweens: TweenSpec[] = []
    let destinationSide: 'left' | 'right' | null = null

    const horizontalSpan = viewport.width + OFFSCREEN_PAD
    const verticalSpan = viewport.height + OFFSCREEN_PAD

    // Motion direction in world-space (axis × -sign)
    const offset: Vec2 =
        axis === 'horizontal'
            ? { x: -sign * horizontalSpan, y: 0 }
            : { x: 0, y: -sign * verticalSpan }

    return (dtMs) => {
        if (!initialized) {
            if (axis === 'horizontal') {
                destinationSide = sign === 1 ? 'left' : 'right'
                world.setWallSensor(destinationSide, true)
            }

            for (const id of targets.fromIds) {
                const handle = world.getHandleById(id)
                if (handle === undefined) continue
                const t = findTetherByChild(world, handle)
                if (!t) continue
                tweens.push({
                    th: t.handle,
                    start: { ...t.anchorA },
                    end: { x: t.anchorA.x + offset.x, y: t.anchorA.y + offset.y },
                })
            }

            for (const id of targets.toIds) {
                const handle = world.getHandleById(id)
                if (handle === undefined) continue
                const t = findTetherByChild(world, handle)
                if (!t) continue
                const startAnchor: Vec2 = {
                    x: t.anchorA.x + offset.x,
                    y: t.anchorA.y + offset.y,
                }
                world.setTetherAnchorA(t.handle, startAnchor)
                tweens.push({
                    th: t.handle,
                    start: startAnchor,
                    end: { ...t.anchorA },
                })
            }

            initialized = true
        }

        elapsedMs += dtMs
        const tRaw = Math.min(elapsedMs / durationMs, 1)
        const eased = easeOutCubic(tRaw)

        for (const tw of tweens) {
            world.setTetherAnchorA(tw.th, {
                x: tw.start.x + (tw.end.x - tw.start.x) * eased,
                y: tw.start.y + (tw.end.y - tw.start.y) * eased,
            })
        }

        if (tRaw >= 1) {
            // Snap exactly to the end values so to-cards land on their
            // original anchor and from-cards' rope origins finish off-screen
            // (purely cosmetic since those bodies are released next tick).
            for (const tw of tweens) {
                world.setTetherAnchorA(tw.th, { x: tw.end.x, y: tw.end.y })
            }
            if (destinationSide) world.setWallSensor(destinationSide, false)
            return true
        }
        return false
    }
}
