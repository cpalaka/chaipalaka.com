// Portal links + Pocket footnote references are the only Ladder peek/keep
// triggers. External links (annotation cards) are deferred to task-029; in-page
// anchors never peek. Single source of truth: `PeekTriggers` reads it to wire
// peeks; `pin/pinLocator` reads it to define the candidate set a persisted pin's
// source word is re-resolved against (task-028).
export const LADDER_TRIGGER_SELECTOR =
    'a[data-link-type="portal"], a[href^="#user-content-fn-"]'
