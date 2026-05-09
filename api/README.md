# api/

Bun backend for chaipalaka.com. Runs on `localhost:3000` behind Caddy
(`/api/*` is reverse-proxied to it). On the server, runs as the
`chaipalaka-api` systemd unit — see `deploy/chaipalaka-api.service`.

## Endpoints (v1)

- `GET /api/health` — `{ ok: true, version: "<git-sha>" }`. The version is
  baked into the binary at compile time by `make deploy-api`.

Adapter endpoints (`/api/now-playing`, `/api/films`, `/api/books`,
`/api/github`, `/api/notes`) land in later slices on top of `CacheLayer`.

## Modules

- `src/server.ts` — Bun HTTP server + route handler.
- `src/cache/CacheLayer.ts` — generic stale-while-revalidate cache. Every
  upcoming endpoint wraps its upstream fetch in `cache.get(key, fetcher,
  { ttl })`. Returns `{ value, stale }`; `stale: true` means the upstream
  failed and we're serving last-good. Concurrent `get`s for the same key
  coalesce into one fetch.

## Running locally

```sh
bun install
bun run dev          # watch mode on :3000, BUILD_SHA defaults to "dev"
bun run test         # vitest
bun run typecheck    # tsc --noEmit
```

Or via the repo-root Makefile: `make api-install`, `make api-test`,
`make api-typecheck`, `make api-dev`.

For local secrets, copy `.env.example` to `.env` (gitignored). Adapter
slices will start consuming these.

## Deploy

`make deploy-api` from the repo root:

1. `git rev-parse --short HEAD` → `BUILD_SHA`
2. `bun build --compile --target=bun-linux-x64 ...
   --define process.env.BUILD_SHA="<sha>"`
3. `rsync api/dist/ → /opt/chaipalaka-api/`
4. `ssh ... systemctl restart chaipalaka-api`

Production secrets live in `/etc/chaipalaka.env` on the server (root:root,
mode 600) and are loaded into the unit via `EnvironmentFile=`. See
`deploy/SECRETS.md`.
