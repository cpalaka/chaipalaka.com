# Secrets pattern

No secrets ever live in this repository. The pattern is:

## Server-side (Bun API service)

All API keys and tokens for the upcoming Bun service (last.fm, Letterboxd, GitHub, etc.) live in a single env file on the Hetzner box:

```
/etc/chaipalaka.env
```

Permissions and ownership:

```
sudo chown root:root /etc/chaipalaka.env
sudo chmod 600 /etc/chaipalaka.env
```

The systemd unit for the Bun service references this file via `EnvironmentFile=`:

```ini
# /etc/systemd/system/chaipalaka-api.service  (will land in slice for backend)
[Service]
EnvironmentFile=/etc/chaipalaka.env
ExecStart=/opt/chaipalaka-api/server
User=chai
```

Format (one `KEY=value` per line, no quoting):

```
LASTFM_API_KEY=xxxxxxxxxxxxxxxxxxxx
LASTFM_USER=cpalaka
GOODREADS_USER_ID=<your-numeric-id>
LETTERBOXD_USER=cpalaka
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

## Local development

For local development of the Bun service (lands in a later slice), copy the
`.env.example` (forthcoming, in `api/`) to `api/.env` and fill in keys. `.env`
files are gitignored at the repo root.

## Frontend

The frontend ships zero secrets. All third-party data flows through `/api/*`
endpoints proxied to the Bun service by Caddy, so the static `web/dist`
artifact never embeds any key material.

## Verification

To confirm no secrets leaked into the repo:

```sh
git grep -niE '(api[_-]?key|secret|token|password)\s*=\s*["'\''][^"'\'']{8,}'
```

Expect zero matches.
