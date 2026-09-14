export type HeadingLevel = 1 | 2 | 3

export const HEADING_TAGS = {
  1: 'h1',
  2: 'h2',
  3: 'h3'
} as const satisfies Record<HeadingLevel, string>
