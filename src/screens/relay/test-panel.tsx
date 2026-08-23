import { Send } from 'lucide-react'
import type { TestStatus } from '@/@types/relay'
import type { Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { SectionRow } from '@/components/layout/section-row'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { testRelay } from '@/lib/multifus'

type TestPanelProps = Readonly<{
  test: TestStatus
  run: (action: Promise<Snapshot>) => void
}>

/**
 * The one thing this screen can prove rather than claim. Third card, since it is
 * read once when the relay is set up and never again.
 */
export const TestPanel = ({ test, run }: TestPanelProps) => {
  const isWorking = test.kind === 'working'
  const line = testLine(test)

  return (
    <Panel className="mb-3">
      <SectionRow
        title={strings.relay.testTitle}
        description={strings.relay.testBody}
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
          {isWorking ? strings.relay.testing : strings.relay.testAction}
        </Button>
      </SectionRow>
      {line === null ? null : (
        <p
          // Not remounted: every outcome but « trop tôt » is reached through
          // `working`, where this node is gone, so a key would only break the
          // one text change a live region announces reliably.
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

/** What the last test had to say, `null` when none was ever asked for. */
const testLine = (test: TestStatus) => {
  if (test.kind === 'sent') {
    return strings.relay.testSent
  }

  if (test.kind === 'tooSoon') {
    return strings.relay.testTooSoon
  }

  if (test.kind === 'failed') {
    return strings.relay.failure[test.reason.reason](test.reason.detail)
  }

  return null
}
