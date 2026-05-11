import { CacheLayer } from './cache/CacheLayer';
import type { GoodreadsAdapter } from './adapters/GoodreadsAdapter';
import { GoodreadsAdapter as GoodreadsAdapterImpl } from './adapters/GoodreadsAdapter';

export type ServerConfig = {
  version?: string
  goodreadsUserId?: string
  booksAdapter?: Pick<GoodreadsAdapter, 'fetchBooks'>
  cache?: CacheLayer
};

const sharedCache = new CacheLayer();
const BOOKS_TTL_MS = 30 * 60 * 1000; // 30 minutes

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
    } catch {
      return Response.json({ books: [], stale: true });
    }
  }

  return new Response('not found', { status: 404 });
}

if (import.meta.main) {
  const config: ServerConfig = {
    version: process.env.BUILD_SHA,
    goodreadsUserId: process.env.GOODREADS_USER_ID,
  };
  Bun.serve({
    port: 3000,
    hostname: '127.0.0.1',
    fetch: (req) => handle(req, config),
  });
}
