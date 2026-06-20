import { describe, test, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { parseSectionHash, useHashSection } from './hashSection'

describe('parseSectionHash', () => {
    test('#sN → N; absent / unrecognised → 1', () => {
        expect(parseSectionHash('#s3')).toBe(3)
        expect(parseSectionHash('')).toBe(1)
        expect(parseSectionHash('#nope')).toBe(1)
        expect(parseSectionHash('#s0')).toBe(1)
    })
})

function Capture({
    onAPI,
    onLocation,
}: {
    onAPI: (api: ReturnType<typeof useHashSection>) => void
    onLocation: (loc: { pathname: string; hash: string }) => void
}) {
    const api = useHashSection()
    onAPI(api)
    const loc = useLocation()
    const lastReport = useRef('')
    useEffect(() => {
        const key = `${loc.pathname}${loc.hash}`
        if (key !== lastReport.current) {
            lastReport.current = key
            onLocation({ pathname: loc.pathname, hash: loc.hash })
        }
    }, [loc, onLocation])
    return null
}

describe('useHashSection', () => {
    test('sectionIndex reflects current hash', () => {
        let api: ReturnType<typeof useHashSection> | null = null
        render(
            <MemoryRouter initialEntries={['/blog#s3']}>
                <Capture onAPI={(a) => (api = a)} onLocation={() => {}} />
            </MemoryRouter>,
        )
        expect(api!.sectionIndex).toBe(3)
    })

    test('sectionIndex is 1 when no hash present', () => {
        let api: ReturnType<typeof useHashSection> | null = null
        render(
            <MemoryRouter initialEntries={['/blog']}>
                <Capture onAPI={(a) => (api = a)} onLocation={() => {}} />
            </MemoryRouter>,
        )
        expect(api!.sectionIndex).toBe(1)
    })

    test('goToSection(N) navigates to /pathname#sN', () => {
        let api: ReturnType<typeof useHashSection> | null = null
        const seen: { pathname: string; hash: string }[] = []
        render(
            <MemoryRouter initialEntries={['/blog']}>
                <Capture
                    onAPI={(a) => (api = a)}
                    onLocation={(l) => seen.push(l)}
                />
            </MemoryRouter>,
        )

        act(() => {
            api!.goToSection(2)
        })

        expect(seen.at(-1)).toEqual({ pathname: '/blog', hash: '#s2' })
    })

    test('goToSection(1) clears the hash (canonical section 1)', () => {
        let api: ReturnType<typeof useHashSection> | null = null
        const seen: { pathname: string; hash: string }[] = []
        render(
            <MemoryRouter initialEntries={['/blog#s2']}>
                <Capture
                    onAPI={(a) => (api = a)}
                    onLocation={(l) => seen.push(l)}
                />
            </MemoryRouter>,
        )

        act(() => {
            api!.goToSection(1)
        })

        expect(seen.at(-1)).toEqual({ pathname: '/blog', hash: '' })
    })
})
