import { resolve } from 'node:path';
import { CacheLayer } from './cache/CacheLayer';
import { createMDXBookReader } from './books/MDXBookReader';
import type { Book } from './books/schema';

const BOOKS_TTL = 60 * 60 * 1000; // 1 hour

export type BookReader = { read(): Promise<Book[]> };

export type ServerConfig = {
  version?: string;
  bookReader?: BookReader;
  cache?: CacheLayer;
};

export async function handle(
  req: Request,
  config: ServerConfig,
): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === '/api/health') {
    return Response.json({ ok: true, version: config.version ?? 'dev' });
  }

  if (url.pathname === '/api/books' && config.bookReader && config.cache) {
    const { value: books, stale } = await config.cache.get(
      'books',
      () => config.bookReader!.read(),
      { ttl: BOOKS_TTL },
    );
    return Response.json({ books, stale });
  }

  return new Response('not found', { status: 404 });
}

if (import.meta.main) {
  const booksDir = process.env.BOOKS_DIR
    ?? resolve(import.meta.dir, '../../content/books');

  const cache = new CacheLayer();
  const bookReader = createMDXBookReader({ booksDir });
  const config: ServerConfig = {
    version: process.env.BUILD_SHA,
    bookReader,
    cache,
  };

  Bun.serve({
    port: 3000,
    hostname: '127.0.0.1',
    fetch: (req) => handle(req, config),
  });
}
