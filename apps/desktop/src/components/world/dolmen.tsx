import React from 'react'
import { plural, t } from '@lingui/core/macro'
import type { Character } from '@/@types/roster'
import { Head } from '@/components/world/head'
import { useGlide } from '@/hooks/use-glide'
import { useLingering } from '@/hooks/use-lingering'

const ONE_ROW = 4
const TWO_ROWS = 8

export const LEAVE_MS = 300

type DolmenProps = Readonly<{
  characters: readonly Character[]
  onOpenCharacter: (nickname: string) => void
  onRemoveCharacter: (nickname: string) => void
}>

const nicknameOf = (character: Character) => {
  return character.nickname
}

const crowdOf = (count: number) => {
  if (count <= ONE_ROW) {
    return 'lone'
  }

  if (count <= TWO_ROWS) {
    return 'some'
  }

  return 'many'
}

export const Dolmen = ({
  characters,
  onOpenCharacter,
  onRemoveCharacter
}: DolmenProps) => {
  const seat = React.useRef<HTMLDivElement>(null)
  const places = useLingering({
    items: characters,
    keyOf: nicknameOf,
    wait: LEAVE_MS
  })

  const roll = places
    .map(({ item, isLeaving }) => {
      return `${isLeaving ? '-' : '+'}${item.nickname}`
    })
    .join('·')

  useGlide(seat, roll)

  const connected = characters.filter((character) => {
    return character.online
  }).length

  return (
    <div className="dolmen-field pointer-events-none">
      <div
        ref={seat}
        data-crowd={crowdOf(characters.length)}
        className="dolmen-seat pointer-events-auto flex w-dolmen flex-col items-center"
      >
        <span
          aria-hidden
          className="glade pointer-events-none absolute -inset-x-6 -inset-y-8"
        />
        <span
          aria-hidden
          className="hearth pointer-events-none absolute -inset-x-4 -inset-y-3"
        />
        <div className="relative grid w-full place-items-center py-5">
          {places.length === 0 ? (
            <p className="alight relative max-w-cluster text-center text-aside text-balance text-khaki">
              {t`Ouvrez un client Dofus : votre personnage viendra se poser ici.`}
            </p>
          ) : (
            <ul className="relative flex max-w-cluster flex-wrap items-end justify-center gap-x-2 gap-y-1.5">
              {places.map(({ item, isLeaving }) => {
                return (
                  <li
                    key={item.nickname}
                    data-place={item.nickname}
                    data-going={isLeaving ? '' : undefined}
                    inert={isLeaving}
                    className="place"
                  >
                    <div className="alight">
                      <Head
                        character={item}
                        onOpen={() => {
                          onOpenCharacter(item.nickname)
                        }}
                        onRemove={() => {
                          onRemoveCharacter(item.nickname)
                        }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <p className="plaque absolute top-full left-1/2 -mt-1 -translate-x-1/2 rounded-full px-3 py-0.5 font-carve text-legend tracking-widest text-khaki-lit uppercase">
          {plural(connected, {
            one: '# connecté',
            other: '# connectés'
          })}
        </p>
      </div>
    </div>
  )
}
