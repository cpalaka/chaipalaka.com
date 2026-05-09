import { describe, expect, it, vi } from 'vitest';
import { CacheLayer } from './cache/CacheLayer';
import { handle } from './server';
import type { Book } from './books/schema';

const SAMPLE_BOOKS: Book[] = [
  { slug: 'pragmatic-programmer', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', status: 'reading', started: '2026-01-15' },
  { slug: 'sicp', title: 'SICP', author: 'Abelson', status: 'finished', started: '2025-01-01', finished: '2025-12-01' },
];

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

  it('GET /api/books → 200 with {books, stale: false}', async () => {
    const reader = { read: vi.fn().mockResolvedValue(SAMPLE_BOOKS) };
    const cache = new CacheLayer();

    const res = await handle(
      new Request('http://localhost/api/books'),
      { bookReader: reader, cache },
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { books: unknown; stale: unknown };
    expect(body.books).toEqual(SAMPLE_BOOKS);
    expect(body.stale).toBe(false);
    expect(reader.read).toHaveBeenCalledTimes(1);
  });

  it('GET /api/books second call within TTL reuses cache, does not re-read', async () => {
    const reader = { read: vi.fn().mockResolvedValue(SAMPLE_BOOKS) };
    const cache = new CacheLayer();
    const config = { bookReader: reader, cache };

    await handle(new Request('http://localhost/api/books'), config);
    const res2 = await handle(new Request('http://localhost/api/books'), config);

    expect(reader.read).toHaveBeenCalledTimes(1);
    const body = await res2.json() as { stale: unknown };
    expect(body.stale).toBe(false);
  });

  it('GET /api/books returns 404 when bookReader is not configured', async () => {
    const res = await handle(
      new Request('http://localhost/api/books'),
      { version: 'abc1234' },
    );
    expect(res.status).toBe(404);
  });
});
