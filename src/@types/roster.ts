export type Gender = 'female' | 'male'

export type Character = {
  readonly nickname: string
  readonly gender: Gender | null
  readonly asleep: boolean
  readonly online: boolean
  readonly relayed: boolean
}
