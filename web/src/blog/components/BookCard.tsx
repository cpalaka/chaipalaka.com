import { useState, useEffect } from 'react'
import './BookCard.css'

type BookShelf = 'currently-reading' | 'favorites'

interface BookFromApi {
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
    books: BookFromApi[]
    stale: boolean
}

const STATUS_LABELS: Record<BookShelf, string> = {
    'currently-reading': 'Reading',
    favorites: 'Favorite',
}

// Module-level promise: all <BookCard> instances on a page share one /api/books request.
let booksPromise: Promise<BooksApiResponse> | null = null
function fetchBooks(): Promise<BooksApiResponse> {
    if (!booksPromise) {
        booksPromise = fetch('/api/books').then(
            (r) => r.json() as Promise<BooksApiResponse>,
        )
    }
    return booksPromise
}

export interface BookCardProps {
    slug: string
}

export function BookCard({ slug }: BookCardProps) {
    const [book, setBook] = useState<BookFromApi | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBooks()
            .then(({ books }) => {
                setBook(books.find((b) => b.slug === slug) ?? null)
            })
            .catch(() => setBook(null))
            .finally(() => setLoading(false))
    }, [slug])

    if (loading)
        return <span className="book-card book-card--placeholder">—</span>
    if (!book)
        return <span className="book-card book-card--placeholder">—</span>

    const coverIsUrl = book.cover?.startsWith('http') === true

    return (
        <div className="book-card">
            {coverIsUrl ? (
                <img
                    className="book-card__cover"
                    src={book.cover}
                    alt={`Cover of ${book.title}`}
                    loading="lazy"
                />
            ) : null}
            <div className="book-card__body">
                <span
                    className={`book-card__status book-card__status--${book.status}`}
                >
                    {STATUS_LABELS[book.status]}
                </span>
                <p className="book-card__title">{book.title}</p>
                <p className="book-card__author">{book.author}</p>
            </div>
        </div>
    )
}
