import { PhysicsPage, type CardContent } from '../physics/PhysicsPage'
import { listNotes } from '../lib/NotesReader'
import type { PageDef } from '../physics/PageDef'
import './Lifelog.css'

const BOOKS_W = 240
const BOOKS_H = 160
const NOTE_W = 200
const NOTE_H = 100

const booksChildren = (
    <div className="lifelog-books">
        <h2 className="lifelog-books__heading">Books</h2>
        <p className="lifelog-books__empty">—</p>
    </div>
)

const bookNotes = listNotes({ parent: 'lifelog:books' })

const pageDef: PageDef = {
    gravity: 'down',
    cards: [
        { id: 'lifelog-books', kind: 'lifelog', parent: 'ceiling' },
        ...bookNotes.map((n) => ({
            id: `note-${n.slug}`,
            kind: 'note' as const,
            parent: 'lifelog-books',
        })),
    ],
}

const cardContent: Record<string, CardContent> = {
    'lifelog-books': {
        text: 'Books',
        width: BOOKS_W,
        height: BOOKS_H,
        minimizable: true,
        label: 'Books',
        children: booksChildren,
    },
    ...Object.fromEntries(
        bookNotes.map((n) => [
            `note-${n.slug}`,
            {
                text: n.frontmatter.date,
                width: NOTE_W,
                height: NOTE_H,
                children: (
                    <>
                        <time style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.5rem' }}>
                            {n.frontmatter.date}
                        </time>
                        <n.Component />
                    </>
                ),
            } satisfies CardContent,
        ]),
    ),
}

export default function Lifelog() {
    return <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
}
