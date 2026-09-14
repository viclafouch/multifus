/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PAGE_IDS } from '@/constants/pages'
import { PAGE_TINTS } from '@/constants/tints'

const RETRO = readFileSync(
  join(
    import.meta.dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'retro',
    'src',
    'styles',
    'retro.css'
  ),
  'utf8'
)

const SITE = readFileSync(join(import.meta.dirname, '..', 'styles.css'), 'utf8')

const TINTED = [
  'aura',
  'boon',
  'lede',
  'rosette',
  'torch'
] as const satisfies readonly string[]

describe('the tint of the pages', () => {
  it.each(PAGE_IDS)('gives %s a tint the retro sheet declares', (page) => {
    expect(RETRO).toContain(`@utility ${PAGE_TINTS[page]} {`)
  })

  it.each(TINTED)('lets %s read the tint of its page', (utility) => {
    const declaration = SITE.split(`@utility ${utility} {`)[1]

    expect(declaration).toBeDefined()
    expect(declaration.split('\n@utility')[0]).toContain('var(--tint)')
  })
})
