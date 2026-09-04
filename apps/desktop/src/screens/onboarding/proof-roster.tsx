import { Ear } from 'lucide-react'
import { plural, t } from '@lingui/core/macro'
import type { Character } from '@/@types/roster'
import { Lamp } from '@/components/lamp'

type ProofRosterProps = Readonly<{
  characters: readonly Character[]
}>

export const ProofRoster = ({ characters }: ProofRosterProps) => {
  const online = characters.filter((character) => {
    return character.online
  })

  if (online.length === 0) {
    return (
      <div className="step-band rise rise-later flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border bg-card/20">
        <Ear
          aria-hidden
          className="size-mark shrink-0 text-muted-foreground/45"
          strokeWidth={1.4}
        />
        <p className="font-mono text-micro tracking-micro text-muted-foreground/55 uppercase">
          {t`Aucun personnage connecté`}
        </p>
      </div>
    )
  }

  return (
    <div className="step-band rise rise-later flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card/45 p-3">
      <p className="font-mono text-micro tracking-micro text-primary/80 uppercase">
        {plural(online.length, {
          one: 'Multifus voit # personnage',
          other: 'Multifus voit # personnages'
        })}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        {online.map((character) => {
          return (
            <li
              key={character.nickname}
              className="flex items-center gap-2 rounded-md border border-border/70 bg-background/40 px-2 py-1 text-note"
            >
              <Lamp state="live" />
              {character.nickname}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
