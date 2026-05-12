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

// ─── Films card ──────────────────────────────────────────────────────────────

const FILMS_W = 320
const FILMS_H = 320

export const filmsAnchor = (vp: Viewport): Vec2 => ({ x: vp.width / 2, y: 600 })

interface Film {
    letterboxdId: string
    title: string
    year?: number
    watchedDate?: string
    rating?: number
    review?: string
    posterUrl?: string
    rewatch?: boolean
    link: string
}

interface FilmsApiResponse {
    films: Film[]
    stale: boolean
}

const FILMS_DISPLAY_COUNT = 3

function renderStars(rating: number): string {
    const full = Math.floor(rating)
    const half = rating % 1 >= 0.5
    const empty = 5 - full - (half ? 1 : 0)
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}

function shortDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function FilmsPanel() {
    const [data, setData] = useState<FilmsApiResponse | null>(null)

    useEffect(() => {
        fetch('/api/films')
            .then((r) => r.json() as Promise<FilmsApiResponse>)
            .then(setData)
            .catch(() => setData(null))
    }, [])

    const films = (data?.films ?? []).slice(0, FILMS_DISPLAY_COUNT)

    return (
        <div className="lifelog-films">
            <h2 className="lifelog-films__heading">
                Films
                {data?.stale ? (
                    <span className="lifelog-books__stale">stale</span>
                ) : null}
            </h2>
            {films.length > 0 ? (
                <ul className="lifelog-films__list">
                    {films.map((f) => (
                        <li key={f.letterboxdId} className="lifelog-films__item">
                            {f.posterUrl ? (
                                <img
                                    className="lifelog-films__poster"
                                    src={f.posterUrl}
                                    alt={`${f.title} poster`}
                                    loading="lazy"
                                />
                            ) : null}
                            <div className="lifelog-films__meta">
                                <span className="lifelog-films__title">
                                    {f.title}
                                    {f.year ? (
                                        <span className="lifelog-films__year"> ({f.year})</span>
                                    ) : null}
                                </span>
                                {f.rating !== undefined ? (
                                    <span className="lifelog-films__stars" aria-label={`${f.rating} out of 5 stars`}>
                                        {renderStars(f.rating)}
                                    </span>
                                ) : null}
                                {f.watchedDate ? (
                                    <span className="lifelog-films__date">{shortDate(f.watchedDate)}</span>
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="lifelog-films__empty">—</p>
            )}
        </div>
    )
}

// ─── Activity card ────────────────────────────────────────────────────────────

const ACTIVITY_W = 280
const ACTIVITY_H = 360

export const activityAnchor = (vp: Viewport): Vec2 => ({ x: 200, y: vp.height / 2 })

type ActivityType = 'push' | 'pull_request' | 'issue' | 'release' | 'star'

interface Activity {
    type: ActivityType
    repo: string
    summary: string
    url: string
    ts: string
}

interface ActivityApiResponse {
    activity: Activity[]
    stale: boolean
}

const ACTIVITY_BADGE_LABELS: Record<ActivityType, string> = {
    push: 'push',
    pull_request: 'PR',
    issue: 'issue',
    release: 'release',
    star: 'star',
}

function relTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diff / 60_000)
    if (min < 60) return `${min}m ago`
    const hrs = Math.floor(min / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days}d ago`
    return `${Math.floor(days / 7)}wk ago`
}

function ActivityPanel() {
    const [data, setData] = useState<ActivityApiResponse | null>(null)

    useEffect(() => {
        fetch('/api/github')
            .then((r) => r.json() as Promise<ActivityApiResponse>)
            .then(setData)
            .catch(() => setData(null))
    }, [])

    const items = data?.activity ?? []

    return (
        <div className="lifelog-activity">
            <h2 className="lifelog-activity__heading">
                GitHub
                {data?.stale ? (
                    <span className="lifelog-books__stale">stale</span>
                ) : null}
            </h2>
            {items.length > 0 ? (
                <ul className="lifelog-activity__list">
                    {items.map((a, i) => (
                        <li key={`${a.ts}-${i}`} className="lifelog-activity__item">
                            <span className={`lifelog-activity__badge lifelog-activity__badge--${a.type}`}>
                                {ACTIVITY_BADGE_LABELS[a.type]}
                            </span>
                            <div className="lifelog-activity__body">
                                <a
                                    className="lifelog-activity__summary"
                                    href={a.url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {a.summary}
                                </a>
                                <span className="lifelog-activity__meta">
                                    {a.repo} · {relTime(a.ts)}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="lifelog-activity__empty">—</p>
            )}
        </div>
    )
}

// ─── Page definition ──────────────────────────────────────────────────────────

export const pageDef: PageDef = {
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
        {
            id: 'lifelog-films',
            kind: 'lifelog',
            parent: 'ceiling',
            anchor: filmsAnchor,
        },
        {
            id: 'lifelog-activity',
            kind: 'lifelog',
            parent: 'ceiling',
            anchor: activityAnchor,
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
    'lifelog-films': {
        text: 'Films',
        width: FILMS_W,
        height: FILMS_H,
        minimizable: true,
        label: 'Films',
        children: <FilmsPanel />,
    },
    'lifelog-activity': {
        text: 'GitHub',
        width: ACTIVITY_W,
        height: ACTIVITY_H,
        minimizable: true,
        label: 'GitHub',
        children: <ActivityPanel />,
    },
}

export default function Lifelog() {
    return <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
}
