import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { defineSceneParams } from '../../canvas/scenes/paramSchema'

let canvasMountIds: number[] = []
let nextCanvasId = 0

vi.mock('@react-three/fiber', () => ({
    Canvas: ({ children }: { children?: ReactNode }) => {
        const idRef = useRef<number>(-1)
        if (idRef.current === -1) {
            idRef.current = nextCanvasId++
        }
        useEffect(() => {
            canvasMountIds.push(idRef.current)
        }, [])
        return (
            <div data-testid="canvas" data-canvas-id={idRef.current}>
                {children}
            </div>
        )
    },
}))

import { Tuner } from './Tuner'

beforeEach(() => {
    canvasMountIds = []
    nextCanvasId = 0
})

const TestScene = ({ params }: { params?: Record<string, unknown> }) => (
    <div data-testid="scene-params">{JSON.stringify(params)}</div>
)

const SCHEMA = defineSceneParams({
    count:   { kind: 'number', default: 10, min: 1, max: 100, step: 1, label: 'Count', remount: true },
    speed:   { kind: 'range',  default: 0.5, min: 0, max: 1, step: 0.1, label: 'Speed' },
    accent:  { kind: 'color',  default: '#ff00ff', label: 'Accent' },
})

describe('Tuner', () => {
    test('renders one row per schema field with its label', () => {
        render(<Tuner schema={SCHEMA} Scene={TestScene} />)
        expect(screen.getByText('Count')).toBeInTheDocument()
        expect(screen.getByText(/Speed/)).toBeInTheDocument()
        expect(screen.getByText('Accent')).toBeInTheDocument()
    })

    test('passes default params to the Scene on first render', () => {
        render(<Tuner schema={SCHEMA} Scene={TestScene} />)
        const params = JSON.parse(screen.getByTestId('scene-params').textContent ?? '{}')
        expect(params).toEqual({ count: 10, speed: 0.5, accent: '#ff00ff' })
    })

    test('changing a non-remount field does NOT remount Canvas', () => {
        render(<Tuner schema={SCHEMA} Scene={TestScene} />)
        expect(canvasMountIds).toEqual([0])
        const slider = screen.getByDisplayValue('0.5') as HTMLInputElement
        fireEvent.change(slider, { target: { value: '0.7' } })
        expect(canvasMountIds).toEqual([0])
    })

    test('changing a remount: true field DOES remount Canvas', () => {
        render(<Tuner schema={SCHEMA} Scene={TestScene} />)
        expect(canvasMountIds).toEqual([0])
        const numberInput = screen.getByDisplayValue('10') as HTMLInputElement
        fireEvent.change(numberInput, { target: { value: '20' } })
        expect(canvasMountIds.length).toBeGreaterThan(1)
        expect(canvasMountIds[canvasMountIds.length - 1]).not.toBe(0)
    })

    test('dumps current params to console when Dump button is clicked', () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
        render(<Tuner schema={SCHEMA} Scene={TestScene} />)
        fireEvent.click(screen.getByRole('button', { name: /dump/i }))
        expect(spy).toHaveBeenCalled()
        spy.mockRestore()
    })
})
