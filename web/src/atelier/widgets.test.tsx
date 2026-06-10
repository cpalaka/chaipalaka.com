import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { defineTuning, defaultsOf } from '../canvas/scenes/paramSchema'
import { TuningFields } from './widgets'

const SCHEMA = defineTuning({
    count: { kind: 'number', default: 10, min: 1, max: 100, step: 1, label: 'Count' },
    speed: { kind: 'range', default: 0.5, min: 0, max: 1, step: 0.1, label: 'Speed' },
    accent: { kind: 'color', default: '#ff00ff', label: 'Accent' },
    showSag: { kind: 'boolean', default: true, label: 'Show sag' },
    gravity: { kind: 'enum', default: 'down', options: ['down', 'up', 'left', 'right'], label: 'Gravity' },
    chrome: {
        kind: 'group',
        label: 'Chrome',
        fields: {
            borderW: { kind: 'number', default: 4, min: 0, max: 8, step: 1, label: 'Border width' },
        },
    },
})

function renderFields(onChange = vi.fn()) {
    render(
        <TuningFields schema={SCHEMA} values={defaultsOf(SCHEMA)} onChange={onChange} />,
    )
    return onChange
}

describe('TuningFields — rendering', () => {
    test('renders a widget for every field kind with its default value', () => {
        renderFields()

        const count = screen.getByLabelText('Count') as HTMLInputElement
        expect(count.type).toBe('number')
        expect(count.value).toBe('10')

        const speed = screen.getByLabelText(/Speed/) as HTMLInputElement
        expect(speed.type).toBe('range')
        expect(speed.value).toBe('0.5')

        const accent = screen.getByLabelText(/Accent/) as HTMLInputElement
        expect(accent.type).toBe('color')
        expect(accent.value).toBe('#ff00ff')

        const showSag = screen.getByLabelText('Show sag') as HTMLInputElement
        expect(showSag.type).toBe('checkbox')
        expect(showSag.checked).toBe(true)

        const gravity = screen.getByLabelText('Gravity') as HTMLSelectElement
        expect(gravity.tagName).toBe('SELECT')
        expect(gravity.value).toBe('down')
        expect(Array.from(gravity.options).map((o) => o.value)).toEqual([
            'down',
            'up',
            'left',
            'right',
        ])
    })

    test('renders a group as a labelled fieldset with its child widgets inside', () => {
        renderFields()
        expect(screen.getByText('Chrome')).toBeInTheDocument()
        const borderW = screen.getByLabelText('Border width') as HTMLInputElement
        expect(borderW.type).toBe('number')
        expect(borderW.value).toBe('4')
    })
})

describe('TuningFields — onChange', () => {
    test('number and range edits produce the next values object with a parsed number', () => {
        const onChange = renderFields()
        fireEvent.change(screen.getByLabelText('Count'), { target: { value: '20' } })
        expect(onChange).toHaveBeenLastCalledWith({ ...defaultsOf(SCHEMA), count: 20 })

        fireEvent.change(screen.getByLabelText(/Speed/), { target: { value: '0.7' } })
        expect(onChange).toHaveBeenLastCalledWith({ ...defaultsOf(SCHEMA), speed: 0.7 })
    })

    test('boolean toggle and enum select produce the next values object', () => {
        const onChange = renderFields()
        fireEvent.click(screen.getByLabelText('Show sag'))
        expect(onChange).toHaveBeenLastCalledWith({ ...defaultsOf(SCHEMA), showSag: false })

        fireEvent.change(screen.getByLabelText('Gravity'), { target: { value: 'up' } })
        expect(onChange).toHaveBeenLastCalledWith({ ...defaultsOf(SCHEMA), gravity: 'up' })
    })

    test('color edit produces the next values object', () => {
        const onChange = renderFields()
        fireEvent.change(screen.getByLabelText(/Accent/), { target: { value: '#00ff00' } })
        expect(onChange).toHaveBeenLastCalledWith({ ...defaultsOf(SCHEMA), accent: '#00ff00' })
    })

    test('editing a group child replaces only that nested value', () => {
        const onChange = renderFields()
        fireEvent.change(screen.getByLabelText('Border width'), { target: { value: '6' } })
        expect(onChange).toHaveBeenLastCalledWith({
            ...defaultsOf(SCHEMA),
            chrome: { borderW: 6 },
        })
    })
})

describe('TuningFields — log-scale range', () => {
    const LOG_SCHEMA = defineTuning({
        stiffness: {
            kind: 'range',
            scale: 'log',
            default: 1.75e-5,
            min: 1e-9,
            max: 1e-3,
            step: 0.01,
            label: 'Tether stiffness',
        },
    })

    test('slider operates in log10 space over the curated decades', () => {
        render(
            <TuningFields
                schema={LOG_SCHEMA}
                values={defaultsOf(LOG_SCHEMA)}
                onChange={vi.fn()}
            />,
        )
        const slider = screen.getByLabelText(/Tether stiffness/) as HTMLInputElement
        expect(slider.type).toBe('range')
        expect(slider.min).toBe('-9')
        expect(slider.max).toBe('-3')
        expect(slider.value).toBe(String(Math.log10(1.75e-5)))
    })

    test('slider minimum produces true near-zero (1e-9), not a clamped 1e-4', () => {
        const onChange = vi.fn()
        render(
            <TuningFields
                schema={LOG_SCHEMA}
                values={defaultsOf(LOG_SCHEMA)}
                onChange={onChange}
            />,
        )
        fireEvent.change(screen.getByLabelText(/Tether stiffness/), {
            target: { value: '-9' },
        })
        expect(onChange).toHaveBeenLastCalledWith({ stiffness: 1e-9 })
    })

    test('intermediate positions round to 3 significant figures', () => {
        const onChange = vi.fn()
        render(
            <TuningFields
                schema={LOG_SCHEMA}
                values={defaultsOf(LOG_SCHEMA)}
                onChange={onChange}
            />,
        )
        fireEvent.change(screen.getByLabelText(/Tether stiffness/), {
            target: { value: '-4.5' },
        })
        expect(onChange).toHaveBeenLastCalledWith({ stiffness: 3.16e-5 })
    })

    test('tiny values display in exponential notation', () => {
        render(
            <TuningFields
                schema={LOG_SCHEMA}
                values={defaultsOf(LOG_SCHEMA)}
                onChange={vi.fn()}
            />,
        )
        expect(screen.getByText('1.75e-5')).toBeInTheDocument()
    })
})

describe('TuningFields — per-field dirty and reset', () => {
    test('dirty fields show a reset control with the dot-joined path; clean fields do not', () => {
        const onReset = vi.fn()
        render(
            <TuningFields
                schema={SCHEMA}
                values={defaultsOf(SCHEMA)}
                onChange={vi.fn()}
                isDirty={(path) => path === 'chrome.borderW'}
                onReset={onReset}
            />,
        )
        expect(screen.queryByLabelText('Reset Count')).toBeNull()
        const reset = screen.getByLabelText('Reset Border width')
        fireEvent.click(reset)
        expect(onReset).toHaveBeenCalledWith('chrome.borderW')
    })

    test('reset inside a checkbox label does not toggle the checkbox', () => {
        const onChange = vi.fn()
        render(
            <TuningFields
                schema={SCHEMA}
                values={defaultsOf(SCHEMA)}
                onChange={onChange}
                isDirty={() => true}
                onReset={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByLabelText('Reset Show sag'))
        expect(onChange).not.toHaveBeenCalled()
    })
})
