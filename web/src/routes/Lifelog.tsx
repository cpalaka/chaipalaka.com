import { useEffect, useState } from 'react'
import { PhysicsPage, type CardContent } from '../physics/PhysicsPage'
import type { PageDef } from '../physics/PageDef'
import type { Vec2, Viewport } from '../physics/PhysicsWorld'
import './Lifelog.css'

const BOOKS_W = 320
const BOOKS_H = 280

export const booksAnchor = (vp: Viewport): Vec2 => ({ x: vp.width / 2, y: 200 })


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

const pageDef: PageDef = {
    gravity: 'down',
    cards: [
        {
            id: 'lifelog-books',
            kind: 'lifelog',
            parent: 'ceiling',
            anchor: booksAnchor,
        },
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
}

export default function Lifelog() {
    return <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
}
