import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { DownloadButton } from '@/components/download-button'
import { OutLink } from '@/components/out-link'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { Prose } from '@/components/prose'
import { ProseBlock } from '@/components/prose-block'
import { RivalTable } from '@/components/rival-table'
import { PAGES } from '@/constants/pages'
import { REPOSITORY } from '@/constants/site'

const HOW_READ = msg`Chaque case de ce tableau est lue dans le code de l’outil, jamais sur sa page d’accueil. Un outil qui garde son code fermé n’a pas de colonne ici : rien de ce qu’il promet ne se vérifie. Et vous trouverez deux lignes que Multifus ne coche pas, parce qu’un comparatif où l’on gagne partout ne vaut rien.`

const MISSING_TITLE = msg`Ce que Multifus laisse aux autres`

const MISSING_BODY = msg`Multifus ne range pas les fenêtres côte à côte : c’est un choix, et il ne changera pas. Il amène devant vous celle du personnage qui joue, il ne redessine pas votre bureau. Et il ne garde pas encore de compositions d’équipe.`

const CHECK_TITLE = msg`Vérifiez ce tableau vous-même`

const CHECK_BODY = msg`Chaque nom de colonne mène au dépôt de l’outil, là où nous avons lu ses cases. Une case qui vous paraît fausse se vérifie dans le même code que nous, et elle se corrige ici :`

const CHECK_NAME = msg`Le dépôt de Multifus sur GitHub`

export const ComparisonScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { kin } = PAGES[page]

  return (
    <>
      <Band className="pb-6">
        <PageHead page={page} />
        <Prose>{i18n._(HOW_READ)}</Prose>
      </Band>
      <Band className="py-0">
        <RivalTable />
      </Band>
      <Band className="pt-10">
        <ProseBlock title={i18n._(MISSING_TITLE)}>
          <Prose>{i18n._(MISSING_BODY)}</Prose>
        </ProseBlock>
        <ProseBlock title={i18n._(CHECK_TITLE)}>
          <Prose>{i18n._(CHECK_BODY)}</Prose>
          <p className="text-tale">
            <OutLink href={REPOSITORY}>{i18n._(CHECK_NAME)}</OutLink>
          </p>
        </ProseBlock>
      </Band>
      <PageKin pages={kin} />
      <Band className="pb-20">
        <DownloadButton />
      </Band>
    </>
  )
}
