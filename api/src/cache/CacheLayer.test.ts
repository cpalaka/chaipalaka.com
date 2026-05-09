import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheLayer } from './CacheLayer';

describe('CacheLayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the fetcher on a cold key and returns its value (not stale)', async () => {
    const cache = new CacheLayer();
    const fetcher = vi.fn(async () => 'hello');

    const result = await cache.get('k', fetcher, { ttl: 1000 });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ value: 'hello', stale: false });
  });

  it('returns cached value on a within-TTL hit without calling the fetcher again', async () => {
    const cache = new CacheLayer();
    const fetcher = vi.fn(async () => 'hello');

    await cache.get('k', fetcher, { ttl: 1000 });
    vi.advanceTimersByTime(500);
    const second = await cache.get('k', fetcher, { ttl: 1000 });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(second).toEqual({ value: 'hello', stale: false });
  });

  it('refetches and returns the new value when TTL has expired', async () => {
    const cache = new CacheLayer();
    let n = 0;
    const fetcher = vi.fn(async () => {
      n += 1;
      return `v${n}`;
    });

    const first = await cache.get('k', fetcher, { ttl: 1000 });
    vi.advanceTimersByTime(1001);
    const second = await cache.get('k', fetcher, { ttl: 1000 });

    expect(first).toEqual({ value: 'v1', stale: false });
    expect(second).toEqual({ value: 'v2', stale: false });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('returns last-good with stale:true when a post-TTL refetch fails', async () => {
    const cache = new CacheLayer();
    let attempt = 0;
    const fetcher = vi.fn(async () => {
      attempt += 1;
      if (attempt === 1) return 'good';
      throw new Error('upstream down');
    });

    const first = await cache.get('k', fetcher, { ttl: 1000 });
    vi.advanceTimersByTime(1001);
    const second = await cache.get('k', fetcher, { ttl: 1000 });

    expect(first).toEqual({ value: 'good', stale: false });
    expect(second).toEqual({ value: 'good', stale: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('throws when the very first fetch fails (no last-good to fall back to)', async () => {
    const cache = new CacheLayer();
    const fetcher = vi.fn(async () => {
      throw new Error('upstream down');
    });

    await expect(cache.get('k', fetcher, { ttl: 1000 })).rejects.toThrow(
      'upstream down',
    );
  });

  it('set(key, value) replaces the cached fresh value (within-TTL get returns the set value, no fetch)', async () => {
    const cache = new CacheLayer();
    const fetcher = vi.fn(async () => 'good');

    await cache.get('k', fetcher, { ttl: 1000 });
    cache.set('k', 'forced');
    const after = await cache.get('k', fetcher, { ttl: 1000 });

    expect(after).toEqual({ value: 'forced', stale: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('set(key, value) overrides last-good cleanly — stale fallback returns the set value, not the previous fetched value', async () => {
    const cache = new CacheLayer();
    let attempt = 0;
    const fetcher = vi.fn(async () => {
      attempt += 1;
      if (attempt === 1) return 'good';
      throw new Error('upstream down');
    });

    await cache.get('k', fetcher, { ttl: 1000 });
    cache.set('k', 'replacement');
    vi.advanceTimersByTime(1001);
    const after = await cache.get('k', fetcher, { ttl: 1000 });

    expect(after).toEqual({ value: 'replacement', stale: true });
  });

  it('coalesces concurrent gets for the same key into a single fetch', async () => {
    const cache = new CacheLayer();
    let resolveFetch!: (v: string) => void;
    const fetcher = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const a = cache.get('k', fetcher, { ttl: 1000 });
    const b = cache.get('k', fetcher, { ttl: 1000 });
    const c = cache.get('k', fetcher, { ttl: 1000 });

    expect(fetcher).toHaveBeenCalledTimes(1);

    resolveFetch('shared');
    const [ra, rb, rc] = await Promise.all([a, b, c]);

    expect(ra).toEqual({ value: 'shared', stale: false });
    expect(rb).toEqual({ value: 'shared', stale: false });
    expect(rc).toEqual({ value: 'shared', stale: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
