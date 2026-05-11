import { describe, expect, it, vi } from 'vitest';
import { GoodreadsShelf, type Book } from './adapters/GoodreadsAdapter';
import type { Track } from './adapters/LastFmAdapter';
import type { Film } from './adapters/LetterboxdAdapter';
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
    status: GoodreadsShelf.CurrentlyReading,
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

const FIXTURE_TRACKS: Track[] = [
  {
    artist: 'Radiohead',
    title: 'Paranoid Android',
    album: 'OK Computer',
    mbid: '9c1cc072-a88a-43a3-ab49-6c5c5a0dd8bc',
    albumArt: 'https://lastfm.freetls.fastly.net/i/u/300x300/cover.png',
    isNowPlaying: true,
  },
  {
    artist: 'Radiohead',
    title: 'Exit Music (For a Film)',
    album: 'OK Computer',
    isNowPlaying: false,
    ts: new Date(1715256000 * 1000).toISOString(),
  },
];

function makeLastFmAdapter(tracks: Track[] = FIXTURE_TRACKS, fail = false) {
  return {
    fetchRecentTracks: vi.fn(async (_limit: number) => {
      if (fail) throw new Error('upstream lastfm');
      return tracks;
    }),
  };
}

describe('/api/now-playing', () => {
  it('returns { track, stale: false } with the first track from the adapter', async () => {
    const adapter = makeLastFmAdapter();
    const res = await handle(
      new Request('http://localhost/api/now-playing'),
      { lastfmApiKey: 'key', lastfmUser: 'chai', lastfmAdapter: adapter },
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { track: Track; stale: boolean };
    expect(body.stale).toBe(false);
    expect(body.track?.title).toBe('Paranoid Android');
    expect(body.track?.isNowPlaying).toBe(true);
  });

  it('returns { track: null, stale: false } when lastfmApiKey is absent', async () => {
    const res = await handle(new Request('http://localhost/api/now-playing'), {});

    expect(res.status).toBe(200);
    const body = await res.json() as { track: null; stale: boolean };
    expect(body.track).toBeNull();
    expect(body.stale).toBe(false);
  });

  it('returns { track: null, stale: true, error } when adapter throws and cache is cold', async () => {
    const adapter = makeLastFmAdapter([], true);
    const { CacheLayer } = await import('./cache/CacheLayer');
    const res = await handle(
      new Request('http://localhost/api/now-playing'),
      { lastfmApiKey: 'key', lastfmUser: 'chai', lastfmAdapter: adapter, cache: new CacheLayer() },
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { track: null; stale: boolean; error: string };
    expect(body.track).toBeNull();
    expect(body.stale).toBe(true);
    expect(body.error).toBeDefined();
  });
});

describe('/api/recent-tracks', () => {
  it('returns { tracks, stale: false } with all adapter results', async () => {
    const adapter = makeLastFmAdapter();
    const res = await handle(
      new Request('http://localhost/api/recent-tracks'),
      { lastfmApiKey: 'key', lastfmUser: 'chai', lastfmAdapter: adapter },
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { tracks: Track[]; stale: boolean };
    expect(body.stale).toBe(false);
    expect(body.tracks).toHaveLength(2);
    expect(body.tracks[0]?.title).toBe('Paranoid Android');
  });

  it('returns empty tracks (not stale) when lastfmApiKey is absent', async () => {
    const res = await handle(new Request('http://localhost/api/recent-tracks'), {});

    expect(res.status).toBe(200);
    const body = await res.json() as { tracks: Track[]; stale: boolean };
    expect(body.tracks).toEqual([]);
    expect(body.stale).toBe(false);
  });

  it('returns { tracks: [], stale: true, error } when adapter throws and cache is cold', async () => {
    const adapter = makeLastFmAdapter([], true);
    const { CacheLayer } = await import('./cache/CacheLayer');
    const res = await handle(
      new Request('http://localhost/api/recent-tracks'),
      { lastfmApiKey: 'key', lastfmUser: 'chai', lastfmAdapter: adapter, cache: new CacheLayer() },
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { tracks: Track[]; stale: boolean; error: string };
    expect(body.tracks).toEqual([]);
    expect(body.stale).toBe(true);
    expect(body.error).toBeDefined();
  });

  it('caches: calls fetchRecentTracks once across two requests within TTL', async () => {
    const adapter = makeLastFmAdapter();
    const { CacheLayer } = await import('./cache/CacheLayer');
    const cache = new CacheLayer();

    await handle(
      new Request('http://localhost/api/recent-tracks'),
      { lastfmApiKey: 'key', lastfmUser: 'chai', lastfmAdapter: adapter, cache },
    );
    await handle(
      new Request('http://localhost/api/recent-tracks'),
      { lastfmApiKey: 'key', lastfmUser: 'chai', lastfmAdapter: adapter, cache },
    );

    expect(adapter.fetchRecentTracks).toHaveBeenCalledTimes(1);
  });
});

const FIXTURE_FILMS: Film[] = [
  {
    letterboxdId: '1278965807',
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    year: 2001,
    watchedDate: '2026-04-12',
    rating: 5.0,
    posterUrl: 'https://a.ltrbxd.com/poster.jpg',
    rewatch: true,
    link: 'https://letterboxd.com/cpalaka/film/lotr-fotr/1/',
  },
  {
    letterboxdId: '1268084157',
    title: "There's Something About Mary",
    year: 1998,
    watchedDate: '2026-04-05',
    rating: 3.5,
    review: "They really don't make em like they used to",
    posterUrl: 'https://a.ltrbxd.com/poster2.jpg',
    rewatch: true,
    link: 'https://letterboxd.com/cpalaka/film/theres-something-about-mary/',
  },
];

function makeFilmsAdapter(films: Film[] = FIXTURE_FILMS, fail = false) {
  return {
    fetchFilms: vi.fn(async () => {
      if (fail) throw new Error('upstream letterboxd');
      return films;
    }),
  };
}

describe('/api/films', () => {
  it('returns { films, stale: false } with the adapter results', async () => {
    const adapter = makeFilmsAdapter();
    const res = await handle(
      new Request('http://localhost/api/films'),
      { letterboxdUser: 'cpalaka', filmsAdapter: adapter },
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { films: Film[]; stale: boolean };
    expect(body.stale).toBe(false);
    expect(body.films).toHaveLength(2);
    expect(body.films[0]?.letterboxdId).toBe('1278965807');
  });

  it('returns empty films (not stale) when letterboxdUser is absent', async () => {
    const res = await handle(new Request('http://localhost/api/films'), {});

    expect(res.status).toBe(200);
    const body = await res.json() as { films: Film[]; stale: boolean };
    expect(body.films).toEqual([]);
    expect(body.stale).toBe(false);
  });

  it('returns empty films with stale:true when adapter throws and cache is cold', async () => {
    const adapter = makeFilmsAdapter([], true);
    const { CacheLayer } = await import('./cache/CacheLayer');
    const res = await handle(
      new Request('http://localhost/api/films'),
      { letterboxdUser: 'cpalaka', filmsAdapter: adapter, cache: new CacheLayer() },
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { films: Film[]; stale: boolean; error: string };
    expect(body.films).toEqual([]);
    expect(body.stale).toBe(true);
    expect(body.error).toBeDefined();
  });

  it('caches: calls fetchFilms only once across two requests within TTL', async () => {
    const adapter = makeFilmsAdapter();
    const { CacheLayer } = await import('./cache/CacheLayer');
    const cache = new CacheLayer();

    await handle(
      new Request('http://localhost/api/films'),
      { letterboxdUser: 'cpalaka', filmsAdapter: adapter, cache },
    );
    await handle(
      new Request('http://localhost/api/films'),
      { letterboxdUser: 'cpalaka', filmsAdapter: adapter, cache },
    );

    expect(adapter.fetchFilms).toHaveBeenCalledTimes(1);
  });
});
