/**
 * Hover-intent tracker for desktop peek: fires only after the cursor is held
 * within `stillPx` for `dwellMs` (a deliberate pause on a link), so sweeping the
 * cursor across many links while reading never spawns previews (spec §4, AC#2).
 *
 * A movement beyond `stillPx` from the dwell origin restarts the dwell from the
 * new point; sub-threshold jitter is tolerated. Optionally reports a
 * dwell-progress flag (the "keep hovering" hint) once `progressDelayMs` elapses.
 */

interface DwellOpts {
    dwellMs: number
    stillPx: number
    onFire: () => void
    progressDelayMs?: number
    onProgress?: (active: boolean) => void
}

export class DwellTracker {
    private origin: { x: number; y: number } | null = null
    private fireTimer: ReturnType<typeof setTimeout> | null = null
    private progressTimer: ReturnType<typeof setTimeout> | null = null

    constructor(private readonly opts: DwellOpts) {}

    /** Begin (or restart) a dwell at this point. */
    start(x: number, y: number): void {
        this.origin = { x, y }
        this.schedule()
    }

    /** Feed a pointer move; restarts the dwell if it strayed past the threshold. */
    move(x: number, y: number): void {
        if (!this.origin) return
        const dx = x - this.origin.x
        const dy = y - this.origin.y
        if (Math.hypot(dx, dy) > this.opts.stillPx) this.start(x, y)
    }

    /** Abort any pending dwell and clear the progress hint. */
    cancel(): void {
        this.clear()
        this.origin = null
        this.opts.onProgress?.(false)
    }

    private schedule(): void {
        this.clear()
        this.fireTimer = setTimeout(() => {
            this.opts.onProgress?.(false)
            this.opts.onFire()
        }, this.opts.dwellMs)
        if (this.opts.onProgress && this.opts.progressDelayMs != null) {
            this.progressTimer = setTimeout(
                () => this.opts.onProgress?.(true),
                this.opts.progressDelayMs,
            )
        }
    }

    private clear(): void {
        if (this.fireTimer) clearTimeout(this.fireTimer)
        if (this.progressTimer) clearTimeout(this.progressTimer)
        this.fireTimer = null
        this.progressTimer = null
    }
}
