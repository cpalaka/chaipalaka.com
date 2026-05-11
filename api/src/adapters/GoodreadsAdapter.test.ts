import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { GoodreadsAdapter } from './GoodreadsAdapter';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');

function mockFetch(xml: string): typeof globalThis.fetch {
  return vi.fn(async () =>
    new Response(xml, { status: 200, headers: { 'content-type': 'application/rss+xml' } }),
  ) as unknown as typeof globalThis.fetch;
}

const currentlyReadingXml = readFileSync(join(FIXTURES, 'goodreads-currently-reading.xml'), 'utf-8');
const readXml = readFileSync(join(FIXTURES, 'goodreads-read.xml'), 'utf-8');

describe('GoodreadsAdapter', () => {
  describe('fetchBooks() — happy path', () => {
    it('returns a Book for each valid item', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch(currentlyReadingXml),
      });

      const books = await adapter.fetchBooks();
      const dune = books.find((b) => b.slug === '44767458');

      expect(dune).toBeDefined();
      expect(dune?.title).toBe('Dune (Dune Chronicles, #1)');
      expect(dune?.author).toBe('Frank Herbert');
      expect(dune?.status).toBe('currently-reading');
      expect(dune?.cover).toBe('https://images.gr-assets.com/books/1555447414m/44767458.jpg');
    });
  });

  describe('status mapping', () => {
    it('sets status to "currently-reading" for all items', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch(currentlyReadingXml),
      });

      const books = await adapter.fetchBooks();
      expect(books.every((b) => b.status === 'currently-reading')).toBe(true);
    });
  });

  describe('rating handling', () => {
    it('includes rating when user_rating is 1–5', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch(readXml),
      });

      const books = await adapter.fetchBooks();
      const foundation = books.find((b) => b.slug === '29579');

      expect(foundation?.rating).toBe(5);
    });

    it('omits rating when user_rating is 0 (unrated)', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch(currentlyReadingXml),
      });

      const books = await adapter.fetchBooks();
      const dune = books.find((b) => b.slug === '44767458');

      expect(dune?.rating).toBeUndefined();
    });

    it('omits rating when user_rating is 0 even when read_at is set', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch(readXml),
      });

      const books = await adapter.fetchBooks();
      const orwell = books.find((b) => b.slug === '40961427');

      expect(orwell?.rating).toBeUndefined();
    });
  });

  describe('malformed items', () => {
    it('skips items missing a book_id without throwing', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch(readXml),
      });

      const books = await adapter.fetchBooks();
      const malformed = books.find((b) => b.title === 'Malformed No ID Book');

      expect(malformed).toBeUndefined();
      expect(books.length).toBeGreaterThan(0);
    });
  });
});
