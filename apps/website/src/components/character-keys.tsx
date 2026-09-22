import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import craFemale from '@multifus/ankama/portraits/cra_f.webp'
import enutrofMale from '@multifus/ankama/portraits/enutrof_m.webp'
import { cn, type Tint } from '@multifus/retro'
import { PORTRAIT_SIDE } from '@/constants/portraits'

type CharacterKey = Readonly<{
  cap: string
  nickname: string
  breed: MessageDescriptor
  portrait: string
  tint: Tint
}>

const CHARACTER_KEYS = [
  {
    cap: 'F1',
    nickname: 'Grimzo',
    breed: msg`Enutrof`,
    portrait: enutrofMale,
    tint: 'tint-yellow'
  },
  {
    cap: 'F2',
    nickname: 'Pépite',
    breed: msg`Enutrof`,
    portrait: enutrofMale,
    tint: 'tint-orange'
  },
  {
    cap: 'F3',
    nickname: 'Elyandra',
    breed: msg`Crâ`,
    portrait: craFemale,
    tint: 'tint-sky'
  },
  {
    cap: 'F4',
    nickname: 'Sylve',
    breed: msg`Crâ`,
    portrait: craFemale,
    tint: 'tint-pine'
  }
] as const satisfies readonly CharacterKey[]

export const CharacterKeys = () => {
  const { i18n } = useLingui()

  return (
    <ul className="grid gap-drop sm:grid-cols-2 lg:grid-cols-4">
      {CHARACTER_KEYS.map(({ cap, nickname, breed, portrait, tint }) => {
        return (
          <li
            key={nickname}
            className={cn(
              'boon torch flex flex-col items-center gap-4 p-6 text-center',
              tint
            )}
          >
            <img
              src={portrait}
              alt=""
              width={PORTRAIT_SIDE}
              height={PORTRAIT_SIDE}
              loading="lazy"
              decoding="async"
              className="ringed size-16"
            />
            <span className="flex flex-col gap-0.5">
              <span className="nameplate">{nickname}</span>
              <span className="text-aside text-band">{i18n._(breed)}</span>
            </span>
            <kbd className="keycap">{cap}</kbd>
          </li>
        )
      })}
    </ul>
  )
}
