import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { DownloadButton } from '@/components/download-button'
import { Opening } from '@/components/opening'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PageLink } from '@/components/page-link'
import { Prose } from '@/components/prose'
import { ProseBlock } from '@/components/prose-block'
import { RuneTable } from '@/components/rune-table'
import { PAGES } from '@/constants/pages'

const OPENING = msg`Le poids, c’est ce qu’une stat vaut en forgemagie. Un objet porte la somme des siennes, et c’est elle qui décide de ce qu’il rend au concasseur. La table entière est là, sans compte à créer et sans rien à installer.`

const STAGES = msg`La simple, la Pa et la Ra sont les trois stades d’une rune. Les trois premières colonnes disent ce que pèse chacune, la dernière ce que pèse un seul point de la stat.`

const READ_TITLE = msg`Lire une ligne`

const READ_BODY = msg`Prenez la ligne des éléments. Un point d’Intelligence pèse 1, et les trois runes qui le portent pèsent 1, 3 et 10 : le jeu les appelle Ine, Pa Ine et Ra Ine. Une Pa vaut donc trois simples, une Ra en vaut dix, et les vingt lignes se lisent de la même façon. Un tiret dit simplement que ce stade-là n’existe pas dans le jeu.`

const TRAP_TITLE = msg`La Pa et la Ra ne sont pas vos points d’action`

const TRAP_BODY = msg`C’est la confusion qui coûte le plus cher quand on débute : Pa et Ra sont les deux stades au-dessus de la rune simple, et ces deux syllabes ne disent rien des points d’action. Le PA, lui, est la première ligne de la table, et c’est la stat la plus lourde du jeu.`

const TRAP_WEIGHT = msg`Un seul point de PA pèse 100, là où un point de Force pèse 1 : une ligne de PA pèse à elle seule autant que cent points de Force. Sur un objet qui en porte un, c’est presque toujours elle qui décide du poids.`

const ROUND_TITLE = msg`Là où le jeu arrondit`

const ROUND_BODY = msg`Deux lignes ne suivent pas ce calcul. La vitalité porte une Ra à 8 là où la règle dirait 10, et les pods une Pa à 8 et une Ra à 25 là où elle dirait 9 et 30. Ce sont les deux seules stats dont un point pèse un quart, et le jeu ne les a jamais alignées sur la règle.`

const ROUND_TRUST = msg`Les chiffres de cette table sont ceux du jeu, jamais ceux du calcul. C’est exactement là que les tables recopiées se trompent.`

const USE_TITLE = msg`Quand ça sert`

const USE_BODY = msg`Avant de briser, vous additionnez le poids de chaque stat de l’objet, et vous savez ce qu’il vaut avant de le poser dans le concasseur plutôt qu’après. Devant l’enclume, le poids dit quelle rune est lourde et laquelle est légère, et donc laquelle avance vite et laquelle finit le travail.`

const OVER_TITLE = msg`La même table, posée sur votre fenêtre`

const OVER_BODY = msg`Multifus pose cette table par-dessus le client, à la touche que vous choisissez. Vous brisez, vous lisez le poids, vous continuez : l’atelier ne se quitte pas, et le navigateur reste fermé.`

const OVER_LINK = msg`Voir le tableau des runes`

const LIMIT_TITLE = msg`Ce que cette page ne fait pas`

const LIMIT_BODY = msg`Elle ne calcule rien à votre place. Elle ne sait pas ce que porte votre objet, elle ne dit pas vos chances de réussite, et elle ne remplace pas un simulateur. C’est une table, et son seul mérite est d’être juste.`

export const RuneScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { kin } = PAGES[page]

  return (
    <>
      <Band className="pb-6">
        <PageHead page={page} />
        <Opening>{i18n._(OPENING)}</Opening>
      </Band>
      <Band className="gap-3 py-0">
        <RuneTable />
        <p className="max-w-tale text-aside text-band">{i18n._(STAGES)}</p>
      </Band>
      <Band className="reveal pt-12">
        <ProseBlock level={2} title={i18n._(READ_TITLE)}>
          <Prose>{i18n._(READ_BODY)}</Prose>
        </ProseBlock>
        <ProseBlock level={2} title={i18n._(TRAP_TITLE)}>
          <Prose>{i18n._(TRAP_BODY)}</Prose>
          <Prose>{i18n._(TRAP_WEIGHT)}</Prose>
        </ProseBlock>
        <ProseBlock level={2} title={i18n._(ROUND_TITLE)}>
          <Prose>{i18n._(ROUND_BODY)}</Prose>
          <Prose>{i18n._(ROUND_TRUST)}</Prose>
        </ProseBlock>
        <ProseBlock level={2} title={i18n._(USE_TITLE)}>
          <Prose>{i18n._(USE_BODY)}</Prose>
        </ProseBlock>
        <ProseBlock level={2} title={i18n._(OVER_TITLE)}>
          <Prose>{i18n._(OVER_BODY)}</Prose>
          <p className="text-tale">
            <PageLink page="runeTable" className="rule border-b text-cream">
              {i18n._(OVER_LINK)}
            </PageLink>
          </p>
        </ProseBlock>
        <ProseBlock level={2} title={i18n._(LIMIT_TITLE)}>
          <Prose>{i18n._(LIMIT_BODY)}</Prose>
        </ProseBlock>
      </Band>
      <PageKin pages={kin} />
      <Band className="pb-20">
        <DownloadButton />
      </Band>
    </>
  )
}
