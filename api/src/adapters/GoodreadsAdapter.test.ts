import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { GoodreadsAdapter } from './GoodreadsAdapter';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');

function mockFetch(responses: Record<string, string>): typeof globalThis.fetch {
  return vi.fn(async (input: string | URL | Request) => {
    const url = input.toString();
    const shelf = new URL(url).searchParams.get('shelf') ?? '';
    const body = responses[shelf];
    if (!body) throw new Error(`No mock for shelf=${shelf}`);
    return new Response(body, { status: 200, headers: { 'content-type': 'application/rss+xml' } });
  }) as unknown as typeof globalThis.fetch;
}

const currentlyReadingXml = readFileSync(join(FIXTURES, 'goodreads-currently-reading.xml'), 'utf-8');
const readXml = readFileSync(join(FIXTURES, 'goodreads-read.xml'), 'utf-8');

describe('GoodreadsAdapter', () => {
  describe('fetchBooks() — happy path', () => {
    it('returns a Book for each valid item in the currently-reading shelf', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch({ 'currently-reading': currentlyReadingXml, favorites: readXml }),
      });

      const books = await adapter.fetchBooks();
      const dune = books.find((b) => b.slug === '44767458');

      expect(dune).toBeDefined();
      expect(dune?.title).toBe('Dune (Dune Chronicles, #1)');
      expect(dune?.author).toBe('Frank Herbert');
      expect(dune?.status).toBe('currently-reading');
      expect(dune?.cover).toBe('https://images.gr-assets.com/books/1555447414m/44767458.jpg');
    });

    it('returns Books for each valid item in the favorites shelf', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch({ 'currently-reading': currentlyReadingXml, favorites: readXml }),
      });

      const books = await adapter.fetchBooks();
      const foundation = books.find((b) => b.slug === '29579');

      expect(foundation).toBeDefined();
      expect(foundation?.status).toBe('favorites'); // GoodreadsShelf.Favorites
      expect(foundation?.title).toBe('Foundation');
      expect(foundation?.author).toBe('Isaac Asimov');
    });

    it('includes both shelves in the returned array', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch({ 'currently-reading': currentlyReadingXml, favorites: readXml }),
      });

      const books = await adapter.fetchBooks();
      const slugs = books.map((b) => b.slug);

      expect(slugs).toContain('44767458'); // currently-reading
      expect(slugs).toContain('29579');    // favorites
      expect(slugs).toContain('40961427'); // favorites
    });
  });

  describe('status mapping', () => {
    it('maps currently-reading shelf to status "reading"', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch({ 'currently-reading': currentlyReadingXml, favorites: '<rss><channel></channel></rss>' }),
      });

      const books = await adapter.fetchBooks();
      expect(books.every((b) => b.status === 'currently-reading')).toBe(true);
    });

    it('maps favorites shelf to status "favorites"', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch({ 'currently-reading': '<rss><channel></channel></rss>', favorites: readXml }),
      });

      const books = await adapter.fetchBooks();
      const favBooks = books.filter((b) => b.slug !== '');
      expect(favBooks.every((b) => b.status === 'favorites')).toBe(true); // GoodreadsShelf.Favorites
    });
  });

  describe('rating handling', () => {
    it('includes rating when user_rating is 1–5', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch({ 'currently-reading': '<rss><channel></channel></rss>', favorites: readXml }),
      });

      const books = await adapter.fetchBooks();
      const foundation = books.find((b) => b.slug === '29579');

      expect(foundation?.rating).toBe(5);
    });

    it('omits rating when user_rating is 0 (unrated)', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch({ 'currently-reading': currentlyReadingXml, favorites: '<rss><channel></channel></rss>' }),
      });

      const books = await adapter.fetchBooks();
      const dune = books.find((b) => b.slug === '44767458');

      expect(dune?.rating).toBeUndefined();
    });

    it('omits rating when user_rating is 0 for a finished book', async () => {
      const adapter = new GoodreadsAdapter({
        userId: '12345678',
        fetch: mockFetch({ 'currently-reading': '<rss><channel></channel></rss>', favorites: readXml }),
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
        fetch: mockFetch({ 'currently-reading': '<rss><channel></channel></rss>', favorites: readXml }),
      });

      const books = await adapter.fetchBooks();
      const malformed = books.find((b) => b.title === 'Malformed No ID Book');

      expect(malformed).toBeUndefined();
      expect(books.length).toBeGreaterThan(0); // others survived
    });
  });
});
