export interface Film {
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

export interface LetterboxdAdapterOpts {
  user: string
  fetch?: typeof globalThis.fetch
}

function field(xml: string, tag: string): string {
  const escaped = tag.replace(':', '\\:')
  const m = xml.match(
    new RegExp(`<${escaped}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))<\\/${escaped}>`),
  )
  if (!m) return ''
  return (m[1] ?? m[2] ?? '').trim()
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractPoster(description: string): string | undefined {
  const m = description.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : undefined
}

function extractReview(description: string): string | undefined {
  // Remove the poster <p><img …></p> block
  const withoutPoster = description.replace(/<p>\s*<img[^>]+\/>\s*<\/p>/i, '')
  // Strip remaining HTML tags
  const text = withoutPoster.replace(/<[^>]+>/g, '').trim()
  const decoded = decodeEntities(text)
  // Suppress the auto-generated "Watched on …" placeholder
  if (!decoded || /^Watched on /i.test(decoded)) return undefined
  return decoded
}

function parseItems(xml: string): Film[] {
  const films: Film[] = []
  const blocks = xml.split('</item>')
  for (const block of blocks) {
    const start = block.indexOf('<item>')
    if (start === -1) continue
    const item = block.slice(start)

    const guidRaw = field(item, 'guid')
    const idMatch = guidRaw.match(/letterboxd-(?:watch|review)-(\d+)/)
    if (!idMatch) {
      console.warn('[LetterboxdAdapter] skipping item: missing or unrecognised guid')
      continue
    }
    const letterboxdId = idMatch[1]

    const title = decodeEntities(field(item, 'letterboxd:filmTitle') || field(item, 'title'))
    if (!title) {
      console.warn(`[LetterboxdAdapter] skipping item ${letterboxdId}: missing title`)
      continue
    }

    const yearRaw = parseInt(field(item, 'letterboxd:filmYear'), 10)
    const year = !isNaN(yearRaw) ? yearRaw : undefined

    const watchedDate = field(item, 'letterboxd:watchedDate') || undefined

    const ratingRaw = parseFloat(field(item, 'letterboxd:memberRating'))
    const rating = !isNaN(ratingRaw) && ratingRaw > 0 ? ratingRaw : undefined

    const rewatch = field(item, 'letterboxd:rewatch') === 'Yes'

    const link = field(item, 'link')

    const description = field(item, 'description')
    const posterUrl = extractPoster(description)
    const review = extractReview(description)

    films.push({ letterboxdId, title, year, watchedDate, rating, review, posterUrl, rewatch, link })
  }
  return films
}

export class LetterboxdAdapter {
  private readonly user: string
  private readonly fetchFn: typeof globalThis.fetch

  constructor(opts: LetterboxdAdapterOpts) {
    this.user = opts.user
    this.fetchFn = opts.fetch ?? globalThis.fetch
  }

  async fetchFilms(): Promise<Film[]> {
    const url = `https://letterboxd.com/${this.user}/rss/`
    const res = await this.fetchFn(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    })
    if (!res.ok) throw new Error(`Letterboxd RSS returned ${res.status}`)
    const xml = await res.text()
    return parseItems(xml)
  }
}
