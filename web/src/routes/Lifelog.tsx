import { useEffect, useState } from 'react'
import { PhysicsPage, type CardContent } from '../physics/PhysicsPage'
import type { PageDef } from '../physics/PageDef'
import type { Vec2, Viewport } from '../physics/PhysicsWorld'
import './Lifelog.css'

// ─── Books card ──────────────────────────────────────────────────────────────

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

// ─── Now-playing card ─────────────────────────────────────────────────────────

const NOW_PLAYING_W = 280
const NOW_PLAYING_H = 180

export const nowPlayingAnchor = (vp: Viewport): Vec2 => ({ x: vp.width - 200, y: 80 })

interface Track {
    artist: string
    title: string
    album?: string
    albumArt?: string
    isNowPlaying: boolean
}

interface NowPlayingApiResponse {
    track: Track | null
    stale: boolean
}

const NOW_PLAYING_POLL_MS = 60_000

function NowPlayingPanel() {
    const [data, setData] = useState<NowPlayingApiResponse | null>(null)

    useEffect(() => {
        const poll = () => {
            fetch('/api/now-playing')
                .then((r) => r.json() as Promise<NowPlayingApiResponse>)
                .then(setData)
                .catch(() => {})
        }
        poll()
        const id = setInterval(poll, NOW_PLAYING_POLL_MS)
        return () => clearInterval(id)
    }, [])

    const track = data?.track ?? null

    return (
        <div className="lifelog-now-playing">
            <h2 className="lifelog-now-playing__heading">
                Music
                {data?.stale ? (
                    <span className="lifelog-books__stale">stale</span>
                ) : null}
            </h2>
            {track ? (
                <div className="lifelog-now-playing__track">
                    {track.albumArt ? (
                        <img
                            className="lifelog-now-playing__art"
                            src={track.albumArt}
                            alt={track.album ? `${track.album} cover` : `${track.title} cover`}
                            loading="lazy"
                        />
                    ) : null}
                    <div className="lifelog-now-playing__info">
                        {track.isNowPlaying ? (
                            <span className="lifelog-now-playing__live">
                                <span className="lifelog-now-playing__dot" aria-hidden="true" />
                                now playing
                            </span>
                        ) : null}
                        <p className="lifelog-now-playing__title">{track.title}</p>
                        <p className="lifelog-now-playing__artist">{track.artist}</p>
                    </div>
                </div>
            ) : (
                <p className="lifelog-now-playing__empty">—</p>
            )}
        </div>
    )
}

// ─── Page definition ──────────────────────────────────────────────────────────

const pageDef: PageDef = {
    gravity: 'down',
    cards: [
        {
            id: 'lifelog-books',
            kind: 'lifelog',
            parent: 'ceiling',
            anchor: booksAnchor,
        },
        {
            id: 'lifelog-now-playing',
            kind: 'lifelog',
            parent: 'ceiling',
            anchor: nowPlayingAnchor,
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
    'lifelog-now-playing': {
        text: 'Music',
        width: NOW_PLAYING_W,
        height: NOW_PLAYING_H,
        minimizable: true,
        label: 'Music',
        children: <NowPlayingPanel />,
    },
}

export default function Lifelog() {
    return <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
}
