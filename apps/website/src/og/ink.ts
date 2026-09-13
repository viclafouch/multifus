export const OG_INK = {
  iron: '#241f19',
  band: '#978870',
  khaki: '#c7bfa1',
  cream: '#f2ead6',
  leaf: '#248b2e',
  leafLit: '#289b33'
} as const satisfies Record<string, string>

export const inkedWith = (color: string, alpha: number) => {
  const channels = [1, 3, 5].map((at) => {
    return Number.parseInt(color.slice(at, at + 2), 16)
  })

  return `rgb(${channels.join(' ')} / ${alpha})`
}
