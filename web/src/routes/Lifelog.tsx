import { useEffect, useState } from 'react'
import { PhysicsPage, type CardContent } from '../physics/PhysicsPage'
import { listNotes } from '../lib/NotesReader'
import type { PageDef } from '../physics/PageDef'
import type { Vec2, Viewport } from '../physics/PhysicsWorld'
import './Lifelog.css'

const BOOKS_W = 240
const BOOKS_H = 160
const NOTE_W = 200
const NOTE_H = 240

export const booksAnchor = (vp: Viewport): Vec2 => ({ x: vp.width / 2, y: 200 })

export const NOTE_FAN_OFFSET_X = 200
export const NOTE_BASE_OFFSET_Y = 280
export const NOTE_ROW_STEP_Y = 260

export function noteAnchor(i: number) {
    return (vp: Viewport): Vec2 => {
        const base = booksAnchor(vp)
        const side = i % 2 === 0 ? -NOTE_FAN_OFFSET_X : NOTE_FAN_OFFSET_X
        const row = Math.floor(i / 2)
        return {
            x: base.x + side,
            y: base.y + NOTE_BASE_OFFSET_Y + row * NOTE_ROW_STEP_Y,
        }
    }
}

type BookShelf = 'currently-reading'

interface Book {
    slug: string
    title: string
    author: string
    status: BookShelf
    started?: string
    finished?: string
    cover?: string
    rating?: number
}

interface BooksApiResponse {
    books: Book[]
    stale: boolean
}

const STATUS_LABELS: Record<BookShelf, string> = {
    'currently-reading': 'Reading',
}

function BooksPanel() {
    const [data, setData] = useState<BooksApiResponse | null>(null)

    useEffect(() => {
        fetch('/api/books')
            .then((r) => r.json() as Promise<BooksApiResponse>)
            .then(setData)
            .catch(() => setData(null))
    }, [])

    const books = data?.books ?? []

    return (
        <div className="lifelog-books">
            <h2 className="lifelog-books__heading">
                Books
                {data?.stale ? (
                    <span className="lifelog-books__stale">stale</span>
                ) : null}
            </h2>
            {books.length > 0 ? (
                <ul className="lifelog-books__list">
                    {books.map((b) => (
                        <li key={b.slug} className="lifelog-books__item">
                            <span
                                className={`lifelog-books__status lifelog-books__status--${b.status}`}
                            >
                                {STATUS_LABELS[b.status]}
                            </span>
                            <span className="lifelog-books__title">{b.title}</span>
                            <span className="lifelog-books__author">{b.author}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="lifelog-books__empty">—</p>
            )}
        </div>
    )
}

const bookNotes = listNotes({ parent: 'lifelog:books' })

const pageDef: PageDef = {
    gravity: 'down',
    cards: [
        {
            id: 'lifelog-books',
            kind: 'lifelog',
            parent: 'ceiling',
            anchor: booksAnchor,
        },
        ...bookNotes.map((n, i) => ({
            id: `note-${n.slug}`,
            kind: 'note' as const,
            parent: 'lifelog-books',
            anchor: noteAnchor(i),
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
        children: <BooksPanel />,
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
