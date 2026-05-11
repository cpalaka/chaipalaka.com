import { describe, expect, it, vi } from 'vitest';
import { GoodreadsShelf, type Book } from './adapters/GoodreadsAdapter';
import { handle } from './server';

const FIXTURE_BOOKS: Book[] = [
  {
    slug: '44767458',
    title: 'Dune',
    author: 'Frank Herbert',
    status: GoodreadsShelf.CurrentlyReading,
    cover: 'https://images.gr-assets.com/books/1555447414m/44767458.jpg',
  },
  {
    slug: '29579',
    title: 'Foundation',
    author: 'Isaac Asimov',
    status: GoodreadsShelf.Favorites,
    rating: 5,
  },
]

function makeAdapter(books: Book[] = FIXTURE_BOOKS, fail = false) {
  return { fetchBooks: vi.fn(async () => { if (fail) throw new Error('upstream'); return books }) }
}

describe('handle', () => {
  it('GET /api/health → 200 with {ok: true, version}', async () => {
    const res = await handle(
      new Request('http://localhost/api/health'),
      { version: 'abc1234' },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ ok: true, version: 'abc1234' });
  });

  it('falls back to "dev" when no version is configured', async () => {
    const res = await handle(new Request('http://localhost/api/health'), {});

    expect(await res.json()).toEqual({ ok: true, version: 'dev' });
  });

  it('unknown route → 404', async () => {
    const res = await handle(
      new Request('http://localhost/api/does-not-exist'),
      { version: 'abc1234' },
    );

    expect(res.status).toBe(404);
  });
});

describe('/api/books', () => {
  it('returns { books, stale: false } with the adapter results', async () => {
    const adapter = makeAdapter()
    const res = await handle(
      new Request('http://localhost/api/books'),
      { goodreadsUserId: 'u1', booksAdapter: adapter },
    )

    expect(res.status).toBe(200)
    const body = await res.json() as { books: Book[]; stale: boolean }
    expect(body.stale).toBe(false)
    expect(body.books).toHaveLength(2)
    expect(body.books[0]?.slug).toBe('44767458')
  })

  it('returns empty books (not stale) when goodreadsUserId is absent', async () => {
    const res = await handle(
      new Request('http://localhost/api/books'),
      {},
    )

    expect(res.status).toBe(200)
    const body = await res.json() as { books: Book[]; stale: boolean }
    expect(body.books).toEqual([])
    expect(body.stale).toBe(false)
  })

  it('returns empty books with stale:true when adapter throws and cache is cold', async () => {
    const adapter = makeAdapter([], true)
    const { CacheLayer } = await import('./cache/CacheLayer')
    const res = await handle(
      new Request('http://localhost/api/books'),
      { goodreadsUserId: 'u1', booksAdapter: adapter, cache: new CacheLayer() },
    )

    expect(res.status).toBe(200)
    const body = await res.json() as { books: Book[]; stale: boolean }
    expect(body.books).toEqual([])
    expect(body.stale).toBe(true)
  })

  it('caches: calls fetchBooks only once across two requests within TTL', async () => {
    const adapter = makeAdapter()
    const { CacheLayer } = await import('./cache/CacheLayer')
    const cache = new CacheLayer()

    await handle(
      new Request('http://localhost/api/books'),
      { goodreadsUserId: 'u1', booksAdapter: adapter, cache },
    )
    await handle(
      new Request('http://localhost/api/books'),
      { goodreadsUserId: 'u1', booksAdapter: adapter, cache },
    )

    expect(adapter.fetchBooks).toHaveBeenCalledTimes(1)
  })
});
