import { describe, test, expect, beforeEach, vi } from 'vitest'

beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
})

interface Track {
    artist: string
    title: string
    album?: string
    albumArt?: string
    isNowPlaying: boolean
}

function stubFetchResolve(track: Track | null) {
    return vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue({
            json: () => Promise.resolve({ track, stale: false }),
        } as unknown as Response)
}

function stubFetchReject() {
    return vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('network'))
}

async function setup() {
    const rtl = await import('@testing-library/react')
    const mod = await import('./NowPlaying')
    return { ...rtl, ...mod }
}

describe('NowPlaying', () => {
    test('loading renders placeholder span', async () => {
        vi.spyOn(globalThis, 'fetch').mockReturnValue(
            new Promise(() => {}) as Promise<Response>,
        )
        const { render, NowPlaying } = await setup()
        const { container } = render(<NowPlaying />)
        const span = container.querySelector('span')
        expect(span?.className).toBe('now-playing now-playing--placeholder')
        expect(span?.textContent).toBe('—')
    })

    test('data.track == null renders placeholder', async () => {
        stubFetchResolve(null)
        const { render, waitFor, NowPlaying } = await setup()
        const { container } = render(<NowPlaying />)
        await waitFor(() => {
            expect(
                container.querySelector('span.now-playing--placeholder'),
            ).toBeTruthy()
        })
    })

    test('isNowPlaying=true shows live indicator with dot', async () => {
        stubFetchResolve({
            artist: 'Artist',
            title: 'Song',
            isNowPlaying: true,
        })
        const { render, waitFor, NowPlaying } = await setup()
        const { container } = render(<NowPlaying />)
        await waitFor(() => {
            expect(container.querySelector('.now-playing__live')).toBeTruthy()
        })
        expect(container.querySelector('.now-playing__dot')).toBeTruthy()
    })

    test('isNowPlaying=false has no live indicator', async () => {
        stubFetchResolve({
            artist: 'Artist',
            title: 'Song',
            isNowPlaying: false,
        })
        const { render, waitFor, NowPlaying } = await setup()
        const { container } = render(<NowPlaying />)
        await waitFor(() => {
            expect(container.querySelector('.now-playing__title')).toBeTruthy()
        })
        expect(container.querySelector('.now-playing__live')).toBeNull()
    })

    test('albumArt present + album renders <img> with alt "{album} cover"', async () => {
        stubFetchResolve({
            artist: 'Artist',
            title: 'Song',
            album: 'AlbumName',
            albumArt: 'https://example.com/art.jpg',
            isNowPlaying: false,
        })
        const { render, waitFor, NowPlaying } = await setup()
        const { container } = render(<NowPlaying />)
        await waitFor(() => {
            expect(container.querySelector('img')).toBeTruthy()
        })
        const img = container.querySelector('img') as HTMLImageElement
        expect(img.alt).toBe('AlbumName cover')
    })

    test('albumArt present + no album renders <img> with alt "{title} cover"', async () => {
        stubFetchResolve({
            artist: 'Artist',
            title: 'Song',
            albumArt: 'https://example.com/art.jpg',
            isNowPlaying: false,
        })
        const { render, waitFor, NowPlaying } = await setup()
        const { container } = render(<NowPlaying />)
        await waitFor(() => {
            expect(container.querySelector('img')).toBeTruthy()
        })
        const img = container.querySelector('img') as HTMLImageElement
        expect(img.alt).toBe('Song cover')
    })

    test('albumArt absent renders no <img>', async () => {
        stubFetchResolve({
            artist: 'Artist',
            title: 'Song',
            isNowPlaying: false,
        })
        const { render, waitFor, NowPlaying } = await setup()
        const { container } = render(<NowPlaying />)
        await waitFor(() => {
            expect(container.querySelector('.now-playing__title')).toBeTruthy()
        })
        expect(container.querySelector('img')).toBeNull()
    })

    test('two <NowPlaying> instances trigger exactly one fetch("/api/now-playing")', async () => {
        const spy = stubFetchResolve(null)
        const { render, waitFor, NowPlaying } = await setup()
        const { container } = render(
            <>
                <NowPlaying />
                <NowPlaying />
            </>,
        )
        await waitFor(() => {
            expect(
                container.querySelectorAll('span.now-playing--placeholder')
                    .length,
            ).toBe(2)
        })
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith('/api/now-playing')
    })

    test('fetch reject renders placeholder', async () => {
        stubFetchReject()
        const { render, waitFor, NowPlaying } = await setup()
        const { container } = render(<NowPlaying />)
        await waitFor(() => {
            expect(
                container.querySelector('span.now-playing--placeholder'),
            ).toBeTruthy()
        })
    })
})
