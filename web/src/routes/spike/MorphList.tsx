import { Link, useViewTransitionState } from 'react-router-dom'
import { SPIKE_CARDS, type SpikeCard } from './data'

const HERO_NAME = 'morph-hero'

function MorphCard({ card }: { card: SpikeCard }) {
    const to = `/spike/morph/${card.id}`
    // True only while a viewTransition-navigation to THIS card is in flight, so
    // only the clicked card claims the shared name — the other cards never
    // collide on it. After the nav settles, the name reverts to none.
    const isTransitioning = useViewTransitionState(to)
    return (
        <Link
            to={to}
            viewTransition
            className="spike-card"
            style={
                isTransitioning ? { viewTransitionName: HERO_NAME } : undefined
            }
        >
            <h2 className="spike-card-title">{card.title}</h2>
            <p className="spike-card-blurb">{card.blurb}</p>
        </Link>
    )
}

export default function MorphList() {
    return (
        <>
            <h1 className="spike-h1">Hero-morph spike (task-019)</h1>
            <p className="spike-lede">
                Click a card — it expands and reflows into the destination
                content box via a browser-native View Transition.
            </p>
            <ul className="spike-grid">
                {SPIKE_CARDS.map((card) => (
                    <li key={card.id}>
                        <MorphCard card={card} />
                    </li>
                ))}
            </ul>
        </>
    )
}
