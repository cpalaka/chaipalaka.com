import { ReadingSubstrate } from '../../contentbox/ReadingSubstrate'
import type { TocEntry } from '../../blog/types'

const toc: TocEntry[] = [
    { depth: 2, text: 'Arrived by morph', slug: 'arrived' },
    { depth: 2, text: 'Back across the ladder', slug: 'back' },
]

/**
 * Second content-box route — the hero-morph destination for task-025. A Portal
 * card peeked/pinned on `/test/box` morphs into THIS box; the link below morphs
 * back. The real per-route content arrives when the content box rolls out across
 * the sitemap (task-026); this is the minimal destination needed to prove the
 * card → box morph and the physical default both directions.
 */
export default function BoxB() {
    return (
        <ReadingSubstrate title="The destination box" toc={toc}>
            <p id="arrived">
                You followed a link. The card you clicked on the first box
                expanded and reflowed into this reading surface — the same
                object, one rung further up the ladder. Nothing teleported: the
                shape you were previewing <em>became</em> the page.
            </p>
            <p>
                Chrome navigation — the frame bar, the browser back button, a
                pasted URL — has no source card to grow from, so it takes the
                physical default instead: a light directional crossfade of the
                whole box rather than a morph.
            </p>

            <h2 id="back">Back across the ladder</h2>
            <p>
                Peek or pin{' '}
                <a data-link-type="portal" href="/test/box">
                    the first box
                </a>{' '}
                and click its card to morph back the other way, or use the frame
                bar to feel the physical default.
            </p>
        </ReadingSubstrate>
    )
}
