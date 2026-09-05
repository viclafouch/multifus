import { t } from '@lingui/core/macro'
import type { Check as StepCheck } from '@/@types/onboarding'
import type { Character } from '@/@types/roster'
import { proofHeading } from '@/helpers/onboarding'

type ProofNamesProps = Readonly<{
  online: readonly Character[]
}>

const ProofNames = ({ online }: ProofNamesProps) => {
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {online.map((character) => {
        return (
          <li
            key={character.nickname}
            className="plaque selectable flex items-center gap-2 rounded-sm px-2.5 py-1 text-aside font-medium text-cream"
          >
            <span
              aria-hidden
              className="pip pip-live size-2 shrink-0 rounded-full"
            />
            {character.nickname}
          </li>
        )
      })}
    </ul>
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

  const isDone = check === 'ready'
  const isSeen = online.length > 0
  const heading = proofHeading({ isDone, online: online.length })

  return (
    <div className="flex flex-col items-center gap-3">
      <p
        data-done={isDone ? '' : undefined}
        className="limelight flex items-center gap-3 font-carve text-bar tracking-wide text-cream uppercase data-done:font-plain data-done:text-aside data-done:font-medium data-done:tracking-normal data-done:text-khaki data-done:normal-case"
      >
        <span
          aria-hidden
          data-done={isDone ? '' : undefined}
          className="sonar sonar-leaf size-2.5 shrink-0 rounded-full data-done:sonar-still"
        />
        {heading}
      </p>
      {isSeen ? <ProofNames online={online} /> : null}
      {isDone ? null : (
        <p className="text-aside text-khaki/80">
          {isSeen
            ? t`Plus qu’à vous faire appeler.`
            : t`Multifus écoute, la fenêtre apparaîtra ici.`}
        </p>
      )}
    </div>
  )
}
