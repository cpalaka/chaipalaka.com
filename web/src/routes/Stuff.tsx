import { Link } from 'react-router-dom'
import { PhysicsPage } from '../physics/PhysicsPage'
import type { PageDef } from '../physics/PageDef'
import type { CardContent } from '../physics/PhysicsPage'

const pageDef: PageDef = {
    gravity: 'down',
    cards: [
        {
            id: 'stuff-flash',
            kind: 'portfolio',
            parent: 'ceiling',
            anchor: (vp) => ({ x: vp.width * 0.25, y: 200 }),
        },
        {
            id: 'stuff-digital-art',
            kind: 'portfolio',
            parent: 'ceiling',
            anchor: (vp) => ({ x: vp.width * 0.5, y: 200 }),
        },
        {
            id: 'stuff-software',
            kind: 'portfolio',
            parent: 'ceiling',
            anchor: (vp) => ({ x: vp.width * 0.75, y: 200 }),
        },
        {
            id: 'stuff-site',
            kind: 'portfolio',
            parent: 'ceiling',
            anchor: (vp) => ({ x: vp.width * 0.5, y: 420 }),
        },
    ],
}

const cardContent: Record<string, CardContent> = {
    'stuff-flash': {
        text: 'Flash',
        width: 260,
        height: 160,
        children: (
            <>
                <h2>Flash</h2>
                <p>Old Flash animations, restored with Ruffle.</p>
                <Link to="/stuff/flash" className="read-post-link">Browse →</Link>
            </>
        ),
    },
    'stuff-digital-art': {
        text: 'Digital art',
        width: 260,
        height: 160,
        children: (
            <article aria-disabled="true" style={{ opacity: 0.55 }}>
                <h2>Digital art</h2>
                <p>Coming soon.</p>
            </article>
        ),
    },
    'stuff-software': {
        text: 'Software',
        width: 260,
        height: 160,
        children: (
            <article aria-disabled="true" style={{ opacity: 0.55 }}>
                <h2>Software</h2>
                <p>Coming soon.</p>
            </article>
        ),
    },
    'stuff-site': {
        text: 'This site',
        width: 260,
        height: 160,
        children: (
            <article aria-disabled="true" style={{ opacity: 0.55 }}>
                <h2>This site</h2>
                <p>Coming soon.</p>
            </article>
        ),
    },
}

export default function Stuff() {
    return <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
}
