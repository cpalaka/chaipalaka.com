export enum GoodreadsShelf {
  CurrentlyReading = 'currently-reading',
  Favorites = 'favorites',
}

export interface Book {
  slug: string
  title: string
  author: string
  status: GoodreadsShelf
  started?: string
  finished?: string
  cover?: string
  rating?: number
}

export interface GoodreadsAdapterOpts {
  userId: string
  fetch?: typeof globalThis.fetch
}

// Extracts content from a named XML tag — handles both CDATA and plain text.
function field(xml: string, tag: string): string {
  const m = xml.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))<\\/${tag}>`),
  )
  if (!m) return ''
  return (m[1] ?? m[2] ?? '').trim()
}

function toIso(dateStr: string): string | undefined {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? undefined : d.toISOString()
}

function parseItems(xml: string, shelf: GoodreadsShelf): Book[] {
  const books: Book[] = []
  const blocks = xml.split('</item>')
  for (const block of blocks) {
    const start = block.indexOf('<item>')
    if (start === -1) continue
    const item = block.slice(start)

    const slug = field(item, 'book_id')
    if (!slug) {
      console.warn('[GoodreadsAdapter] skipping item: missing book_id')
      continue
    }

    const title = field(item, 'title')
    const author = field(item, 'author_name')
    if (!title || !author) {
      console.warn(`[GoodreadsAdapter] skipping item ${slug}: missing required field`)
      continue
    }

    const cover = field(item, 'book_image_url') || undefined
    const ratingRaw = parseInt(field(item, 'user_rating'), 10)
    const rating = !isNaN(ratingRaw) && ratingRaw > 0 ? ratingRaw : undefined
    const started = toIso(field(item, 'user_date_added'))
    const finished = toIso(field(item, 'user_read_at'))

    books.push({ slug, title, author, status: shelf, started, finished, cover, rating })
  }
  return books
}

export class GoodreadsAdapter {
  private readonly userId: string
  private readonly fetchFn: typeof globalThis.fetch

  constructor(opts: GoodreadsAdapterOpts) {
    this.userId = opts.userId
    this.fetchFn = opts.fetch ?? globalThis.fetch
  }

  async fetchBooks(): Promise<Book[]> {
    const [reading, favorites] = await Promise.all([
      this.fetchShelf(GoodreadsShelf.CurrentlyReading),
      this.fetchShelf(GoodreadsShelf.Favorites),
    ])
    return [...reading, ...favorites]
  }

  private async fetchShelf(shelf: GoodreadsShelf): Promise<Book[]> {
    const url = `https://www.goodreads.com/review/list_rss/${this.userId}?shelf=${shelf}`
    const res = await this.fetchFn(url)
    if (!res.ok) throw new Error(`Goodreads ${shelf} returned ${res.status}`)
    const xml = await res.text()
    return parseItems(xml, shelf)
  }
}
