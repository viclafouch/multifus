import { Check } from 'lucide-react'
import { plural, t } from '@lingui/core/macro'
import type { Check as StepCheck } from '@/@types/onboarding'
import type { Character } from '@/@types/roster'
import { Lamp } from '@/components/lamp'
import { checkLine } from '@/helpers/onboarding'
import { ProofLine } from '@/screens/onboarding/proof-line'

type ProofNamesProps = Readonly<{
  online: readonly Character[]
}>

const ProofNames = ({ online }: ProofNamesProps) => {
  return (
    <ul className="flex flex-wrap justify-center gap-1.5">
      {online.map((character) => {
        return (
          <li
            key={character.nickname}
            className="selectable flex items-center gap-2 rounded-md border border-border/70 bg-card/50 px-2 py-1 text-note font-medium"
          >
            <Lamp state="live" />
            {character.nickname}
          </li>
        )
      })}
    </ul>
  )
}

type ProofDoneProps = Readonly<{
  online: readonly Character[]
}>

const ProofDone = ({ online }: ProofDoneProps) => {
  return (
    <div className="step-band live-light rise rise-later flex flex-col items-center justify-center gap-2.5 rounded-xl border border-live/35 bg-live/5 px-6">
      <span className="bloom flex size-sigil shrink-0 items-center justify-center rounded-full bg-live/15 text-live ring-1 ring-live/45">
        <Check aria-hidden className="size-mark" strokeWidth={2.4} />
      </span>
      <p className="max-w-lead text-lead text-balance text-live">
        {checkLine('proof', 'ready')}
      </p>
      {online.length === 0 ? null : <ProofNames online={online} />}
    </div>
  )
}

type ProofWaitProps = Readonly<{
  online: readonly Character[]
}>

const ProofWait = ({ online }: ProofWaitProps) => {
  const isSeen = online.length > 0
  const seenLabel = isSeen
    ? plural(online.length, {
        one: 'Multifus voit # personnage',
        other: 'Multifus voit # personnages'
      })
    : t`Aucun personnage connecté`

  return (
    <div className="step-band rise rise-later flex items-center justify-center">
      <ol className="flex w-full max-w-blurb flex-col">
        <ProofLine
          hasTrail
          state={isSeen ? 'done' : 'listening'}
          label={seenLabel}
        >
          {isSeen ? (
            <ProofNames online={online} />
          ) : (
            <p className="text-note text-muted-foreground">
              {t`Ouvrez le jeu et connectez-vous, il apparaît ici.`}
            </p>
          )}
        </ProofLine>
        <ProofLine
          hasTrail={false}
          state={isSeen ? 'listening' : 'pending'}
          label={t`L’appel du jeu`}
        >
          <p className="text-note text-muted-foreground">
            {t`Un combat, un message privé : Multifus vous amène devant.`}
          </p>
        </ProofLine>
      </ol>
    </div>
  )
}

type ProofBandProps = Readonly<{
  characters: readonly Character[]
  check: StepCheck
}>

export const ProofBand = ({ characters, check }: ProofBandProps) => {
  const online = characters.filter((character) => {
    return character.online
  })

  if (check === 'ready') {
    return <ProofDone online={online} />
  }

  return <ProofWait online={online} />
}
