// task-019 spike — throwaway fixture content for the morph proof.
export interface SpikeCard {
    id: string
    title: string
    blurb: string
    body: string
}

export const SPIKE_CARDS: SpikeCard[] = [
    {
        id: 'tethers',
        title: 'Word-anchored tethers',
        blurb: 'A word becomes a pin; a card hangs from it.',
        body: 'The destination content box. On a real client navigation the card you clicked expands and reflows into this box via a shared-element morph. On an unsupported browser this is just a plain instant navigation — same content, no animation.',
    },
    {
        id: 'ladder',
        title: 'The link ladder',
        blurb: 'Peek → keep → enter, one continuous gesture.',
        body: 'The destination content box. The morph makes the ladder continuous: the thing you previewed visibly becomes the page, rather than a hard cut between two unrelated screens.',
    },
    {
        id: 'box',
        title: 'The content box',
        blurb: 'A route is a box plus sparse pinned cards.',
        body: 'The destination content box. A v2 page is a reading box over the shader substrate, not a swarm of cards — so navigation morphs the source card into this box.',
    },
]
