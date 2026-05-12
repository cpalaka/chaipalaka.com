import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import { RuffleEmbed, __resetRuffleLoaderForTests } from './RuffleEmbed'

interface MockPlayer extends HTMLDivElement {
    play: ReturnType<typeof vi.fn>
    load: ReturnType<typeof vi.fn>
}

function makeMockPlayer(): MockPlayer {
    const el = document.createElement('div') as MockPlayer
    el.play = vi.fn()
    el.load = vi.fn().mockResolvedValue(undefined)
    return el
}

function setupGlobalRuffleStub(player: MockPlayer) {
    ;(window as any).RufflePlayer = {
        newest: () => ({
            createPlayer: () => player,
        }),
    }
}

function clearGlobalRuffleStub() {
    delete (window as any).RufflePlayer
}

beforeEach(() => {
    __resetRuffleLoaderForTests()
    clearGlobalRuffleStub()
    document.head.querySelectorAll('script[data-ruffle]').forEach((s) => s.remove())
})

afterEach(() => {
    cleanup()
    clearGlobalRuffleStub()
})

describe('RuffleEmbed', () => {
    test('renders a play button overlay before user clicks', () => {
        const player = makeMockPlayer()
        setupGlobalRuffleStub(player)

        render(
            <RuffleEmbed
                swfUrl="/assets/stuff/flash/test.swf"
                width={550}
                height={400}
            />,
        )

        expect(screen.getByRole('button', { name: /play/i })).toBeTruthy()
    })

    test('on play click: loads SWF and calls player.play(), hides overlay', async () => {
        const player = makeMockPlayer()
        setupGlobalRuffleStub(player)

        render(
            <RuffleEmbed
                swfUrl="/assets/stuff/flash/test.swf"
                width={550}
                height={400}
            />,
        )

        // Wait for the script-load promise to resolve (synchronous in this stub setup)
        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: /play/i }),
            ).not.toBeDisabled()
        })

        fireEvent.click(screen.getByRole('button', { name: /play/i }))

        await waitFor(() => {
            expect(player.load).toHaveBeenCalled()
        })
        expect(player.play).toHaveBeenCalled()
        expect(screen.queryByRole('button', { name: /play/i })).toBeNull()
    })

    test('renders fallback when script load rejects', async () => {
        // Force loader rejection via the test hook
        __resetRuffleLoaderForTests(() => Promise.reject(new Error('script blocked')))

        render(
            <RuffleEmbed
                swfUrl="/assets/stuff/flash/test.swf"
                width={550}
                height={400}
            />,
        )

        await waitFor(() => {
            expect(screen.getByText(/requires javascript/i)).toBeTruthy()
        })
    })
})
