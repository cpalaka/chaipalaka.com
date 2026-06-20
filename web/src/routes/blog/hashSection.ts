import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export interface UseHashSectionAPI {
    sectionIndex: number
    goToSection: (n: number, opts?: { push?: boolean }) => void
}

/**
 * Parse a hash like `#s2` → 2. Empty / unrecognised → 1 (canonical section).
 */
export function parseSectionHash(hash: string): number {
    const m = /^#s(\d+)$/.exec(hash)
    if (!m) return 1
    const n = Number.parseInt(m[1]!, 10)
    return Number.isFinite(n) && n >= 1 ? n : 1
}

/**
 * Read the current blog section from `location.hash` (`#sN`; absent = section 1)
 * and expose a navigator for changing sections — the chain's pagination state.
 * Owns the URL only; the v1 `TransitionDirector` that used to animate the swap
 * was retired (ADR-0007), so a section change now just re-renders the chain.
 */
export function useHashSection(): UseHashSectionAPI {
    const { pathname, hash } = useLocation()
    const navigate = useNavigate()

    const goToSection = useCallback(
        (n: number, opts?: { push?: boolean }) => {
            const newHash = n <= 1 ? '' : `#s${n}`
            const replace = opts?.push === false
            navigate(`${pathname}${newHash}`, { replace })
        },
        [navigate, pathname],
    )

    return { sectionIndex: parseSectionHash(hash), goToSection }
}
