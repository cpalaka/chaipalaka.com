import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fieldsOf } from '../../canvas/scenes/paramSchema'
import type { TuningSchema } from '../../canvas/scenes/paramSchema'
import {
    TOKENS_BASE_SCHEMA,
    TOKENS_THEME_SCHEMA,
    BASE_TOKEN_BINDINGS,
    THEME_TOKEN_BINDINGS,
} from './tokens'

const here = dirname(fileURLToPath(import.meta.url))
const tokensCss = readFileSync(join(here, '../../styles/tokens.css'), 'utf8')

function leafPaths(schema: TuningSchema, prefix = ''): string[] {
    return fieldsOf(schema).flatMap((field) =>
        field.kind === 'group'
            ? leafPaths(field.fields, `${prefix}${field.key}.`)
            : [`${prefix}${field.key}`],
    )
}

function declarationCount(prop: string): number {
    return tokensCss.split(`${prop}:`).length - 1
}

describe('tokens schema bindings', () => {
    test('base bindings cover exactly the base schema leaf paths', () => {
        expect(Object.keys(BASE_TOKEN_BINDINGS).sort()).toEqual(
            leafPaths(TOKENS_BASE_SCHEMA).sort(),
        )
    })

    test('theme bindings cover exactly the theme schema leaf paths', () => {
        expect(Object.keys(THEME_TOKEN_BINDINGS).sort()).toEqual(
            leafPaths(TOKENS_THEME_SCHEMA).sort(),
        )
    })

    test('base tokens are declared exactly once — :root only, theme-independent', () => {
        for (const { prop } of Object.values(BASE_TOKEN_BINDINGS)) {
            expect(declarationCount(prop), `${prop} declarations`).toBe(1)
        }
    })

    test('theme tokens are declared in all four theme blocks', () => {
        for (const { prop } of Object.values(THEME_TOKEN_BINDINGS)) {
            expect(declarationCount(prop), `${prop} declarations`).toBe(4)
        }
    })
})
