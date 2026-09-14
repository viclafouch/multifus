import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearMocks, mockIPC } from '@tauri-apps/api/mocks'
import { characterMarks } from '@/lib/character-marks'
import { snapshotOf } from '@/test-doubles'

type Invoked = {
  readonly command: string
  readonly payload: unknown
}

const listenIPC = () => {
  const invoked: Invoked[] = []

  mockIPC((command, payload) => {
    invoked.push({ command, payload })

    return snapshotOf()
  })

  return invoked
}

const settled = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

describe('the moves of a character', () => {
  afterEach(() => {
    clearMocks()
  })

  it('gives its gender to the named character', async () => {
    const invoked = listenIPC()
    const run = vi.fn()

    characterMarks({ run }).handleSetGender('Kanpaï', 'female')
    await settled()

    expect(invoked).toStrictEqual([
      {
        command: 'set_gender',
        payload: { nickname: 'Kanpaï', gender: 'female' }
      }
    ])
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('gives its class, under the name Rust expects', async () => {
    const invoked = listenIPC()

    characterMarks({ run: vi.fn() }).handleSetClass('Kanpaï', 'iop')
    await settled()

    expect(invoked).toStrictEqual([
      { command: 'set_class', payload: { nickname: 'Kanpaï', class: 'iop' } }
    ])
  })

  it('gives its color, and takes it away when it is null', async () => {
    const invoked = listenIPC()
    const marks = characterMarks({ run: vi.fn() })

    marks.handleSetColor('Kanpaï', 'red')
    marks.handleSetColor('Kanpaï', null)
    await settled()

    expect(invoked).toStrictEqual([
      { command: 'set_color', payload: { nickname: 'Kanpaï', color: 'red' } },
      { command: 'set_color', payload: { nickname: 'Kanpaï', color: null } }
    ])
  })

  it('removes the named character from the roster', async () => {
    const invoked = listenIPC()
    const run = vi.fn()

    characterMarks({ run }).handleRemove('Kanpaï')
    await settled()

    expect(invoked).toStrictEqual([
      { command: 'remove_character', payload: { nickname: 'Kanpaï' } }
    ])
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('sets a portrait in two steps, the class then the gender', async () => {
    const invoked = listenIPC()
    const run = vi.fn()

    characterMarks({ run }).handleSetPortrait('Kanpaï', {
      class: 'sadida',
      gender: 'female'
    })
    await settled()

    expect(
      invoked.map((call) => {
        return call.command
      })
    ).toStrictEqual(['set_class', 'set_gender'])
    expect(run).toHaveBeenCalledTimes(1)
  })
})
