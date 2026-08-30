import type { Class, Gender } from '@/@types/roster'

export type WalkFrom =
  | 'listeningLost'
  | 'noWindowLeft'
  | 'shortcut'
  | 'tray'
  | 'window'

export type WalkIdle = 'nobodyInCycle' | 'tooSlow'

export type WalkLiveState = 'off' | 'on'

export type WalkStatus = {
  readonly enabled: boolean
  readonly banner: BannerPlace
}

export type BannerCorner = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'

export type BannerPlace = {
  readonly corner: BannerCorner
  readonly screen: string | null
}

export type BannerCharacter = {
  readonly nickname: string
  readonly class: Class | null
  readonly gender: Gender | null
}

export type BannerStep = {
  readonly corner: BannerCorner
  readonly character: BannerCharacter | null
  readonly previewing: boolean
}
