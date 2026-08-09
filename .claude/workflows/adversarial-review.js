export const meta = {
  name: 'adversarial-review',
  description: 'Adversarial pre-merge review of a task branch (modest|full modes)',
  whenToUse: 'After the verify gate is green on a task branch, BEFORE diff review/merge. args: {mode: "modest"|"full", task: "task-NNN[.NN]", diffRange: "main...HEAD", specSections: "…", focus: "…", docs: ["path", …]}. AGENT COUNT: full mode projects >20 agents, ABOVE the harness\'s default "medium" dynamic-workflow-size guideline of <15 — the harness guideline binds first, so state the projected count in chat and confirm the size setting before launching a full run. Relay ALL confirmed findings to the user verbatim; the session that wrote the code never self-dismisses one. MODEL POLICY: this fork is deliberately all-workhorse at every stage. Its original rationale (2026-07-13) was "conserve the weekly Fable budget" — a RATIONING argument that no longer holds on its own terms; the fork stays all-workhorse because nothing here has been measured to need the scarce tier, not because the tier is unaffordable. To buy scarce capability, port the args.scarce posture ladder from the space-miner copy (the reference shape named by the multi-agent-policy skill) rather than reintroducing a fable boolean.',
  phases: [
    { title: 'Find', detail: 'independent finder lenses over the branch diff', model: 'claude-opus-5' },
    { title: 'Critic', detail: 'full mode only: completeness pass', model: 'claude-opus-5' },
    { title: 'Verify', detail: 'severity-tiered xhigh skeptic panels', model: 'claude-opus-5' },
    { title: 'Synthesize', detail: 'full mode only: cross-finding synthesis', model: 'claude-opus-5' },
  ],
}

// MODEL IDS ARE CONCRETE, NEVER ALIASES. multi-agent-policy requires resolving the ID by probe at
// authoring time: a short tier alias can lag a release and keep serving the prior generation while
// every rule still reads correct (2026-07-24). Probed 2026-08-08 via `claude -p --output-format
// json`: alias `opus` -> canonicalModel claude-opus-5. Re-probe when a generation ships.
// (meta above must stay a pure literal, so the ID is spelled out there rather than interpolated.)
const WORKHORSE = 'claude-opus-5'

// ---------------------------------------------------------------------------
// args + mode config
// ---------------------------------------------------------------------------
// `args` may arrive as a parsed object OR — in this harness — as a JSON-encoded STRING.
// Reading `.mode` off a raw string yields undefined and silently defaults the whole run to
// `modest` (diagnosed on space-miner task-008's review: it ran modest despite mode:"full").
function _parseArgs(a) {
  if (a == null) return {}
  if (typeof a === 'string') { try { return JSON.parse(a) } catch (_e) { return {} } }
  return a
}
const A = _parseArgs(args)
const mode = A.mode === 'full' ? 'full' : 'modest'
const task = A.task || 'the task branch'
const diffRange = A.diffRange || 'main...HEAD'
const specSections = A.specSections || 'the sections named in the task description'
const focus = A.focus || ''
const docs = Array.isArray(A.docs) ? A.docs : A.docs ? [A.docs] : []

const FINDER_EFFORT = mode === 'full' ? 'xhigh' : 'high' // the user-pinned effort split

// Doc discovery: this repo has many specs/plans, so the task's own board entry is the
// pointer of record — every task's description/notes name its plan + spec (backlog-core
// wiring rule). An explicit args.docs overrides.
const DOC_STEP = docs.length
  ? `2. The authoritative docs for this task (focus: ${specSections}): ${docs.join(', ')}.`
  : `2. \`backlog task view ${task} --plain\` — its Description/Notes name the plan + spec
   (and the plan section names the spec sections). Read the cited plan section and spec
   sections (focus: ${specSections}).`

// ---------------------------------------------------------------------------
// schemas
// ---------------------------------------------------------------------------
const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'file', 'severity', 'claim', 'failure_scenario'],
        properties: {
          title: { type: 'string' },
          file: { type: 'string', description: 'repo-relative path' },
          line: { type: 'integer' },
          severity: { enum: ['HIGH', 'MEDIUM', 'LOW'] },
          claim: { type: 'string', description: 'the defect, self-contained, no conversation references' },
          failure_scenario: { type: 'string', description: 'concrete inputs/state -> wrong behavior' },
          spec_ref: { type: 'string', description: 'spec/plan/ADR section the claim checks against' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['verdict', 'reasoning'],
  properties: {
    verdict: { enum: ['CONFIRMED', 'REFUTED', 'UNCERTAIN'] },
    reasoning: { type: 'string' },
    severity_correction: { enum: ['HIGH', 'MEDIUM', 'LOW', 'NONE'] },
  },
}

// ---------------------------------------------------------------------------
// shared context block for every finder
// ---------------------------------------------------------------------------
const CONTEXT = `You are one independent lens in an adversarial pre-merge review of ${task}
in chaipalaka.com — a React + TypeScript personal site (vite-react-ssg prerendered, code in
web/src) with a matter.js foreground physics layer and a dev-only Atelier tuning tool. You
have NO prior context — everything you conclude must come from what you read now.

Read, in this order:
1. \`git diff ${diffRange}\` and \`git log --oneline ${diffRange}\` — the change under review.
${DOC_STEP}
3. CONTEXT.md (domain vocabulary) and any docs/adr/ entries the task or spec cites.
4. Any file the diff touches, in full — the diff alone hides context.
${focus ? `Extra steer from the orchestrator: ${focus}\n` : ''}
Rules: report only defects you can state as a concrete failure scenario (inputs/state -> wrong
behavior). Style nits and preferences are NOT findings. Severity: HIGH = wrong behavior a site
visitor, the verify gate (typecheck/test/build/prerender), or a downstream task can hit, or a
broken standing invariant (read-at-use tuning, dormant-gravity bit-identity, prod-never-imports-
Atelier, a spec-pinned behavior); MEDIUM = wrong under a plausible edge; LOW = latent risk/smell
worth a look. Do not propose fixes — name defects.`

const LENSES = [
  {
    key: 'spec-conformance',
    prompt: `${CONTEXT}

YOUR LENS — spec conformance, derived independently: BEFORE reading the diff, read the spec/plan
sections and write down (for yourself) the exact expected behavior — pinned formulas, field
semantics, mode gates, deletion lists, precedence orderings. THEN read the diff and hunt
mismatches between what the spec pins and what the code does. Check pinned numbers and file
sweeps item-by-item (a 10-file sweep that touched 9 is a finding). Re-verify the plan section's
"Spec claims this slice load-bears on" line refs against the actual source — a stale claim the
code built on is a finding. A test that asserts the wrong expectation is a finding too.`,
  },
  {
    key: 'stack-gotchas',
    prompt: `${CONTEXT}

YOUR LENS — stack traps and test validity: check the diff against this repo's known failure
modes. matter.js: frictionAir*(dt/16.667) > ~2 inverts drag into amplification -> NaN (never let
a coupled frictionAir grow unclamped); Body.translate moves positionPrev too (no implied
velocity) while setPosition/setAnchor-style teleports zero it — confusing the two breaks
"stays where left"; tether anchorA is body-relative (moving a parent body yanks child tethers);
constraint stiffness "near zero" means 1e-9, not 0 or 1e-4. React/SSG: effect-only physics must
never run at prerender (window/localStorage guards); component-imported CSS code-splits away
from the no-JS floor; hydration mismatches (React #418) surface on the errors channel, not
console. Atelier: whole-file regen drops any field not in its schema — new feel constants
belong in separate read-at-use modules, never physicsTuning.ts, and mode/driftScale never in
.layout.ts files. For every test in the diff: could it be VACUOUSLY GREEN? (jsdom has no real
layout; mocked physics can make assertions tautological; a single-frame snapshot of a
mid-settle spring asserts nothing — demand invariants or per-frame traces; bundle-splitting
guards need a build to exist first).`,
  },
  {
    key: 'edge-lifecycle',
    prompt: `${CONTEXT}

YOUR LENS — edges, lifecycle, ordering: stale closures and refs read after the thing they
describe changed; effect cleanup that leaks subscriptions/bodies/rAF loops; same-frame races
(effect vs rAF vs flushSync, physics tick vs React commit, register/unregister vs navigation);
unmount mid-transition; boundary conditions (<= vs <, zero/empty collections, first-tick state,
exact-radius/threshold); re-entrancy and strobing between states (park/recall, peek phases);
resize/scroll handlers firing before layout settles.`,
  },
]

if (mode === 'full') {
  LENSES.push(
    {
      key: 'contract-drift',
      prompt: `${CONTEXT}

YOUR LENS — standing-contract drift: this repo's load-bearing contracts, hunted in the diff.
Read-at-use tuning: consumers read tuning fields at the moment of use, never capture at
construction/import. Controller contract: get/subscribe/mutators, React-agnostic, consumed via
the bridge hook — never a re-implemented subscribe ritual. Bundle direction: production code
never imports the Atelier (dev-only); the prod-bundle guard depends on it. Dormant gravity:
mode:'gravity' behavior stays bit-identical — a drift-era change that leaks into the dormant
path is a finding. Frontend boundaries: talks /api/* only, no server paths/IPs; no files >~1MB
committed. Hunt logic that belongs one layer over, state smuggled where a fact should be, or a
second writer to a one-writer surface.`,
    },
    {
      key: 'test-adequacy',
      prompt: `${CONTEXT}

YOUR LENS — test adequacy: enumerate every behavior the diff introduces or changes, then map
each to a test that would FAIL if that behavior regressed. Report the unpinned ones (severity
by blast radius). Check the PRD's "### Modules with tests" roster — if the diff touches a
roster module, its required coverage must still hold. Check assertions are relational/pinned,
not tautological; check "verified by smoke" behaviors are genuinely un-unit-testable rather
than just untested.`,
    },
  )
}

// ---------------------------------------------------------------------------
// Phase 1: Find (Fable, fresh-context, parallel)
// ---------------------------------------------------------------------------
phase('Find')
log(`adversarial-review ${mode} on ${task} (${diffRange}) — ${LENSES.length} Opus finders @ ${FINDER_EFFORT}`)

const finderResults = await parallel(
  LENSES.map((l) => () =>
    agent(l.prompt, { label: `find:${l.key}`, phase: 'Find', model: WORKHORSE, effort: FINDER_EFFORT, schema: FINDINGS_SCHEMA })),
)
const finderDropped = LENSES.filter((_, i) => !finderResults[i]).map((l) => l.key)
let raw = finderResults.filter(Boolean).flatMap((r) => r.findings)
log(`finders returned ${raw.length} raw findings${finderDropped.length ? ` — DROPPED lenses: ${finderDropped.join(', ')}` : ''}`)

// ---------------------------------------------------------------------------
// Phase 2 (full only): completeness critic (Fable)
// ---------------------------------------------------------------------------
if (mode === 'full') {
  phase('Critic')
  const summary = raw.map((f) => `- [${f.severity}] ${f.file}:${f.line || '?'} ${f.title}`).join('\n')
  const critic = await agent(
    `${CONTEXT}

YOUR LENS — completeness critic: an independent panel already reviewed this diff and found:
${summary || '(nothing)'}

Your job is what they MISSED. Do not re-argue their findings. Look for: files in the diff no
finding touches, spec sections (${specSections}) no finding checks, interaction between changed
systems, and the second-order effects of the listed findings. Report only NEW defects, same rules.`,
    { label: 'critic:missed', phase: 'Critic', model: WORKHORSE, effort: 'xhigh', schema: FINDINGS_SCHEMA },
  )
  if (critic) {
    raw = raw.concat(critic.findings)
    log(`critic added ${critic.findings.length} findings`)
  } else {
    log('critic DROPPED (agent error) — coverage gap, note in report')
  }
}

// ---------------------------------------------------------------------------
// dedup (plain code — barrier is legitimate: needs all finders)
// ---------------------------------------------------------------------------
const SEV_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1 }
const buckets = new Map()
for (const f of raw) {
  const key = `${f.file}:${Math.round((f.line || 0) / 10)}`
  const prior = buckets.get(key)
  if (!prior) buckets.set(key, { ...f, merged_titles: [f.title] })
  else {
    prior.merged_titles.push(f.title)
    if (SEV_RANK[f.severity] > SEV_RANK[prior.severity]) {
      prior.severity = f.severity
      prior.claim = f.claim
      prior.failure_scenario = f.failure_scenario
      prior.title = f.title
    }
  }
}
const deduped = [...buckets.values()]
log(`${raw.length} raw -> ${deduped.length} after dedup (bucketed by file + ~10-line window; merged titles kept)`)

// ---------------------------------------------------------------------------
// Phase 3: Verify — severity-tiered Opus xhigh skeptics, scoped prompts
// ---------------------------------------------------------------------------
phase('Verify')

const SKEPTIC_ANGLES = {
  'refute-it': 'Try to REFUTE this finding: find the guard, ordering, or invariant that makes the claimed failure impossible. Only CONFIRM if you cannot.',
  'reproduce-it': 'Walk the claimed failure scenario step by step through the actual code paths (name file:line for every step). CONFIRM only if the walk reaches the wrong behavior.',
  'spec-check': `Check the claim against the authoritative text it cites (resolve the doc via \`backlog task view ${task} --plain\`${docs.length ? ` or these docs: ${docs.join(', ')}` : ''}). CONFIRM only if the authoritative text really pins the behavior the code violates.`,
}

function skeptic(f, angle) {
  return agent(
    `You are verifying ONE code-review finding on ${task} (diff: \`git diff ${diffRange}\`) in
chaipalaka.com (React + TS, web/src). Read ONLY what you need: ${f.file}${f.line ? ` around line ${f.line}` : ''}, the
files it directly touches, and ${f.spec_ref ? `the cited section ${f.spec_ref}` : 'the cited spec/plan section'}.
Do NOT roam the repo.

FINDING [${f.severity}] ${f.title}
Claim: ${f.claim}
Failure scenario: ${f.failure_scenario}

${SKEPTIC_ANGLES[angle]} If the evidence is genuinely ambiguous, return UNCERTAIN — never guess.
If confirmed but mis-rated, set severity_correction.`,
    { label: `verify:${angle}:${f.file.split('/').pop()}`, phase: 'Verify', model: WORKHORSE, effort: 'xhigh', schema: VERDICT_SCHEMA },
  )
}

async function verifyFinding(f) {
  if (f.severity === 'LOW') return { ...f, status: 'LOW_UNVERIFIED', votes: [], votesSent: 0, votesReturned: 0 }
  let angles = f.severity === 'HIGH' ? ['refute-it', 'reproduce-it', 'spec-check'] : ['refute-it']
  let votes = await parallel(angles.map((a) => () => skeptic(f, a).then((v) => (v ? { ...v, angle: a } : null))))
  // MEDIUM escalation: a single UNCERTAIN vote earns the full panel
  if (f.severity === 'MEDIUM' && votes.filter(Boolean).length === 1 && votes.filter(Boolean)[0].verdict === 'UNCERTAIN') {
    const extra = await parallel([
      () => skeptic(f, 'reproduce-it').then((v) => (v ? { ...v, angle: 'reproduce-it' } : null)),
      () => skeptic(f, 'spec-check').then((v) => (v ? { ...v, angle: 'spec-check' } : null)),
    ])
    angles = angles.concat(['reproduce-it', 'spec-check'])
    votes = votes.concat(extra)
  }
  const returned = votes.filter(Boolean)
  const confirmed = returned.filter((v) => v.verdict === 'CONFIRMED').length
  const refuted = returned.filter((v) => v.verdict === 'REFUTED').length
  // VOTE-LEVEL reconciliation (improvements 2026-06-28): a dropped vote or a tie is NOT a clean
  // survival — flag for main-loop adjudication instead of letting refuted-quorum math pass it.
  const dropped = votes.length - returned.length
  let status
  if (dropped > 0 || confirmed === refuted) status = 'NEEDS_MAIN_LOOP_ADJUDICATION'
  else if (confirmed > refuted) status = 'CONFIRMED'
  else status = 'REFUTED'
  return { ...f, status, votes: returned, votesSent: angles.length, votesReturned: returned.length }
}

const verifyResults = await parallel(deduped.map((f) => () => verifyFinding(f)))
// FINDING-LEVEL reconciliation: sent vs verdicts returned, never survived-vs-refuted
const verified = verifyResults.filter(Boolean)
const findingsDropped = deduped.filter((_, i) => !verifyResults[i])
if (findingsDropped.length) log(`RECONCILIATION FAILURE: ${findingsDropped.length}/${deduped.length} findings returned no verdict object — recover from agent transcripts and adjudicate in the main loop`)

const confirmed = verified.filter((f) => f.status === 'CONFIRMED')
const refuted = verified.filter((f) => f.status === 'REFUTED')
const adjudicate = verified.filter((f) => f.status === 'NEEDS_MAIN_LOOP_ADJUDICATION')
const lows = verified.filter((f) => f.status === 'LOW_UNVERIFIED')
log(`verify: ${confirmed.length} confirmed, ${refuted.length} refuted, ${adjudicate.length} need adjudication, ${lows.length} LOW passed through`)

// ---------------------------------------------------------------------------
// Phase 4 (full only): Fable synthesis
// ---------------------------------------------------------------------------
let synthesis = null
if (mode === 'full' && (confirmed.length + adjudicate.length) > 0) {
  phase('Synthesize')
  const body = confirmed.concat(adjudicate).map((f) =>
    `[${f.status} ${f.severity}] ${f.file}:${f.line || '?'} — ${f.title}\n${f.claim}\nScenario: ${f.failure_scenario}`).join('\n\n')
  synthesis = await agent(
    `You are synthesizing the confirmed findings of an adversarial review of ${task}
(chaipalaka.com, React + TS; diff \`git diff ${diffRange}\`). Findings:

${body}

Produce: (1) a severity-ranked list with one-line consequences; (2) shared root causes — do several
findings trace to one wrong assumption?; (3) interactions — does fixing one change another?; (4) the
minimal fix ORDER that avoids rework. Read code only where needed to settle an interaction question.
Return the report as plain text.`,
    { label: 'synthesize', phase: 'Synthesize', model: WORKHORSE, effort: 'xhigh' },
  )
}

// ---------------------------------------------------------------------------
// result — the orchestrating session relays confirmed/adjudicate/LOW findings
// to the user VERBATIM and never self-dismisses one; fixes wait for the user.
// ---------------------------------------------------------------------------
return {
  mode,
  task,
  diffRange,
  reconciliation: {
    lenses_sent: LENSES.length,
    lenses_dropped: finderDropped,
    findings_to_verify: deduped.length,
    verdicts_returned: verified.length,
    findings_dropped_in_verify: findingsDropped.map((f) => `${f.file}:${f.line || '?'} ${f.title}`),
  },
  confirmed,
  needs_adjudication: adjudicate,
  low_unverified: lows,
  refuted: refuted.map((f) => ({ title: f.title, file: f.file, line: f.line, reason: (f.votes.find((v) => v.verdict === 'REFUTED') || {}).reasoning })),
  synthesis,
}
