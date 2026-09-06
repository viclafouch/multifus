import { plural, t } from '@lingui/core/macro'
import type { Character } from '@/@types/roster'
import { Head } from '@/components/world/head'

const ONE_ROW = 4
const TWO_ROWS = 8

type DolmenProps = Readonly<{
  characters: readonly Character[]
  onOpenCharacter: (nickname: string) => void
  onRemoveCharacter: (nickname: string) => void
}>

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
  const connected = characters.filter((character) => {
    return character.online
  }).length

  return (
    <div className="dolmen-field pointer-events-none">
      <div
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
          {characters.length === 0 ? (
            <p className="relative max-w-cluster text-center text-aside text-balance text-khaki">
              {t`Ouvrez un client Dofus : votre personnage viendra se poser ici.`}
            </p>
          ) : (
            <ul className="relative flex max-w-cluster flex-wrap items-end justify-center gap-x-2 gap-y-1.5">
              {characters.map((character) => {
                return (
                  <li key={character.nickname}>
                    <Head
                      character={character}
                      onOpen={() => {
                        onOpenCharacter(character.nickname)
                      }}
                      onRemove={() => {
                        onRemoveCharacter(character.nickname)
                      }}
                    />
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
