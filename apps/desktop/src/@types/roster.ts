import type { ShortcutStatus } from '@/@types/shortcuts'

export type Gender = 'female' | 'male'

export type Class =
  | 'cra'
  | 'ecaflip'
  | 'eniripsa'
  | 'enutrof'
  | 'feca'
  | 'iop'
  | 'osamodas'
  | 'pandawa'
  | 'sacrieur'
  | 'sadida'
  | 'sram'
  | 'xelor'

export type Color =
  | 'blue'
  | 'earth'
  | 'green'
  | 'lavender'
  | 'orange'
  | 'pine'
  | 'pink'
  | 'red'
  | 'sky'
  | 'turquoise'
  | 'violet'
  | 'yellow'

export type Portrait = {
  readonly class: Class
  readonly gender: Gender
}

export type Character = {
  readonly nickname: string
  readonly gender: Gender | null
  readonly class: Class | null
  readonly color: Color | null
  readonly main: boolean
  readonly excluded: boolean
  readonly online: boolean
  readonly relayed: boolean
  readonly shortcut: string | null
  readonly shortcutStatus: ShortcutStatus
}
