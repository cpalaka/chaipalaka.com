import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { LastFmAdapter } from './LastFmAdapter';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');

function mockFetch(json: string, status = 200): typeof globalThis.fetch {
  return vi.fn(async () =>
    new Response(json, { status, headers: { 'content-type': 'application/json' } }),
  ) as unknown as typeof globalThis.fetch;
}

const withNowPlayingJson = readFileSync(join(FIXTURES, 'lastfm-recent-with-nowplaying.json'), 'utf-8');
const noNowPlayingJson = readFileSync(join(FIXTURES, 'lastfm-recent-no-nowplaying.json'), 'utf-8');

describe('LastFmAdapter', () => {
  describe('fetchRecentTracks() — happy path with now-playing', () => {
    it('returns a Track for each item in the fixture', async () => {
      const adapter = new LastFmAdapter({
        apiKey: 'testkey',
        user: 'cpalaka',
        fetch: mockFetch(withNowPlayingJson),
      });

      const tracks = await adapter.fetchRecentTracks(3);

      expect(tracks).toHaveLength(3);
    });

    it('sets isNowPlaying:true on the first track when @attr.nowplaying is present', async () => {
      const adapter = new LastFmAdapter({
        apiKey: 'testkey',
        user: 'cpalaka',
        fetch: mockFetch(withNowPlayingJson),
      });

      const tracks = await adapter.fetchRecentTracks(3);
      const nowPlaying = tracks[0]!;

      expect(nowPlaying.isNowPlaying).toBe(true);
      expect(nowPlaying.title).toBe('Paranoid Android');
      expect(nowPlaying.artist).toBe('Radiohead');
      expect(nowPlaying.album).toBe('OK Computer');
      expect(nowPlaying.mbid).toBe('9c1cc072-a88a-43a3-ab49-6c5c5a0dd8bc');
    });

    it('omits ts for the now-playing track (no date in upstream)', async () => {
      const adapter = new LastFmAdapter({
        apiKey: 'testkey',
        user: 'cpalaka',
        fetch: mockFetch(withNowPlayingJson),
      });

      const tracks = await adapter.fetchRecentTracks(3);

      expect(tracks[0]!.ts).toBeUndefined();
    });

    it('sets albumArt from the extralarge image URL', async () => {
      const adapter = new LastFmAdapter({
        apiKey: 'testkey',
        user: 'cpalaka',
        fetch: mockFetch(withNowPlayingJson),
      });

      const tracks = await adapter.fetchRecentTracks(3);

      expect(tracks[0]!.albumArt).toBe(
        'https://lastfm.freetls.fastly.net/i/u/300x300/3b54d9c5-d035-4c89-8fa0-cf9cb3a6e5c9.png',
      );
    });

    it('sets isNowPlaying:false and ts on past tracks', async () => {
      const adapter = new LastFmAdapter({
        apiKey: 'testkey',
        user: 'cpalaka',
        fetch: mockFetch(withNowPlayingJson),
      });

      const tracks = await adapter.fetchRecentTracks(3);
      const past = tracks[1]!;

      expect(past.isNowPlaying).toBe(false);
      expect(past.title).toBe('Exit Music (For a Film)');
      expect(past.ts).toBe(new Date(1715256000 * 1000).toISOString());
    });
  });

  describe('fetchRecentTracks() — no now-playing', () => {
    it('sets isNowPlaying:false on all tracks when no @attr.nowplaying', async () => {
      const adapter = new LastFmAdapter({
        apiKey: 'testkey',
        user: 'cpalaka',
        fetch: mockFetch(noNowPlayingJson),
      });

      const tracks = await adapter.fetchRecentTracks(2);

      expect(tracks.every((t) => t.isNowPlaying === false)).toBe(true);
    });
  });

  describe('field normalisation', () => {
    it('converts empty-string mbid to undefined', async () => {
      const adapter = new LastFmAdapter({
        apiKey: 'testkey',
        user: 'cpalaka',
        fetch: mockFetch(withNowPlayingJson),
      });

      const tracks = await adapter.fetchRecentTracks(3);
      // third track has mbid: ""
      expect(tracks[2]!.mbid).toBeUndefined();
    });

    it('converts empty-string albumArt to undefined', async () => {
      const adapter = new LastFmAdapter({
        apiKey: 'testkey',
        user: 'cpalaka',
        fetch: mockFetch(withNowPlayingJson),
      });

      const tracks = await adapter.fetchRecentTracks(3);
      // third track has all image "#text": ""
      expect(tracks[2]!.albumArt).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('throws on non-2xx response', async () => {
      const adapter = new LastFmAdapter({
        apiKey: 'testkey',
        user: 'cpalaka',
        fetch: mockFetch('{"error":10,"message":"Invalid API key"}', 403),
      });

      await expect(adapter.fetchRecentTracks(10)).rejects.toThrow('Last.fm returned 403');
    });
  });

  describe('URL construction', () => {
    it('sends the api key and user in the request URL', async () => {
      const fetchFn = vi.fn(async () =>
        new Response(withNowPlayingJson, { status: 200, headers: { 'content-type': 'application/json' } }),
      );
      const adapter = new LastFmAdapter({
        apiKey: 'mykey',
        user: 'myuser',
        fetch: fetchFn as unknown as typeof globalThis.fetch,
      });

      await adapter.fetchRecentTracks(5);

      const calledUrl = (fetchFn.mock.calls as unknown[][])[0]?.[0] as string;
      expect(calledUrl).toContain('api_key=mykey');
      expect(calledUrl).toContain('user=myuser');
      expect(calledUrl).toContain('limit=5');
    });
  });
});
