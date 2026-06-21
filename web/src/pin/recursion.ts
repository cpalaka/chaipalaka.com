/**
 * One level of **ladder recursion** (spec §9): a Portal/Pocket link *inside a
 * pinned card's content* can itself peek and keep, pinning a **child pin** roped
 * to its **parent card** (not a word) via the generic card-parent **Tether**
 * (`wireTetherFor` `parentKind: 'card'`). NotesChain is **not** involved — it was
 * removed in ADR-0001 §9.
 *
 * This is the pure core: `resolvePinHost` reads a trigger's DOM ancestry to
 * decide whether/how it peeks, enforcing the **one-level cap** (a link inside a
 * *child* card does not spawn a further pin); `childHandlesOf` collects a root
 * pin's direct children so its word-anchored translate-pair can carry the whole
 * **bonded subtree** (spike G5). DOM-free except for the `Element.closest`
 * ancestry reads, which happy-dom provides — so both are unit tested headlessly.
 */

export type PinHost =
    /** A content-box prose link → a word-anchored root pin. */
    | { kind: 'root' }
    /** A link inside a root pinned card → a child pin roped to `parentId`. */
    | { kind: 'child'; parentId: string }
    /** Not peekable: inside a child card (cap), inside a preview, or nowhere. */
    | { kind: 'suppress' }

/**
 * Decide how a peek trigger pins, from where it sits in the v2 layout:
 *  - inside a pinned card that is itself a child (`data-pin-parent`) → suppress
 *    (the one-level cap — a child's content does not spawn further pins);
 *  - inside a (root) pinned card → a child of that card;
 *  - inside a held preview (`data-peek-id`) → suppress (previews are ephemeral);
 *  - inside the content box → a root pin;
 *  - anywhere else → suppress.
 */
export function resolvePinHost(trigger: Element): PinHost {
    const card = trigger.closest('[data-pin-id]')
    if (card) {
        if (card.hasAttribute('data-pin-parent')) return { kind: 'suppress' }
        return { kind: 'child', parentId: card.getAttribute('data-pin-id')! }
    }
    if (trigger.closest('[data-peek-id]')) return { kind: 'suppress' }
    if (trigger.closest('[data-content-box]')) return { kind: 'root' }
    return { kind: 'suppress' }
}

/**
 * The direct children of a root pin: every entry whose `parentId` is `parentId`,
 * resolved to a physics handle. A child not yet resolvable (its `PinnedCard` has
 * not registered its body this frame) is skipped, so the caller carries only
 * live bodies. One level deep, so a flat scan over the snapshot suffices.
 */
export function childHandlesOf<H>(
    entries: readonly { id: string; parentId?: string }[],
    parentId: string,
    resolve: (id: string) => H | undefined,
): H[] {
    const out: H[] = []
    for (const e of entries) {
        if (e.parentId !== parentId) continue
        const h = resolve(e.id)
        if (h !== undefined) out.push(h)
    }
    return out
}
