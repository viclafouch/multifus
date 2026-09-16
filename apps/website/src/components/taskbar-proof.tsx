import React from 'react'
import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { Picture } from '@/@types/media'
import { TASKBAR_SPLIT_SHOT, TASKBAR_STACKED_SHOT } from '@/constants/shots'

type TakeTone = 'lost' | 'won'

type TaskbarTake = Readonly<{
  tone: TakeTone
  shot: Picture
  title: MessageDescriptor
  line: MessageDescriptor
  alt: MessageDescriptor
}>

const TAKES = [
  {
    tone: 'lost',
    shot: TASKBAR_STACKED_SHOT,
    title: msg`Sans Multifus`,
    line: msg`Un seul bouton, et le même nom pour tout le monde.`,
    alt: msg`La barre des tâches de Windows avec un seul bouton Dofus Retro, qui empile les fenêtres de tous les personnages.`
  },
  {
    tone: 'won',
    shot: TASKBAR_SPLIT_SHOT,
    title: msg`Avec Multifus`,
    line: msg`Chaque personnage a le sien.`,
    alt: msg`La même barre des tâches avec un bouton par personnage, chacun portant son pseudo et sa tête de classe.`
  }
] as const satisfies readonly TaskbarTake[]

export const TaskbarProof = () => {
  const { i18n } = useLingui()

  return (
    <div className="slab flex flex-col">
      {TAKES.map(({ tone, shot, title, line, alt }, rank) => {
        const said = i18n._(title)

        return (
          <React.Fragment key={said}>
            {rank === 0 ? null : <span aria-hidden className="rule border-t" />}
            <figure
              data-tone={tone}
              className="hand flex flex-col gap-3.5 p-5 sm:p-7"
            >
              <figcaption className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="hand-name rubric">{said}</span>
                <span className="text-aside text-band">{i18n._(line)}</span>
              </figcaption>
              <div className="overflow-x-auto">
                <img
                  src={shot.src}
                  alt={i18n._(alt)}
                  width={shot.width}
                  height={shot.height}
                  loading="lazy"
                  decoding="async"
                  className="strip w-auto lg:w-full"
                />
              </div>
            </figure>
          </React.Fragment>
        )
      })}
    </div>
  )
}
