import { CacheLayer } from './cache/CacheLayer';
import type { GoodreadsAdapter } from './adapters/GoodreadsAdapter';
import { GoodreadsAdapter as GoodreadsAdapterImpl } from './adapters/GoodreadsAdapter';
import type { LastFmAdapter } from './adapters/LastFmAdapter';
import { LastFmAdapter as LastFmAdapterImpl } from './adapters/LastFmAdapter';
import type { LetterboxdAdapter } from './adapters/LetterboxdAdapter';
import { LetterboxdAdapter as LetterboxdAdapterImpl } from './adapters/LetterboxdAdapter';

export type ServerConfig = {
  version?: string
  goodreadsUserId?: string
  booksAdapter?: Pick<GoodreadsAdapter, 'fetchBooks'>
  lastfmApiKey?: string
  lastfmUser?: string
  lastfmAdapter?: Pick<LastFmAdapter, 'fetchRecentTracks'>
  letterboxdUser?: string
  filmsAdapter?: Pick<LetterboxdAdapter, 'fetchFilms'>
  cache?: CacheLayer
};

const sharedCache = new CacheLayer();
const BOOKS_TTL_MS = 24 * 60 * 60_000;
const NOW_PLAYING_TTL_MS = 3 * 60_000;
const RECENT_TRACKS_TTL_MS = 5 * 60_000;
const RECENT_TRACKS_LIMIT = 10;
const FILMS_TTL_MS = 24 * 60 * 60_000;

export async function handle(
  req: Request,
  config: ServerConfig,
): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === '/api/health') {
    return Response.json({ ok: true, version: config.version ?? 'dev' });
  }

  if (url.pathname === '/api/books') {
    if (!config.goodreadsUserId) {
      return Response.json({ books: [], stale: false });
    }
    const adapter =
      config.booksAdapter ??
      new GoodreadsAdapterImpl({ userId: config.goodreadsUserId });
    const cache = config.cache ?? sharedCache;
    try {
      const { value, stale } = await cache.get(
        'books',
        () => adapter.fetchBooks(),
        { ttl: BOOKS_TTL_MS },
      );
      return Response.json({ books: value, stale });
    } catch(e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error('[Server] failed to fetch books', e);
      return Response.json({ books: [], stale: true, error });
    }
  }

  if (url.pathname === '/api/now-playing') {
    if (!config.lastfmApiKey || !config.lastfmUser) {
      return Response.json({ track: null, stale: false });
    }
    const adapter =
      config.lastfmAdapter ??
      new LastFmAdapterImpl({ apiKey: config.lastfmApiKey, user: config.lastfmUser });
    const cache = config.cache ?? sharedCache;
    try {
      const { value, stale } = await cache.get(
        'now-playing',
        () => adapter.fetchRecentTracks(1),
        { ttl: NOW_PLAYING_TTL_MS },
      );
      return Response.json({ track: value[0] ?? null, stale });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error('[Server] failed to fetch now-playing', e);
      return Response.json({ track: null, stale: true, error });
    }
  }

  if (url.pathname === '/api/recent-tracks') {
    if (!config.lastfmApiKey || !config.lastfmUser) {
      return Response.json({ tracks: [], stale: false });
    }
    const adapter =
      config.lastfmAdapter ??
      new LastFmAdapterImpl({ apiKey: config.lastfmApiKey, user: config.lastfmUser });
    const cache = config.cache ?? sharedCache;
    try {
      const { value, stale } = await cache.get(
        'recent-tracks',
        () => adapter.fetchRecentTracks(RECENT_TRACKS_LIMIT),
        { ttl: RECENT_TRACKS_TTL_MS },
      );
      return Response.json({ tracks: value, stale });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error('[Server] failed to fetch recent-tracks', e);
      return Response.json({ tracks: [], stale: true, error });
    }
  }

  if (url.pathname === '/api/films') {
    if (!config.letterboxdUser) {
      return Response.json({ films: [], stale: false });
    }
    const adapter =
      config.filmsAdapter ??
      new LetterboxdAdapterImpl({ user: config.letterboxdUser });
    const cache = config.cache ?? sharedCache;
    try {
      const { value, stale } = await cache.get(
        'films',
        () => adapter.fetchFilms(),
        { ttl: FILMS_TTL_MS },
      );
      return Response.json({ films: value, stale });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error('[Server] failed to fetch films', e);
      return Response.json({ films: [], stale: true, error });
    }
  }

  return new Response('not found', { status: 404 });
}

if (import.meta.main) {
  const config: ServerConfig = {
    version: process.env.BUILD_SHA,
    goodreadsUserId: process.env.GOODREADS_USER_ID,
    lastfmApiKey: process.env.LASTFM_API_KEY,
    lastfmUser: process.env.LASTFM_USER,
    letterboxdUser: process.env.LETTERBOXD_USER,
  };
  Bun.serve({
    port: 3000,
    hostname: '127.0.0.1',
    fetch: (req) => handle(req, config),
  });
}
