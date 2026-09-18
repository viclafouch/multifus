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

type TaskbarChange = Readonly<{
  label: MessageDescriptor
  lost: MessageDescriptor
  won: MessageDescriptor
}>

const LOST_NAME = msg`Sans Multifus`

const WON_NAME = msg`Avec Multifus`

const TAKES = [
  {
    tone: 'lost',
    shot: TASKBAR_STACKED_SHOT,
    title: LOST_NAME,
    line: msg`Vous cherchez votre Enutrof.`,
    alt: msg`Quatre boutons de la barre des tâches de Windows, tous avec la même icône Dofus Retro, et un titre coupé faute de place.`
  },
  {
    tone: 'won',
    shot: TASKBAR_SPLIT_SHOT,
    title: WON_NAME,
    line: msg`Vous le voyez.`,
    alt: msg`Les mêmes quatre boutons avec Multifus : chacun porte la tête de classe de son personnage, cerclée de sa couleur, et son pseudo sans le nom du jeu.`
  }
] as const satisfies readonly TaskbarTake[]

const CHANGES = [
  {
    label: msg`L’icône`,
    lost: msg`la même icône pour tous vos clients`,
    won: msg`la tête de classe du personnage, à sa couleur`
  },
  {
    label: msg`Le nom`,
    lost: msg`le pseudo, puis « - Dofus Retro »`,
    won: msg`le pseudo, et rien d’autre`
  }
] as const satisfies readonly TaskbarChange[]

const GROUPING = msg`Si votre Windows colle les fenêtres d’un même jeu sous un seul bouton, Multifus rend son bouton à chacune.`

export const TaskbarProof = () => {
  const { i18n } = useLingui()

  return (
    <div className="slab flex w-full max-w-[700px] flex-col">
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
                  className="strip w-auto"
                />
              </div>
            </figure>
          </React.Fragment>
        )
      })}
      <span aria-hidden className="rule border-t" />
      <div className="flex flex-col gap-4 p-5 sm:p-7">
        <ul className="flex flex-col gap-3 text-aside">
          {CHANGES.map(({ label, lost, won }) => {
            const named = i18n._(label)

            return (
              <li
                key={named}
                className="grid items-baseline gap-x-5 gap-y-1 sm:grid-cols-[6rem_1fr]"
              >
                <span className="rubric text-khaki">{named}</span>
                <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="sr-only">{i18n._(LOST_NAME)}</span>
                  <s className="text-band">{i18n._(lost)}</s>
                  <span aria-hidden className="text-khaki">
                    →
                  </span>
                  <span className="sr-only">{i18n._(WON_NAME)}</span>
                  <span className="text-cream">{i18n._(won)}</span>
                </span>
              </li>
            )
          })}
        </ul>
        <p className="text-aside text-band">{i18n._(GROUPING)}</p>
      </div>
    </div>
  )
}
