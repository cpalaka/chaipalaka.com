import { useEffect } from 'react'
import { getPosts } from '../blog/posts'
import { usePeek } from './PeekContext'
import { DwellTracker } from './dwell'
import { peekTuning } from './peekTuning'
import { sidePositionFor, pointerBridged, type Box, type Side } from './peekGeometry'
import { resolvePortalLead, liftPocketBody, pocketIdFromHref } from './peekContent'
import type { PeekStore, PreviewSpec } from './PeekStore'

// Portal links + Pocket footnote references are the only peek triggers. External
// links (annotation cards) are deferred to task-029; in-page anchors never peek.
const TRIGGER_SELECTOR =
    'a[data-link-type="portal"], a[href^="#user-content-fn-"]'

// Nominal preview height for the side-placement clamp; the card measures and
// re-centres its true height once rendered.
const NOMINAL_H = 150

const posts = getPosts().map((p) => ({
    slug: p.slug,
    title: p.frontmatter.title,
    description: p.frontmatter.description,
}))

const sourceIds = new WeakMap<Element, string>()
let sourceSeq = 0
function sourceIdFor(el: Element): string {
    let id = sourceIds.get(el)
    if (!id) {
        id = `src-${sourceSeq++}`
        sourceIds.set(el, id)
    }
    return id
}

function boxOf(el: Element): Box {
    const r = el.getBoundingClientRect()
    return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom }
}

function buildSpec(trigger: HTMLElement, mobile: boolean): PreviewSpec | null {
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const width = mobile
        ? Math.min(peekTuning.previewWidth, viewport.width - 2 * peekTuning.previewMarginPx)
        : peekTuning.previewWidth

    let center: { x: number; y: number }
    let side: Side
    if (mobile) {
        // No side gutters on a full-width column: a non-reflow overlay near the
        // bottom edge, the same edge pinned cards will later live on.
        center = {
            x: viewport.width / 2,
            y: viewport.height - peekTuning.previewMarginPx - NOMINAL_H / 2,
        }
        side = 'right'
    } else {
        const pos = sidePositionFor(
            boxOf(trigger),
            { width, height: NOMINAL_H },
            viewport,
            peekTuning.previewGapPx,
            peekTuning.previewMarginPx,
        )
        center = { x: pos.x, y: pos.y }
        side = pos.side
    }

    const sourceId = sourceIdFor(trigger)
    const href = trigger.getAttribute('href') ?? ''

    if (trigger.dataset.linkType === 'portal') {
        const lead = resolvePortalLead(href, posts)
        return {
            sourceId,
            sourceEl: trigger,
            kind: 'portal',
            center,
            side,
            width,
            href,
            title: lead?.title ?? trigger.textContent?.trim() ?? 'Link',
            lead: lead?.description,
        }
    }

    const pocketId = pocketIdFromHref(href)
    if (!pocketId) return null
    const body = liftPocketBody(pocketId)
    if (!body) return null
    return {
        sourceId,
        sourceEl: trigger,
        kind: 'pocket',
        center,
        side,
        width,
        bodyHtml: body.bodyHtml,
        title: 'Note',
    }
}

/**
 * Wires the Peek interaction over a content-box route's prose: desktop dwell +
 * safe-triangle bridge, mobile tap → bottom overlay, keyboard focus, and the
 * dismiss paths (hover-end / scroll-away / tap-outside). Pure geometry, dwell,
 * content-lift, and lifecycle live in tested sibling modules; this is the glue.
 */
function attach(store: PeekStore): () => void {
    const boxEl = document.querySelector<HTMLElement>('[data-content-box]')
    if (!boxEl) return () => {}
    const scrollEl = boxEl.querySelector<HTMLElement>('.content-box__scroll') ?? boxEl
    const hoverable = window.matchMedia('(hover: hover)').matches

    let dwellTrigger: HTMLElement | null = null
    let heldId: string | null = null
    let heldTrigger: HTMLElement | null = null
    let heldSide: Side = 'right'
    let dismissTimer: ReturnType<typeof setTimeout> | null = null
    let lastScrollTop = scrollEl.scrollTop
    const pointer = { x: 0, y: 0 }

    const dwell = new DwellTracker({
        dwellMs: peekTuning.dwellMs,
        stillPx: peekTuning.dwellStillPx,
        progressDelayMs: peekTuning.dwellProgressDelayMs,
        onProgress: (active) => {
            if (dwellTrigger) dwellTrigger.classList.toggle('peek-dwelling', active)
        },
        onFire: () => {
            if (dwellTrigger) openFor(dwellTrigger)
        },
    })

    function clearDismissTimer() {
        if (dismissTimer) {
            clearTimeout(dismissTimer)
            dismissTimer = null
        }
    }

    function dismissHeld() {
        clearDismissTimer()
        if (heldId) store.dismiss(heldId)
        heldId = null
        heldTrigger = null
    }

    function openFor(trigger: HTMLElement) {
        // A word that already has a pinned card must not re-peek (task-024): a
        // fresh preview could be kept again, double-pinning the same word — two
        // tethers + nested wobble spans. PinnedCard marks its source `pin-word`.
        if (trigger.classList.contains('pin-word')) return
        const spec = buildSpec(trigger, !hoverable)
        if (!spec) return
        trigger.classList.remove('peek-dwelling')
        dwellTrigger = null
        clearDismissTimer()
        heldId = store.open(spec)
        heldTrigger = trigger
        heldSide = spec.side
    }

    function cardRectFor(id: string): Box | null {
        const el = document.querySelector(`[data-peek-id="${id}"]`)
        return el ? boxOf(el) : null
    }

    function bridged(): boolean {
        if (!heldId || !heldTrigger) return false
        const card = cardRectFor(heldId)
        if (!card) return false
        return pointerBridged(pointer, { word: boxOf(heldTrigger), card, side: heldSide })
    }

    // --- desktop dwell ---
    function onPointerOver(e: PointerEvent) {
        if (!hoverable) return
        const target = (e.target as Element | null)?.closest<HTMLElement>(TRIGGER_SELECTOR)
        if (!target || target === dwellTrigger) return
        if (heldTrigger === target) return // already showing for this source
        if (target.classList.contains('pin-word')) return // already pinned — no re-peek
        dwellTrigger = target
        dwell.start(e.clientX, e.clientY)
    }

    function onPointerOut(e: PointerEvent) {
        if (!hoverable) return
        const target = (e.target as Element | null)?.closest<HTMLElement>(TRIGGER_SELECTOR)
        if (target && target === dwellTrigger) {
            const to = e.relatedTarget as Node | null
            if (!to || !target.contains(to)) {
                dwell.cancel()
                target.classList.remove('peek-dwelling')
                dwellTrigger = null
            }
        }
    }

    function onPointerMove(e: PointerEvent) {
        pointer.x = e.clientX
        pointer.y = e.clientY
        if (dwellTrigger) dwell.move(e.clientX, e.clientY)
        if (!heldId) return
        if (bridged()) {
            clearDismissTimer()
        } else if (!dismissTimer) {
            // Heading away from word + card: grace, then fall.
            dismissTimer = setTimeout(dismissHeld, peekTuning.bridgeGraceMs)
        }
    }

    // --- mobile tap ---
    function onPointerDownDoc(e: PointerEvent) {
        const t = e.target as Element | null
        const trigger = t?.closest<HTMLElement>(TRIGGER_SELECTOR)
        if (!hoverable && trigger) {
            // Tap shows the preview rather than navigating; enter is the card body.
            e.preventDefault()
            openFor(trigger)
            return
        }
        // Tap/click outside the card and its source dismisses.
        if (heldId) {
            const inCard = t?.closest(`[data-peek-id="${heldId}"]`)
            const inTrigger = heldTrigger && t ? heldTrigger.contains(t) : false
            if (!inCard && !inTrigger) dismissHeld()
        }
    }

    // --- keyboard focus-or-Enter ---
    function onFocusIn(e: FocusEvent) {
        const trigger = (e.target as Element | null)?.closest<HTMLElement>(TRIGGER_SELECTOR)
        if (trigger) openFor(trigger)
    }
    function onFocusOut(e: FocusEvent) {
        const trigger = (e.target as Element | null)?.closest<HTMLElement>(TRIGGER_SELECTOR)
        if (trigger && trigger === heldTrigger) {
            const to = e.relatedTarget as Node | null
            const intoCard = heldId && to ? !!(to as Element).closest?.(`[data-peek-id="${heldId}"]`) : false
            if (!intoCard) dismissHeld()
        }
    }

    // --- scroll-away (suppressed while the pointer is over card/bridge) ---
    function onScroll() {
        const top = scrollEl.scrollTop
        const moved = Math.abs(top - lastScrollTop)
        lastScrollTop = top
        if (!heldId || moved < peekTuning.scrollDismissGracePx) return
        if (!bridged()) dismissHeld()
    }

    boxEl.addEventListener('pointerover', onPointerOver)
    boxEl.addEventListener('pointerout', onPointerOut)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerdown', onPointerDownDoc)
    boxEl.addEventListener('focusin', onFocusIn)
    boxEl.addEventListener('focusout', onFocusOut)
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
        dwell.cancel()
        clearDismissTimer()
        boxEl.removeEventListener('pointerover', onPointerOver)
        boxEl.removeEventListener('pointerout', onPointerOut)
        window.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerdown', onPointerDownDoc)
        boxEl.removeEventListener('focusin', onFocusIn)
        boxEl.removeEventListener('focusout', onFocusOut)
        scrollEl.removeEventListener('scroll', onScroll)
        window.removeEventListener('scroll', onScroll)
    }
}

export function PeekTriggers() {
    const store = usePeek()
    useEffect(() => attach(store), [store])
    return null
}
