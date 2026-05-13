import { describe, test, expect } from 'vitest'
import { pageDefs, notFoundFallbackPageDef } from './pageDefs'
import { pageDef as notFoundPageDef } from '../routes/NotFound'

describe('transitions/pageDefs', () => {
    test('exports the three canvas-route pageDefs (/, /lifelog, /stuff)', () => {
        expect(Object.keys(pageDefs).sort()).toEqual(['/', '/lifelog', '/stuff'])
    })

    test('every entry has { gravity, cards } shape', () => {
        for (const [path, def] of Object.entries(pageDefs)) {
            expect(typeof def.gravity, `${path}.gravity`).toBe('string')
            expect(Array.isArray(def.cards), `${path}.cards`).toBe(true)
        }
    })

    test('notFoundFallbackPageDef is the same reference as the NotFound route pageDef', () => {
        expect(notFoundFallbackPageDef).toBe(notFoundPageDef)
    })
})
