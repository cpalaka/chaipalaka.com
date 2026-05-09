import { describe, expect, it } from 'vitest';
import { handle } from './server';

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
});
