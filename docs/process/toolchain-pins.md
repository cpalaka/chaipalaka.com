# Toolchain pins (do not change without checking peer deps)

> Extracted from `CLAUDE.md` (split-to-index). `CLAUDE.md` keeps the one-line
> warning and points here for the table.
>
> **`web/package.json` is the source of truth for the actual versions.** The
> table below mirrors them to capture the *rationale* (the durable part); a
> `package.json` bump can leave the numbers here stale, so verify against
> `package.json` before trusting a specific version.

These are constrained by `vite-react-ssg`'s peer-dependency declarations as of
the slice 1 install. Bumping past them is a separate slice — verify
compatibility before changing:

| Package           | Pinned at      | Why                                  |
|-------------------|----------------|--------------------------------------|
| `vite`            | `^7.3.3`       | `vite-react-ssg` peer deps cap at v7 |
| `react-router-dom`| `^6.30.0`      | `vite-react-ssg` peer deps require v6|
| `vite-react-ssg`  | `^0.9.1-beta.1`| Latest available                     |
| `react`/`react-dom`| `^19.2.0`     | Per PRD                              |
| `typescript`      | `^5.9.3`       | TS 6 too fresh; revisit later        |

(Historical note: `vite-ssg` is Vue-only; the React equivalent is
`vite-react-ssg`. The PRD now says `vite-react-ssg` throughout — they are the
same intent.)
