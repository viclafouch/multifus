import React from 'react'
import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import logo from '@multifus/retro/assets/logo.png'
import type { Onboarding } from '@/@types/onboarding'
import type { Character } from '@/@types/roster'
import type { ScreenName, Snapshot } from '@/@types/snapshot'
import type { Authorization } from '@/@types/system'
import { CharacterDialog } from '@/components/character-dialog'
import { Lamp } from '@/components/lamp'
import { MapTitle } from '@/components/layout/map-title'
import { Dolmen } from '@/components/world/dolmen'
import { WayList } from '@/components/world/way-list'
import { CLEARING, MAP_NAMES } from '@/constants/world'
import { colorHolders } from '@/helpers/colors'
import { matchIsAsking } from '@/helpers/onboarding'
import { authorizationLine, authorizationState } from '@/helpers/wording'
import { characterMarks } from '@/lib/character-marks'

const ASKING_SCREEN = 'settings' as const satisfies ScreenName

type ClearingScreenProps = Readonly<{
  characters: readonly Character[]
  authorization: Authorization
  onboarding: Onboarding
  paintPortraits: boolean
  onGo: (screen: ScreenName) => void
  run: (action: Promise<Snapshot>) => void
}>

export const ClearingScreen = ({
  characters,
  authorization,
  onboarding,
  paintPortraits,
  onGo,
  run
}: ClearingScreenProps) => {
  const [opened, setOpened] = React.useState<string | null>(null)
  const marks = characterMarks({ run })

  const asking = matchIsAsking(onboarding) ? ASKING_SCREEN : null

  const character =
    characters.find((candidate) => {
      return candidate.nickname === opened
    }) ?? null

  return (
    <main className="relative flex min-h-0 flex-1 flex-col px-6 pt-3">
      <header className="relative z-30 flex h-crown shrink-0 items-center gap-3 pr-40">
        <p className="limelight flex items-center gap-2 text-mark text-khaki">
          <Lamp state={authorizationState(authorization)} />
          {authorizationLine(authorization)}
        </p>
      </header>
      <div className="flex min-h-0 flex-1 flex-col items-start overflow-y-auto">
        <div className="settle my-auto flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="emblem size-emblem shrink-0" />
            <div className="flex flex-col gap-1">
              <MapTitle>{i18n._(MAP_NAMES[CLEARING])}</MapTitle>
              <p className="limelight text-aside text-khaki-lit">
                {t`Logiciel communautaire pour Dofus Retro`}
              </p>
            </div>
          </div>
          <span aria-hidden className="crest w-way" />
          <WayList asking={asking} onGo={onGo} />
        </div>
      </div>
      <Dolmen
        characters={characters}
        onOpenCharacter={setOpened}
        onRemoveCharacter={marks.handleRemove}
      />
      {character === null ? null : (
        <CharacterDialog
          character={character}
          paintPortraits={paintPortraits}
          takenColors={colorHolders(characters)}
          isOpen
          onOpenChange={() => {
            setOpened(null)
          }}
          onSetGender={(gender) => {
            marks.handleSetGender(character.nickname, gender)
          }}
          onSetClass={(characterClass) => {
            marks.handleSetClass(character.nickname, characterClass)
          }}
          onSetColor={(color) => {
            marks.handleSetColor(character.nickname, color)
          }}
          onSetPortrait={(portrait) => {
            marks.handleSetPortrait(character.nickname, portrait)
          }}
        />
      )}
    </main>
  )
}
