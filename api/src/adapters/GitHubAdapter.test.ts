import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { GitHubAdapter } from './GitHubAdapter';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');
const eventsJson = readFileSync(join(FIXTURES, 'github-events.json'), 'utf-8');

function mockFetch(body: string, status = 200): typeof globalThis.fetch {
  return vi.fn(async () =>
    new Response(body, { status, headers: { 'content-type': 'application/json' } }),
  ) as unknown as typeof globalThis.fetch;
}

describe('GitHubAdapter', () => {
  describe('fetchActivity() — PushEvent', () => {
    it('normalises PushEvent to type "push"', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity();
      const push = activity.find((a) => a.type === 'push');
      expect(push).toBeDefined();
    });

    it('includes commit count and branch in summary', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity();
      const push = activity.find((a) => a.type === 'push');
      expect(push?.summary).toBe('Pushed 2 commits to main');
    });

    it('sets url to the repo commit url', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity();
      const push = activity.find((a) => a.type === 'push');
      expect(push?.url).toBe('https://github.com/cpalaka/chaipalaka.com/commit/abc123def456');
    });

    it('sets repo to the repo name', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity();
      const push = activity.find((a) => a.type === 'push');
      expect(push?.repo).toBe('cpalaka/chaipalaka.com');
    });

    it('sets ts as ISO string', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity();
      const push = activity.find((a) => a.type === 'push');
      expect(push?.ts).toBe('2026-05-11T10:00:00Z');
    });
  });

  describe('fetchActivity() — PullRequestEvent', () => {
    it('normalises opened PR to type "pull_request" with "opened PR:" summary', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity(20);
      const opened = activity.find(
        (a) => a.type === 'pull_request' && a.summary.startsWith('opened PR:'),
      );
      expect(opened?.summary).toBe('opened PR: Add GitHub activity source');
      expect(opened?.url).toBe('https://github.com/cpalaka/chaipalaka.com/pull/72');
    });

    it('uses "merged PR:" for a closed+merged PR', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity(20);
      const merged = activity.find(
        (a) => a.type === 'pull_request' && a.summary.startsWith('merged PR:'),
      );
      expect(merged?.summary).toBe('merged PR: Fix letterboxd adapter');
      expect(merged?.url).toBe('https://github.com/cpalaka/chaipalaka.com/pull/71');
    });
  });

  describe('fetchActivity() — IssuesEvent', () => {
    it('normalises IssuesEvent to type "issue"', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity();
      const issue = activity.find((a) => a.type === 'issue');
      expect(issue).toBeDefined();
    });

    it('builds summary as "<action> issue: <title>"', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity();
      const issue = activity.find((a) => a.type === 'issue');
      expect(issue?.summary).toBe('opened issue: Bug: something is broken');
      expect(issue?.url).toBe('https://github.com/cpalaka/other-repo/issues/5');
    });
  });

  describe('fetchActivity() — ReleaseEvent', () => {
    it('normalises ReleaseEvent to type "release"', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity();
      const release = activity.find((a) => a.type === 'release');
      expect(release).toBeDefined();
    });

    it('builds summary as "Released <tag>"', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity();
      const release = activity.find((a) => a.type === 'release');
      expect(release?.summary).toBe('Released v1.2.0');
      expect(release?.url).toBe('https://github.com/cpalaka/chaipalaka.com/releases/tag/v1.2.0');
    });
  });

  describe('fetchActivity() — WatchEvent', () => {
    it('normalises WatchEvent to type "star"', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity();
      const star = activity.find((a) => a.type === 'star');
      expect(star).toBeDefined();
    });

    it('builds summary as "Starred <repo>"', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity();
      const star = activity.find((a) => a.type === 'star');
      expect(star?.summary).toBe('Starred vitejs/vite');
      expect(star?.url).toBe('https://github.com/vitejs/vite');
    });
  });

  describe('unhandled event types', () => {
    it('silently drops ForkEvent (not in the result list)', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity(30);
      const fork = activity.find((a) => a.repo === 'some/project');
      expect(fork).toBeUndefined();
    });

    it('silently drops null-type events', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity(30);
      // fixture has 8 items: 1 push + 2 PRs + 1 issue + 1 release + 1 star + 1 fork (drop) + 1 null-type (drop)
      expect(activity.length).toBe(6);
    });
  });

  describe('limit parameter', () => {
    it('returns at most limit items', async () => {
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(eventsJson) });
      const activity = await adapter.fetchActivity(3);
      expect(activity.length).toBe(3);
    });

    it('defaults to 10 items', async () => {
      const body = JSON.stringify(
        Array.from({ length: 15 }, (_, i) => ({
          id: String(i),
          type: 'WatchEvent',
          repo: { name: `user/repo-${i}` },
          payload: { action: 'started' },
          created_at: '2026-05-11T00:00:00Z',
        })),
      );
      const adapter = new GitHubAdapter({ user: 'cpalaka', fetch: mockFetch(body) });
      const activity = await adapter.fetchActivity();
      expect(activity.length).toBe(10);
    });
  });

  describe('upstream failure', () => {
    it('throws when the upstream returns 503', async () => {
      const adapter = new GitHubAdapter({
        user: 'cpalaka',
        fetch: mockFetch('Service Unavailable', 503),
      });
      await expect(adapter.fetchActivity()).rejects.toThrow('503');
    });

    it('throws when the upstream returns 403 (rate limited)', async () => {
      const adapter = new GitHubAdapter({
        user: 'cpalaka',
        fetch: mockFetch('rate limited', 403),
      });
      await expect(adapter.fetchActivity()).rejects.toThrow('403');
    });
  });
});
