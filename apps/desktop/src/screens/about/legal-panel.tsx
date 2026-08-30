import { Panel } from '@/components/layout/panel'
import { strings } from '@/constants/strings'

export const LegalPanel = () => {
  const words = strings.about

  return (
    <Panel className="mb-3">
      <section className="flex flex-col gap-2 px-4 py-3.5">
        <h2 className="text-row font-medium">{words.legalTitle}</h2>
        {words.legal.map(({ lead, body }) => {
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
