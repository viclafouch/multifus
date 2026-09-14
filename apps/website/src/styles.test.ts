/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const RETRO_STYLES = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'packages',
  'retro',
  'src',
  'styles'
)

const SHEETS = [
  join(RETRO_STYLES, 'theme.css'),
  join(RETRO_STYLES, 'retro.css'),
  join(import.meta.dirname, 'styles.css')
]

const utilitiesOf = (path: string) => {
  return [
    ...readFileSync(path, 'utf8').matchAll(/^@utility ([\w-]+) \{/gmu)
  ].map((found) => {
    return found[1]
  })
}

describe('the style sheets the site loads', () => {
  it('never declares the same utility twice', () => {
    const declared = SHEETS.flatMap(utilitiesOf)

    const twice = declared.filter((name, rank) => {
      return declared.indexOf(name) !== rank
    })

    expect(twice).toStrictEqual([])
  })
})
