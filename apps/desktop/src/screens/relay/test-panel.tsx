import { Send } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { TestStatus } from '@/@types/relay'
import type { Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { SectionRow } from '@/components/layout/section-row'
import { Button } from '@/components/ui/button'
import { relayFailureLine } from '@/helpers/wording'
import { testRelay } from '@/lib/multifus'

type TestPanelProps = Readonly<{
  test: TestStatus
  run: (action: Promise<Snapshot>) => void
}>

export const TestPanel = ({ test, run }: TestPanelProps) => {
  const isWorking = test.kind === 'working'
  const line = testLine(test)

  return (
    <Panel className="mb-3">
      <SectionRow
        title={t`Message d’essai`}
        description={t`Envoyez-vous un message maintenant, pour voir ce que ça donne dans Telegram.`}
      >
        <Button
          variant="secondary"
          size="sm"
          aria-busy={isWorking}
          aria-describedby={line === null ? undefined : 'relay-test'}
          onClick={() => {
            run(testRelay())
          }}
        >
          <Send aria-hidden />
          {isWorking ? t`Envoi…` : t`Envoyer un essai`}
        </Button>
      </SectionRow>
      {line === null ? null : (
        <p
          id="relay-test"
          role={test.kind === 'failed' ? 'alert' : 'status'}
          data-failed={test.kind === 'failed' ? '' : undefined}
          className="border-t border-border/70 px-4 py-2.5 text-note text-foreground/85 data-failed:text-destructive"
        >
          {line}
        </p>
      )}
    </Panel>
  )
}

const testLine = (test: TestStatus) => {
  if (test.kind === 'sent') {
    return t`C’est parti. Regardez votre téléphone.`
  }

  if (test.kind === 'tooSoon') {
    return t`Un essai vient de partir. Attendez une trentaine de secondes avant le suivant.`
  }

  if (test.kind === 'failed') {
    return relayFailureLine(test.reason)
  }

  return null
}
