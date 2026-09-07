import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import { Panel } from '@/components/layout/panel'
import { TOLERANCE_PROOFS } from '@/constants/tolerance'
import { ToleranceShot } from '@/screens/about/tolerance-shot'

const legalParagraphs = () => {
  return [
    {
      lead: t`Multifus n’a rien à voir avec Ankama.`,
      body: t`Dofus, Dofus Retro et les têtes de classe appartiennent à Ankama.`
    },
    {
      lead: t`Multifus ne touche pas au jeu.`,
      body: t`Ni sa mémoire, ni ses fichiers, ni ses paquets : il range vos fenêtres, lit les notifications et prend vos clics.`
    },
    {
      lead: t`Rien ne quitte votre ordinateur sans vous.`,
      body: t`Multifus cherche ses mises à jour, et relaie vos messages privés seulement si vous reliez Telegram.`
    }
  ]
}

const toleranceParagraphs = () => {
  return [
    {
      lead: t`Ankama tolère les gestionnaires de fenêtres.`,
      body: t`Elle l’a écrit deux fois en public, sur son forum et sur son compte X. Les deux messages sont ici, en entier.`
    },
    {
      lead: t`La limite, c’est le jeu lui-même.`,
      body: t`Un logiciel qui ouvre ses fichiers, ou qui joue à votre place, fait bannir le compte. Multifus range des fenêtres, et rien d’autre.`
    },
    {
      lead: t`Ankama ne répond pas de Multifus.`,
      body: t`Aucun outil de la communauté n’est soutenu par elle. Le code de Multifus est public : lisez-le, et n’installez que depuis sa page.`
    }
  ]
}

type LegalLineProps = Readonly<{
  lead: string
  body: string
}>

const LegalLine = ({ lead, body }: LegalLineProps) => {
  return (
    <p className="max-w-tale text-aside text-muted-foreground">
      <strong className="font-medium text-foreground/90">{lead}</strong> {body}
    </p>
  )
}

export const LegalPanel = () => {
  return (
    <Panel>
      <section className="flex flex-col gap-2 px-4 py-3.5">
        <h2 className="text-tale font-medium">{t`Mentions légales`}</h2>
        {legalParagraphs().map(({ lead, body }) => {
          return <LegalLine key={lead} lead={lead} body={body} />
        })}
      </section>
      <section className="flex flex-col gap-2 border-t border-band/25 px-4 py-3.5">
        <h2 className="text-tale font-medium">{t`Ce qu’Ankama autorise`}</h2>
        {toleranceParagraphs().map(({ lead, body }) => {
          return <LegalLine key={lead} lead={lead} body={body} />
        })}
        <ul className="mt-1.5 grid gap-3 sm:grid-cols-2">
          {TOLERANCE_PROOFS.map(({ link, shot, source }) => {
            return (
              <li key={link}>
                <ToleranceShot
                  shot={shot}
                  source={i18n._(source)}
                  link={link}
                />
              </li>
            )
          })}
        </ul>
      </section>
    </Panel>
  )
}
