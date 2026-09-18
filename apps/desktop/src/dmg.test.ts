/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import CONFIG from '../src-tauri/tauri.conf.json'

const TAURI_DIR = join(import.meta.dirname, '..', 'src-tauri')

const IMAGE_WIDTH_TAG = 256

const IMAGE_LENGTH_TAG = 257

const SHORT_TYPE = 3

const ENTRY_SIZE = 12

const LITTLE_ENDIAN_MARK = 'II'

type Size = Readonly<{
  width: number
  height: number
}>

const sizesOf = (file: string): Size[] => {
  const bytes = readFileSync(file)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const littleEndian = bytes.toString('ascii', 0, 2) === LITTLE_ENDIAN_MARK
  const sizes: Size[] = []
  let at = view.getUint32(4, littleEndian)

  while (at !== 0) {
    const entries = view.getUint16(at, littleEndian)
    const tagged = new Map<number, number>()

    for (let rank = 0; rank < entries; rank += 1) {
      const entry = at + 2 + rank * ENTRY_SIZE
      const tag = view.getUint16(entry, littleEndian)
      const type = view.getUint16(entry + 2, littleEndian)

      tagged.set(
        tag,
        type === SHORT_TYPE
          ? view.getUint16(entry + 8, littleEndian)
          : view.getUint32(entry + 8, littleEndian)
      )
    }

    sizes.push({
      width: tagged.get(IMAGE_WIDTH_TAG) ?? 0,
      height: tagged.get(IMAGE_LENGTH_TAG) ?? 0
    })

    at = view.getUint32(at + 2 + entries * ENTRY_SIZE, littleEndian)
  }

  return sizes
}

describe('the background of the DMG', () => {
  it('measures the window that tauri.conf.json asks for, at one and two times', () => {
    const { dmg } = CONFIG.bundle.macOS
    const { width, height } = dmg.windowSize

    expect(sizesOf(join(TAURI_DIR, dmg.background))).toStrictEqual([
      { width, height },
      { width: width * 2, height: height * 2 }
    ])
  })
})
