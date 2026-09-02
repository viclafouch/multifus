import React from 'react'
import type { Character } from '@/@types/roster'
import { CharacterMedallion } from '@/components/character-medallion'
import { ColorStripe } from '@/components/color-stripe'
import { portraitFor } from '@/helpers/portrait'
import { characterPresence, characterPresenceSubLine } from '@/helpers/wording'

type CharacterLineProps = Readonly<{
  character: Character
  children: React.ReactNode
  mark?: React.ReactNode
}>

export const CharacterLine = ({
  character,
  children,
  mark
}: CharacterLineProps) => {
  return (
    <li
      data-offline={character.online ? undefined : ''}
      className="group relative flex items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 data-offline:dimmed"
    >
      {character.color === null ? null : (
        <ColorStripe
          color={character.color}
          className="absolute inset-y-2 left-0"
        />
      )}
      <CharacterMedallion
        portrait={portraitFor(character)}
        state={characterPresence(character)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="selectable truncate text-row font-medium group-data-offline:text-muted-foreground">
            {character.nickname}
          </p>
          {mark}
        </div>
        <p className="text-micro font-medium tracking-micro text-muted-foreground/65 uppercase">
          {characterPresenceSubLine(character)}
        </p>
      </div>
      {children}
    </li>
  )
}
