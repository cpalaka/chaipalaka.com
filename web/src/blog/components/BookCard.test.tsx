import { describe, test, expect, beforeEach, vi } from 'vitest'

beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
})

interface BookFromApi {
    slug: string
    title: string
    author: string
    status: 'currently-reading'
    cover?: string
}

function stubFetchResolve(books: BookFromApi[]) {
    return vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue({
            json: () => Promise.resolve({ books, stale: false }),
        } as unknown as Response)
}

function stubFetchReject() {
    return vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('network'))
}

async function setup() {
    const rtl = await import('@testing-library/react')
    const mod = await import('./BookCard')
    return { ...rtl, ...mod }
}

describe('BookCard', () => {
    test('loading state renders placeholder span', async () => {
        // Never-resolving fetch keeps loading=true forever.
        vi.spyOn(globalThis, 'fetch').mockReturnValue(
            new Promise(() => {}) as Promise<Response>,
        )
        const { render, BookCard } = await setup()
        const { container } = render(<BookCard slug="any" />)
        const span = container.querySelector('span')
        expect(span).toBeTruthy()
        expect(span?.className).toBe('book-card book-card--placeholder')
        expect(span?.textContent).toBe('—')
    })

    test('resolve with matching slug renders full card (cover, status, title, author)', async () => {
        stubFetchResolve([
            {
                slug: 'pale-fire',
                title: 'Pale Fire',
                author: 'Vladimir Nabokov',
                status: 'currently-reading',
                cover: 'https://example.com/pf.jpg',
            },
        ])
        const { render, waitFor, BookCard } = await setup()
        const { container } = render(<BookCard slug="pale-fire" />)
        await waitFor(() => {
            expect(
                container.querySelector('.book-card__title'),
            ).toBeTruthy()
        })
        expect(
            (container.querySelector('img.book-card__cover') as HTMLImageElement)
                .src,
        ).toBe('https://example.com/pf.jpg')
        expect(
            container.querySelector('.book-card__status')?.textContent,
        ).toBe('Reading')
        expect(
            container.querySelector('.book-card__title')?.textContent,
        ).toBe('Pale Fire')
        expect(
            container.querySelector('.book-card__author')?.textContent,
        ).toBe('Vladimir Nabokov')
    })

    test('resolve with no matching slug renders placeholder', async () => {
        stubFetchResolve([
            {
                slug: 'other',
                title: 'Other',
                author: 'X',
                status: 'currently-reading',
            },
        ])
        const { render, waitFor, BookCard } = await setup()
        const { container } = render(<BookCard slug="missing" />)
        await waitFor(() => {
            const span = container.querySelector('span.book-card--placeholder')
            expect(span).toBeTruthy()
        })
        expect(container.querySelector('.book-card__title')).toBeNull()
    })

    test('fetch reject renders placeholder', async () => {
        stubFetchReject()
        const { render, waitFor, BookCard } = await setup()
        const { container } = render(<BookCard slug="pale-fire" />)
        await waitFor(() => {
            expect(
                container.querySelector('span.book-card--placeholder'),
            ).toBeTruthy()
        })
    })

    test('two <BookCard> instances trigger exactly one fetch("/api/books")', async () => {
        const spy = stubFetchResolve([])
        const { render, waitFor, BookCard } = await setup()
        const { container } = render(
            <>
                <BookCard slug="a" />
                <BookCard slug="b" />
            </>,
        )
        await waitFor(() => {
            expect(
                container.querySelectorAll('span.book-card--placeholder')
                    .length,
            ).toBe(2)
        })
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith('/api/books')
    })

    test('cover not starting with http renders no <img>', async () => {
        stubFetchResolve([
            {
                slug: 'local',
                title: 'Local',
                author: 'L',
                status: 'currently-reading',
                cover: '/local/cover.jpg',
            },
        ])
        const { render, waitFor, BookCard } = await setup()
        const { container } = render(<BookCard slug="local" />)
        await waitFor(() => {
            expect(
                container.querySelector('.book-card__title'),
            ).toBeTruthy()
        })
        expect(container.querySelector('img')).toBeNull()
    })

    test('status "currently-reading" renders text "Reading"', async () => {
        stubFetchResolve([
            {
                slug: 's',
                title: 'T',
                author: 'A',
                status: 'currently-reading',
            },
        ])
        const { render, waitFor, BookCard } = await setup()
        const { container } = render(<BookCard slug="s" />)
        await waitFor(() => {
            expect(
                container.querySelector('.book-card__status'),
            ).toBeTruthy()
        })
        expect(
            container.querySelector('.book-card__status')?.textContent,
        ).toBe('Reading')
    })
})
