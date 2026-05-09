import { useState, useEffect } from 'react'
import { PhysicsCard } from '../physics/PhysicsCard'
import { cardLayout, type CardAnchor } from '../physics/CardLayout'
import './Lifelog.css'

type BookStatus = 'reading' | 'finished' | 'abandoned' | 'want-to-read'

interface BookFromApi {
  slug: string
  title: string
  author: string
  status: BookStatus
}

interface BooksApiResponse {
  books: BookFromApi[]
  stale: boolean
}

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: 'Reading',
  finished: 'Finished',
  abandoned: 'Abandoned',
  'want-to-read': 'Want to Read',
}

const BOOKS_CARD_HEIGHT = 320
const BOOKS_CARD_MAX_WIDTH = 360
const GUTTER = 16

function computeBookAnchor(): CardAnchor {
  const vp = { width: window.innerWidth, height: window.innerHeight }
  const numCols = vp.width >= 1024 ? 3 : vp.width >= 480 ? 2 : 1
  const colWidth = vp.width / numCols
  const w = Math.min(BOOKS_CARD_MAX_WIDTH, colWidth - GUTTER * 2)
  const anchors = cardLayout(
    [{ id: 'books', text: 'Books', fontKey: 'body', width: w, height: BOOKS_CARD_HEIGHT }],
    vp,
    () => ({ width: 0, height: 0 }),
  )
  // cardLayout always returns one anchor for one spec
  return anchors[0] ?? { id: 'books', x: vp.width / 2, y: BOOKS_CARD_HEIGHT / 2 + 80, width: w, height: BOOKS_CARD_HEIGHT, maxWidth: w }
}

interface BooksListProps {
  books: BookFromApi[]
  stale: boolean
}

function BooksList({ books, stale }: BooksListProps) {
  return (
    <div className="lifelog-books">
      <h2 className="lifelog-books__heading">
        Books
        {stale ? <span className="lifelog-books__stale">stale</span> : null}
      </h2>
      {books.length === 0 ? (
        <p className="lifelog-books__empty">No books yet.</p>
      ) : (
        <ul className="lifelog-books__list">
          {books.map(book => (
            <li key={book.slug} className="lifelog-books__item">
              <span className={`lifelog-books__status lifelog-books__status--${book.status}`}>
                {STATUS_LABELS[book.status]}
              </span>
              <span className="lifelog-books__title">{book.title}</span>
              <span className="lifelog-books__author">{book.author}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function BooksPlaceholder() {
  return (
    <div className="lifelog-books">
      <h2 className="lifelog-books__heading">Books</h2>
      <p className="lifelog-books__empty">—</p>
    </div>
  )
}

export default function Lifelog() {
  const [anchor, setAnchor] = useState<CardAnchor | null>(null)
  const [booksData, setBooksData] = useState<BooksApiResponse | null>(null)
  const [fetchFailed, setFetchFailed] = useState(false)

  useEffect(() => {
    setAnchor(computeBookAnchor())
    const onResize = () => setAnchor(computeBookAnchor())
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    fetch('/api/books')
      .then(r => r.json() as Promise<BooksApiResponse>)
      .then(data => setBooksData(data))
      .catch(() => setFetchFailed(true))
  }, [])

  if (!anchor) return null

  return (
    <PhysicsCard
      text="Books"
      fontKey="body"
      maxWidth={anchor.maxWidth}
      anchor={{ x: anchor.x, y: anchor.y }}
      width={anchor.width}
      height={anchor.height}
    >
      {fetchFailed || booksData === null ? (
        <BooksPlaceholder />
      ) : (
        <BooksList books={booksData.books} stale={booksData.stale} />
      )}
    </PhysicsCard>
  )
}
