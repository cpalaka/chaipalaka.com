/**
 * The v2 **Keep** pointer state machine (spec §4): the title-bar press-hold /
 * arm / drag / drop gesture, with click-vs-drag disambiguation so a small card's
 * body-click (enter) and title-bar press-hold (keep) never collide (AC#2).
 *
 * Drives both call sites with one machine: a held **preview** being kept (the
 * `PreviewCard` title bar) and a **pinned card** being re-dragged (the
 * `PinnedCard` title bar). The call site wires the callbacks — this module owns
 * only the gesture logic, no DOM.
 *
 * Transitions from a press on the title bar:
 *   - **arm** on press ≥ `armPressMs` OR movement > `armMovePx` from the press
 *     origin (the arming move also begins the drag, so there is no lag);
 *   - **click** (enter) on release before arm, within the move threshold;
 *   - **abort** (neither drag nor click) when the pointer leaves the bar before
 *     arm completes;
 *   - **drag** deltas while armed; **drop** (pin) on release after arm.
 * Leaving the bar *after* arm is harmless — a drag in progress continues.
 */

interface PinGestureOpts {
    armPressMs: number
    armMovePx: number
    /** The card has come loose: run the arm animation, begin the drag. */
    onArm: () => void
    /** Incremental drag delta since the last move (px). */
    onDrag: (dx: number, dy: number) => void
    /** Release after arm — pin at the current position. */
    onDrop: () => void
    /** Release before arm within the move threshold — enter. */
    onClick: () => void
    /** Pointer left the bar before arm — abandon the press. */
    onAbort: () => void
}

type Phase = 'idle' | 'pressing' | 'armed'

export class PinGesture {
    private phase: Phase = 'idle'
    private originX = 0
    private originY = 0
    private lastX = 0
    private lastY = 0
    private timer: ReturnType<typeof setTimeout> | null = null

    constructor(private readonly opts: PinGestureOpts) {}

    /** Pointerdown on the title bar. */
    down(x: number, y: number): void {
        this.phase = 'pressing'
        this.originX = this.lastX = x
        this.originY = this.lastY = y
        this.clearTimer()
        this.timer = setTimeout(() => this.arm(), this.opts.armPressMs)
    }

    /** Pointermove (window-level, since the drag escapes the bar). */
    move(x: number, y: number): void {
        if (this.phase === 'pressing') {
            const far =
                Math.hypot(x - this.originX, y - this.originY) > this.opts.armMovePx
            if (far) this.arm()
            else return
        }
        if (this.phase !== 'armed') return
        this.opts.onDrag(x - this.lastX, y - this.lastY)
        this.lastX = x
        this.lastY = y
    }

    /** Pointerup. */
    up(): void {
        if (this.phase === 'pressing') {
            this.reset()
            this.opts.onClick()
        } else if (this.phase === 'armed') {
            this.reset()
            this.opts.onDrop()
        }
    }

    /** The pointer left the title bar (matters only before arm). */
    leaveBar(): void {
        if (this.phase !== 'pressing') return
        this.reset()
        this.opts.onAbort()
    }

    /** Abandon any in-flight gesture (e.g. component unmount). */
    cancel(): void {
        this.reset()
    }

    private arm(): void {
        if (this.phase !== 'pressing') return
        this.clearTimer()
        this.phase = 'armed'
        this.opts.onArm()
    }

    private reset(): void {
        this.clearTimer()
        this.phase = 'idle'
    }

    private clearTimer(): void {
        if (this.timer) clearTimeout(this.timer)
        this.timer = null
    }
}
