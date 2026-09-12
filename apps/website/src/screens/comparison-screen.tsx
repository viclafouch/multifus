import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { Point } from '@/@types/body'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { DownloadButton } from '@/components/download-button'
import { OutLink } from '@/components/out-link'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PointList } from '@/components/point-list'
import { Prose } from '@/components/prose'
import { ProseBlock } from '@/components/prose-block'
import { RivalTable } from '@/components/rival-table'
import { Sheet } from '@/components/sheet'
import { PAGES } from '@/constants/pages'
import { FOLD_ANCHOR, REPOSITORY } from '@/constants/site'

const HOW_READ = msg`Chaque case est lue dans le code de l’outil, jamais sur sa page d’accueil. Un outil qui garde son code fermé n’a pas de colonne ici. Et Multifus perd deux lignes, parce qu’un comparatif qu’on gagne partout ne vaut rien.`

const MISSING_TITLE = msg`Ce que Multifus laisse aux autres`

const MISSING_POINTS = [
  {
    lead: msg`Il ne range pas les fenêtres côte à côte.`,
    line: msg`C’est un choix, et il ne changera pas : Multifus amène devant vous celle du personnage qui joue, il ne redessine pas votre bureau.`
  },
  {
    lead: msg`Il ne garde pas de compositions d’équipe.`,
    line: msg`Deux outils du tableau le font, et pas lui.`
  }
] as const satisfies readonly Point[]

const CHECK_TITLE = msg`Vérifiez ce tableau vous-même`

const CHECK_POINTS = [
  {
    lead: msg`Chaque colonne mène à son dépôt.`,
    line: msg`C’est là que ses cases ont été lues, et vous pouvez lire le même code que nous.`
  }
] as const satisfies readonly Point[]

const CHECK_LEAD = msg`Une case qui vous paraît fausse se corrige ici :`

const CHECK_NAME = msg`Le dépôt de Multifus sur GitHub`

export const ComparisonScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { kin } = PAGES[page]

  return (
    <>
      <Band id={FOLD_ANCHOR} className="pt-10 pb-16">
        <PageHead page={page} />
      </Band>
      <Sheet>
        <Band className="gap-7 pt-16 pb-6">
          <Prose>{i18n._(HOW_READ)}</Prose>
          <RivalTable />
        </Band>
        <Band className="reveal pt-12">
          <ProseBlock level={2} title={i18n._(MISSING_TITLE)}>
            <PointList points={MISSING_POINTS} />
          </ProseBlock>
          <ProseBlock level={2} title={i18n._(CHECK_TITLE)}>
            <PointList points={CHECK_POINTS} />
            <p className="max-w-tale text-tale text-band">
              {i18n._(CHECK_LEAD)}{' '}
              <OutLink href={REPOSITORY}>{i18n._(CHECK_NAME)}</OutLink>
            </p>
          </ProseBlock>
        </Band>
        <PageKin pages={kin} />
        <Band className="pb-20">
          <DownloadButton />
        </Band>
      </Sheet>
    </>
  )
}
