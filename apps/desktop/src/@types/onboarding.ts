export type Step =
  | 'authorization'
  | 'focus'
  | 'gameSetting'
  | 'notifications'
  | 'proof'

export type Check = 'blocked' | 'ready' | 'unknown'

export type KnownCheck = Exclude<Check, 'unknown'>

export type Page = 'welcome' | Step

export type StepStatus = {
  readonly step: Step
  readonly check: Check
  readonly proven: boolean
}

export type Onboarding = {
  readonly done: boolean
  readonly steps: readonly StepStatus[]
  readonly hasNotice: boolean
}

export type SystemPage = 'authorization' | 'focus' | 'notifications'
