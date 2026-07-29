/**
 * The one wording for "this page doesn't exist", shared by every surface that
 * has to say it.
 *
 * There are two such surfaces because a miss can land in either layout. A URL
 * matching no route at all renders `NotFound` under `CanvasLayout` (physics
 * cards); a URL matching `/blog/:slug` with an unknown slug is already inside
 * `ContentBoxLayout`, where floating cards would hang over an empty box — so
 * that one says the same thing as prose. Same words either way (task-044).
 */
export const NOT_FOUND_TITLE = '404 — Page not found'

export const NOT_FOUND_BODY =
    "This page doesn't exist. Everything is floating away."
