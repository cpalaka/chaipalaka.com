export interface Track {
  artist: string
  title: string
  album?: string
  mbid?: string
  albumArt?: string
  isNowPlaying: boolean
  ts?: string
}

export interface LastFmAdapterOpts {
  apiKey: string
  user: string
  fetch?: typeof globalThis.fetch
}

const BASE = 'https://ws.audioscrobbler.com/2.0/';

interface RawTrack {
  name: string
  artist: { '#text': string }
  album: { '#text': string }
  mbid: string
  image: Array<{ size: string; '#text': string }>
  '@attr'?: { nowplaying: string }
  date?: { uts: string }
}

function orUndefined(s: string): string | undefined {
  return s && s.trim() ? s.trim() : undefined;
}

function normalise(raw: RawTrack): Track | null {
  const artist = raw.artist['#text']?.trim();
  const title = raw.name?.trim();
  if (!artist || !title) {
    console.warn('[LastFmAdapter] skipping track: missing artist or title');
    return null;
  }

  const extralarge = raw.image.find((i) => i.size === 'extralarge');
  const isNowPlaying = raw['@attr']?.nowplaying === 'true';
  const uts = raw.date?.uts;

  return {
    artist,
    title,
    album: orUndefined(raw.album['#text']),
    mbid: orUndefined(raw.mbid),
    albumArt: orUndefined(extralarge?.['#text'] ?? ''),
    isNowPlaying,
    ts: uts ? new Date(parseInt(uts, 10) * 1000).toISOString() : undefined,
  };
}

export class LastFmAdapter {
  private readonly apiKey: string
  private readonly user: string
  private readonly fetchFn: typeof globalThis.fetch

  constructor(opts: LastFmAdapterOpts) {
    this.apiKey = opts.apiKey;
    this.user = opts.user;
    this.fetchFn = opts.fetch ?? globalThis.fetch;
  }

  async fetchRecentTracks(limit: number): Promise<Track[]> {
    const url =
      `${BASE}?method=user.getrecenttracks` +
      `&user=${encodeURIComponent(this.user)}` +
      `&api_key=${encodeURIComponent(this.apiKey)}` +
      `&format=json` +
      `&limit=${limit}`;

    const res = await this.fetchFn(url);
    if (!res.ok) throw new Error(`Last.fm returned ${res.status}`);

    const data = (await res.json()) as { recenttracks: { track: RawTrack[] } };
    const rawTracks = data.recenttracks.track ?? [];

    const tracks: Track[] = [];
    for (const raw of rawTracks) {
      const t = normalise(raw);
      if (t) tracks.push(t);
    }
    return tracks;
  }
}
