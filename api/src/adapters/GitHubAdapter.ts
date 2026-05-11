export interface Activity {
  type: 'push' | 'pull_request' | 'issue' | 'release' | 'star'
  repo: string
  summary: string
  url: string
  ts: string
}

export interface GitHubAdapterOpts {
  user: string
  fetch?: typeof globalThis.fetch
}

const BASE = 'https://api.github.com';

interface RawEvent {
  id: string
  type: string | null
  repo: { name: string }
  payload: Record<string, unknown>
  created_at: string
}

function normalise(raw: RawEvent): Activity | null {
  const repo = raw.repo?.name;
  const ts = raw.created_at;
  if (!repo || !ts || !raw.type) return null;

  switch (raw.type) {
    case 'PushEvent': {
      const p = raw.payload as { size: number; ref: string; head: string };
      const branch = (p.ref ?? '').replace('refs/heads/', '');
      const count = p.size ?? 0;
      return {
        type: 'push',
        repo,
        summary: `Pushed ${count} commit${count !== 1 ? 's' : ''} to ${branch}`,
        url: `https://github.com/${repo}/commit/${p.head}`,
        ts,
      };
    }
    case 'PullRequestEvent': {
      const p = raw.payload as {
        action: string
        pull_request: { title: string; merged: boolean; html_url: string }
      };
      const pr = p.pull_request;
      if (!pr?.title || !pr?.html_url) return null;
      const verb = p.action === 'closed' && pr.merged ? 'merged' : p.action;
      return {
        type: 'pull_request',
        repo,
        summary: `${verb} PR: ${pr.title}`,
        url: pr.html_url,
        ts,
      };
    }
    case 'IssuesEvent': {
      const p = raw.payload as { action: string; issue: { title: string; html_url: string } };
      const issue = p.issue;
      if (!issue?.title || !issue?.html_url) return null;
      return {
        type: 'issue',
        repo,
        summary: `${p.action} issue: ${issue.title}`,
        url: issue.html_url,
        ts,
      };
    }
    case 'ReleaseEvent': {
      const p = raw.payload as { release: { tag_name: string; html_url: string } };
      const release = p.release;
      if (!release?.tag_name || !release?.html_url) return null;
      return {
        type: 'release',
        repo,
        summary: `Released ${release.tag_name}`,
        url: release.html_url,
        ts,
      };
    }
    case 'WatchEvent': {
      return {
        type: 'star',
        repo,
        summary: `Starred ${repo}`,
        url: `https://github.com/${repo}`,
        ts,
      };
    }
    default:
      return null;
  }
}

export class GitHubAdapter {
  private readonly user: string
  private readonly fetchFn: typeof globalThis.fetch

  constructor(opts: GitHubAdapterOpts) {
    this.user = opts.user;
    this.fetchFn = opts.fetch ?? globalThis.fetch;
  }

  async fetchActivity(limit = 10): Promise<Activity[]> {
    const url = `${BASE}/users/${encodeURIComponent(this.user)}/events/public?per_page=30`;
    const res = await this.fetchFn(url);
    if (!res.ok) throw new Error(`GitHub returned ${res.status}`);

    const events = (await res.json()) as RawEvent[];
    const activity: Activity[] = [];
    for (const raw of events) {
      const a = normalise(raw);
      if (a) activity.push(a);
    }
    return activity.slice(0, limit);
  }
}
