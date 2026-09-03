import { t } from '@lingui/core/macro'
import type { Portrait } from '@/@types/roster'
import { Lamp } from '@/components/lamp'
import { EmptyState } from '@/components/layout/empty-state'
import { CLASS_PORTRAITS } from '@/constants/classes'

const TEAM_PORTRAITS = [
  { class: 'iop', gender: 'male' },
  { class: 'eniripsa', gender: 'female' },
  { class: 'sram', gender: 'male' },
  { class: 'sadida', gender: 'female' },
  { class: 'xelor', gender: 'male' },
  { class: 'ecaflip', gender: 'female' }
] as const satisfies readonly Portrait[]

const emptySteps = () => {
  return [
    {
      title: t`Lancez le jeu`,
      line: t`Un client par personnage, comme d’habitude.`
    },
    {
      title: t`Entrez en jeu`,
      line: t`Compte, serveur, puis votre personnage.`
    },
    {
      title: t`Il arrive ici`,
      line: t`Sa ligne se pose seule, et elle y reste.`
    }
  ]
}

export const EmptyRoster = () => {
  return (
    <EmptyState
      title={t`Votre roster est vide`}
      body={t`Multifus ne connaît encore personne. Entrez en jeu, et votre premier personnage se pose ici tout seul.`}
      hint={t`Un client resté à l’écran de connexion n’a pas encore de pseudo.`}
      mark={<TeamMark />}
      footer={
        <>
          <Lamp state="live" />
          {t`Multifus regarde vos fenêtres, une fois par seconde.`}
        </>
      }
    >
      <ol className="grid w-full grid-cols-3 gap-2.5">
        {emptySteps().map((step, index) => {
          return (
            <li
              key={step.title}
              className="flex flex-col gap-1.5 rounded-lg border border-border bg-card/45 p-3.5 text-left"
            >
              <span className="font-mono text-log tabular-nums text-primary/80">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-row font-medium">{step.title}</span>
              <span className="text-note text-muted-foreground">
                {step.line}
              </span>
            </li>
          )
        })}
      </ol>
    </EmptyState>
  )
}

const TeamMark = () => {
  return (
    <span aria-hidden className="mb-1 flex items-center -space-x-3">
      {TEAM_PORTRAITS.map((portrait) => {
        return (
          <img
            key={portrait.class}
            alt=""
            src={CLASS_PORTRAITS[portrait.class][portrait.gender]}
            className="size-12 rounded-full border-2 border-background bg-card object-cover ring-1 ring-border"
          />
        )
      })}
    </span>
  )
}
