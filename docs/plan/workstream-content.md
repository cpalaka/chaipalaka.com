# Workstream — Content

Words and media. The least code, the most uncertainty, and the only work that is
mostly **Chai's own hands** rather than a session's.

**Pieces:** WP-06 content authoring · WP-09 flash catalogue ingest ·
WP-10 `/claude` (content half)
**Budget:** ≈27 h of the ≈155 h scope total — on an assumption that may be wrong by
±11 h.

**Scheduled earliest, not last.** This is Chai-only serial time, and it is
therefore the stream most likely to **silently starve**. Its M1 checklist is the
detector.

---

## The assumption this whole stream rests on

Brief §6.9 is `[unanswered]`: Q6 asked, per route, whether content is *written* or
*needs writing*, and that half was never answered for any route. So **nobody
established whether Chai's prose-writing time comes out of the 133 h.**

**This plan assumes it does** — the conservative reading — and books 11 h in WP-06.
If prose time is *outside* the budget, the build budget gains 11 h and CUT-4 stands
down.

**This is the single most valuable question Chai can answer early.** It is **O2**,
with a forcing date of **2026-08-02**.

---

## Verified starting position

Not from the board, not from memory. Inspected on `main` @ `1d5bed6`, 2026-07-26:

| Surface | Reality |
|---|---|
| `content/blog/` | 5 posts, **4 of them `draft: true`**. Production `/blog` lists **one** ("Hello, World") |
| `content/stuff/flash/` | **4** entries — `ava`, `biglittle`, `biolet`, `counter` — against a stated ~40 |
| media files | `assets/` **exists** (gitignored, as the >1 MB rule requires): 33 MB — those 4 as `.swf` + PNG, plus `assets/ruffle/nightly-2026-05-12/` |
| `/about` | No route, no copy |
| `/claude` | ~15 documents named; none in the repo |
| `/lifelog` | Live data, no authored copy |

A4's bar is "all the routes that exist currently... filled in with all the
content". Against this starting position that is a substantial amount of writing,
and it is why CUT-3 and CUT-4 sit where they do in the register.

---

## WP-06 · Content authoring, per route · M1–M2 · 8–15 h

| Item | Notes |
|---|---|
| `/about` bio prose | On WP-04's critical path (its Portal-links AC needs real prose). **CUT-6** reduces it to one strong paragraph without losing the route |
| 4 × `draft: true` blog posts | Each finished or explicitly cut. **CUT-4** publishes 1–2 and moves the rest to ongoing post-launch writing |
| lifelog card copy | Small — labels, framing, empty/stale states |
| route intros | `/stuff`, `/lifelog`, the `/claude` index blurb |
| `/claude` doc selections + one-liners | Only if WP-10 survives CUT-2 |

*(Flash per-item metadata is counted inside WP-09, not here.)*

**The starvation detector.** The checklist is built in M1 and drained through M2.
**By the M2 exit every item is done or explicitly cut via CUT-4/CUT-6 — no silent
starvation.** That check is what turns "we ran out of time to write" from a
launch-day discovery into a checkpoint decision.

**On cutting blog posts.** Writing does not compress under deadline pressure — it
just gets worse. A launch with two good posts and a live site beats one with five
rushed ones. But `/blog` must still *look* right with few posts, and that is
WP-05/WP-11's problem, not a reason to pad the content.

**Authoring mechanics are built; do not re-invent them.** Co-located post
directories (`content/blog/<yyyy-mm-dd>-<slug>/index.mdx`), zod-validated
frontmatter, `draft: true` excluded from production builds, and the MDX component
library (`Callout`, `Figure`, `Video`, `NowPlaying`, `BookCard`, `RuffleEmbed`). No
new content infrastructure for prod-v1.

---

## WP-09 · Flash catalogue ingest · M4 · 7–16 h · **CUT-3**

### What the input roadmaps got wrong, corrected

This plan was handed a finding as verified: *no `assets/` directory, no `.swf`
anywhere, the Ruffle runtime is itself an unsynced asset, `make assets-sync` has
never carried a payload, `/stuff/flash` is non-functional in production today.*

**That is false**, and the reason is instructive: it was verified against the
**git** tree, where `assets/` is invisible **by design** — the project's own rule
is that files over ~1 MB "live in gitignored `assets/` and ship via
`make assets-sync`". Checked against the working tree instead:

- `assets/` exists: **33 MB**, `ava`/`biglittle`/`biolet`/`counter` as `.swf` +
  PNG, **and `assets/ruffle/nightly-2026-05-12/`** — precisely the version
  `RuffleEmbed.tsx:3` requests (`/assets/ruffle/${RUFFLE_VERSION}/ruffle.js`).
- `make assets-sync`'s guard would find a real payload, not print "nothing to
  sync".
- `make deploy-web`'s rsync passes `--exclude='assets/'` alongside `--delete`, so a
  web deploy will not wipe synced assets.

**What is genuinely unknown: whether `assets-sync` has ever been run against the
box.** Not answerable from the repo in either direction. WP-02's M0 dry-run answers
it in one command:

```sh
curl -s -o /dev/null -w '%{http_code}' \
  https://chaipalaka.com/assets/ruffle/nightly-2026-05-12/ruffle.js
```

**The acceptance criterion survives the correction.** An AC that only checks local
dev playback would pass over a broken production route. **Require the live-host
check** — the guard rail was right for the wrong reason.

### Scope, in order

1. **Locate the remaining ~36 items.** The *format* half of this step is closed:
   **O4 was answered 2026-07-28 — the catalogue is all `.swf`**, so everything
   plays through the shipped, tested `RuffleEmbed` and the +≈6 h video branch is
   off the table ([`open-questions.md`](open-questions.md) §T11). What remains is
   whether the items are locatable at all — **TRIGGER-G and R5 still stand**.
2. Extend `assets/` (no conversion needed).
3. `make assets-sync` — **human-gated**, it targets the server.
4. Author ~36 content entries. The existing four show the shape: title,
   description, category, quality, tags, plus a short retrospective body.
5. **Verify playback on the live host, not locally.**

**CUT-3** ships ~10 pieces instead of ~40 — the pipeline is what matters, and
adding pieces later is one `assets-sync` plus a content file each.

**TRIGGER-G**: if the source media is not locatable and classified by
**2026-09-06**, CUT-3 fires. Risk **R5** is that it may not exist in usable form at
all — in which case `/stuff/flash` is re-scoped honestly to the four pieces it has
rather than promised and missed.

**Repo boundary:** nothing over ~1 MB is ever committed to git. That rule is what
makes this a separate stream from the code — and, as above, what made the inherited
finding wrong.

---

## WP-10 · `/claude` content half · M4 · **CUT-2**

≈15 documents — teach lessons, recipes, tournament results, documentation, much
already HTML (A5, A13).

**Default: copy into `content/claude/`** rather than pull from `~/Claude/` at build
time — a build-time pull from outside the repo breaks a clean clone of a public
repo (T10).

**The hidden cost, and why the estimate is 9–14 h rather than A13's flat
"weekend": the repo is public.** Fifteen AI-generated documents need a read-through
each before publication — for anything personal, anything half-finished, anything
that reads badly out of context. That review is most of the upper range.

---

## Content-stream risks

- **R5 — the flash media may not exist in usable form.** Its *format* is no
  longer part of the risk (O4 answered 2026-07-28: all `.swf`); existence is.
  TRIGGER-G forces the question early enough to cut cleanly.
- **R3 — the ±11 h authoring assumption** (O2). Answerable by Chai in one sentence;
  unresolved it is the plan's largest single unknown, and this stream is the one
  that starves when it goes wrong.
- **Public-repo hygiene applies to content as to code.** Task files, blog drafts
  and `/claude` documents are all repo content. The secret-scan covers the
  mechanical half; the judgement half is the read-through.
