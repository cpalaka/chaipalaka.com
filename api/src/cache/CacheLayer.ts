export type CacheGetOpts = { ttl: number };
export type CacheResult<T> = { value: T; stale: boolean };

type Entry = { value: unknown; expiresAt: number };

export class CacheLayer {
  private readonly entries = new Map<string, Entry>();
  private readonly inFlight = new Map<string, Promise<CacheResult<unknown>>>();

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    opts: CacheGetOpts,
  ): Promise<CacheResult<T>> {
    const existing = this.entries.get(key);
    if (existing && Date.now() < existing.expiresAt) {
      return { value: existing.value as T, stale: false };
    }
    const inFlight = this.inFlight.get(key);
    if (inFlight) {
      return inFlight as Promise<CacheResult<T>>;
    }
    const p = (async () => {
      try {
        const value = await fetcher();
        this.entries.set(key, { value, expiresAt: Date.now() + opts.ttl });
        return { value, stale: false } as CacheResult<unknown>;
      } catch (err) {
        if (existing) {
          return { value: existing.value, stale: true } as CacheResult<unknown>;
        }
        throw err;
      } finally {
        this.inFlight.delete(key);
      }
    })();
    this.inFlight.set(key, p);
    return p as Promise<CacheResult<T>>;
  }

  set<T>(key: string, value: T): void {
    const existing = this.entries.get(key);
    const expiresAt = existing?.expiresAt ?? Date.now();
    this.entries.set(key, { value, expiresAt });
  }
}
