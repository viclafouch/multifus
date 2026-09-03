import { t } from '@lingui/core/macro'
import { Panel } from '@/components/layout/panel'

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

export const LegalPanel = () => {
  return (
    <Panel className="mb-3">
      <section className="flex flex-col gap-2 px-4 py-3.5">
        <h2 className="text-row font-medium">{t`Mentions légales`}</h2>
        {legalParagraphs().map(({ lead, body }) => {
          return (
            <p
              key={lead}
              className="max-w-prose text-note text-muted-foreground"
            >
              <strong className="font-medium text-foreground/90">{lead}</strong>{' '}
              {body}
            </p>
          )
        })}
      </section>
    </Panel>
  )
}
