# Local verification before committing

> Extracted from `CLAUDE.md` (split-to-index). `CLAUDE.md` keeps the gate
> summary and points here for the full commands.

Run these in `web/` (or the relevant package directory):

```sh
npm run typecheck
npm run test
npm run build      # confirms vite-react-ssg prerender still works
npm run dev        # smoke check the route renders, then kill it
```

For the prerender check, look for `data-server-rendered="true"` and the
expected route HTML inside `<div id="root">` in `web/dist/index.html`.

Then a secret-leak scan from the repo root:

```sh
grep -rniE '(api[_-]?key|secret|token|password)\s*[:=]\s*["'\''][^"'\'']{8,}' \
  --include='*.ts' --include='*.tsx' --include='*.js' \
  --include='*.json' --include='*.md' --include='Makefile' \
  --exclude-dir=node_modules --exclude-dir=dist \
  --exclude-dir=.git --exclude-dir=assets .
```

Expect zero matches. Secrets live in `/etc/chaipalaka.env` on the server
(see `deploy/SECRETS.md`); never in the repo, never in `web/` runtime.
