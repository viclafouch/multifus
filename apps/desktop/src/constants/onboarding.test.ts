import { describe, expect, it } from 'vitest'
import { SYSTEM_PAGES } from '@/constants/onboarding'
import VIEW_SOURCE from '../../src-tauri/src/app/view.rs?raw'

const STEP_BLOCK = /pub enum Step \{(?<variants>[^}]+)\}/u

const RUST_STEPS = (STEP_BLOCK.exec(VIEW_SOURCE)?.groups?.variants ?? '')
  .split(',')
  .map((variant) => {
    return variant.trim()
  })
  .filter((variant) => {
    return variant.length > 0
  })
  .map((variant) => {
    return `${variant.slice(0, 1).toLowerCase()}${variant.slice(1)}`
  })

describe('the steps of the onboarding', () => {
  it('are the ones Rust names, in the same order, the welcome page first', () => {
    expect(RUST_STEPS).toHaveLength(5)
    expect(Object.keys(SYSTEM_PAGES)).toStrictEqual(['welcome', ...RUST_STEPS])
  })
})
