import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { LetterboxdAdapter } from './LetterboxdAdapter';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');
const rssXml = readFileSync(join(FIXTURES, 'letterboxd-rss.xml'), 'utf-8');

function mockFetch(xml: string, status = 200): typeof globalThis.fetch {
  return vi.fn(async () =>
    new Response(xml, { status, headers: { 'content-type': 'application/rss+xml' } }),
  ) as unknown as typeof globalThis.fetch;
}

describe('LetterboxdAdapter', () => {
  describe('fetchFilms() — happy path', () => {
    it('returns a Film for each valid item', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      expect(films.length).toBe(3);
    });

    it('parses letterboxdId from guid', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const lotr = films.find((f) => f.letterboxdId === '1278965807');
      expect(lotr).toBeDefined();
    });

    it('parses title from letterboxd:filmTitle', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const lotr = films.find((f) => f.letterboxdId === '1278965807');
      expect(lotr?.title).toBe('The Lord of the Rings: The Fellowship of the Ring');
    });

    it('parses year as number', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const lotr = films.find((f) => f.letterboxdId === '1278965807');
      expect(lotr?.year).toBe(2001);
    });

    it('parses watchedDate as ISO date string', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const lotr = films.find((f) => f.letterboxdId === '1278965807');
      expect(lotr?.watchedDate).toBe('2026-04-12');
    });

    it('parses rating as float', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const lotr = films.find((f) => f.letterboxdId === '1278965807');
      expect(lotr?.rating).toBe(5.0);
    });

    it('preserves half-star float rating', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const mary = films.find((f) => f.letterboxdId === '1268084157');
      expect(mary?.rating).toBe(3.5);
    });

    it('parses posterUrl from description img tag', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const lotr = films.find((f) => f.letterboxdId === '1278965807');
      expect(lotr?.posterUrl).toBe(
        'https://a.ltrbxd.com/resized/sm/upload/3t/vq/0u/m6/poster.jpg?v=abc',
      );
    });

    it('parses rewatch flag', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const lotr = films.find((f) => f.letterboxdId === '1278965807');
      const sinners = films.find((f) => f.letterboxdId === '1256248485');
      expect(lotr?.rewatch).toBe(true);
      expect(sinners?.rewatch).toBe(false);
    });

    it('parses link as canonical url', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const lotr = films.find((f) => f.letterboxdId === '1278965807');
      expect(lotr?.link).toBe(
        'https://letterboxd.com/cpalaka/film/the-lord-of-the-rings-the-fellowship-of-the-ring/1/',
      );
    });
  });

  describe('review extraction', () => {
    it('returns undefined review when description is only "Watched on..." text', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const lotr = films.find((f) => f.letterboxdId === '1278965807');
      expect(lotr?.review).toBeUndefined();
    });

    it('extracts written review text from description', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const mary = films.find((f) => f.letterboxdId === '1268084157');
      expect(mary?.review).toBe("They really don't make em like they used to - dumb, contrived and hilarious");
    });
  });

  describe('HTML entity decoding', () => {
    it('decodes &#039; entities in title', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const mary = films.find((f) => f.letterboxdId === '1268084157');
      expect(mary?.title).toBe("There's Something About Mary");
    });
  });

  describe('malformed items', () => {
    it('skips items missing a guid without throwing', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const malformed = films.find((f) => f.title === 'Malformed No ID Film');
      expect(malformed).toBeUndefined();
      expect(films.length).toBeGreaterThan(0);
    });

    it('skips items missing a title without throwing', async () => {
      const adapter = new LetterboxdAdapter({ user: 'cpalaka', fetch: mockFetch(rssXml) });
      const films = await adapter.fetchFilms();
      const noTitle = films.find((f) => f.letterboxdId === '9999999');
      expect(noTitle).toBeUndefined();
    });
  });

  describe('upstream failure', () => {
    it('throws when the upstream returns a non-OK status', async () => {
      const adapter = new LetterboxdAdapter({
        user: 'cpalaka',
        fetch: mockFetch('Service Unavailable', 503),
      });
      await expect(adapter.fetchFilms()).rejects.toThrow('503');
    });
  });
});
