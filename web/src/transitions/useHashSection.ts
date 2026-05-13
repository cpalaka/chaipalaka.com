import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { parseSectionHash } from './dispatch'

export interface UseHashSectionAPI {
    sectionIndex: number
    goToSection: (n: number, opts?: { push?: boolean }) => void
}

/**
 * Read the current section from `location.hash` (`#sN`; absent = section 1)
 * and expose a navigator for changing sections. The actual transition is
 * dispatched by `TransitionDirector`'s observer, which sees the hash change
 * and runs the section branch in `dispatch()` if the resolved pageDef has
 * `sections`. This hook owns the URL; it does NOT trigger transitions.
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
