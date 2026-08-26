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

export type Character = {
  readonly nickname: string
  readonly gender: Gender | null
  readonly class: Class | null
  readonly asleep: boolean
  readonly online: boolean
  readonly relayed: boolean
}
